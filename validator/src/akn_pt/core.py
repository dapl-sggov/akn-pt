# SPDX-License-Identifier: EUPL-1.2
"""Core validation engine — XSD + Schematron for AKN-PT documents."""
from __future__ import annotations

import re
import time
from dataclasses import dataclass, field
from enum import Enum
from importlib import resources
from pathlib import Path

from lxml import etree, isoschematron

from . import i18n

# Type alias for input
XmlInput = bytes | str | Path

# Stable message ID extraction. Schematron asserts/reports are prefixed with
# "[CODE-NNNN] message" (e.g. "[STR-0001] akomaNtoso deve conter...").
# This regex extracts the ID and strips it from the visible message.
_MSG_ID_RE = re.compile(r"^\s*\[([A-Z]{2,5}-\d{4})\]\s*(.*)$", re.DOTALL)


def _split_message_id(text: str) -> tuple[str, str]:
    """Return (message_id, clean_message). If no ID prefix, returns ("", text)."""
    if not text:
        return "", ""
    m = _MSG_ID_RE.match(text)
    if not m:
        return "", text.strip()
    return m.group(1), m.group(2).strip()


class Phase(str, Enum):
    """Validation phases (per ADR-0004)."""
    DRAFTING = "drafting"
    REVIEW = "review"
    PUBLICATION = "publication"


class Severity(str, Enum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


@dataclass
class Issue:
    """A single validation issue (XSD or Schematron)."""
    severity: Severity
    source: str          # "xsd" or "schematron"
    pattern: str         # schematron pattern id (empty for XSD)
    rule: str            # schematron rule context (empty for XSD)
    location: str        # XPath of the offending element
    message: str         # human-readable message (PT by default)
    line: int = 0
    message_id: str = "" # stable ID extracted from message prefix (e.g. "STR-0001")


@dataclass
class ValidationReport:
    """Aggregated validation result for one document."""
    valid: bool = False
    phase: str = "publication"
    lang: str = "pt"
    input_path: str = ""
    xsd_ok: bool = False
    schematron_ok: bool = False
    errors: list[Issue] = field(default_factory=list)
    warnings: list[Issue] = field(default_factory=list)
    elapsed_ms: int = 0
    act_type: str = ""
    act_subtype: str = ""
    doc_number: str = ""
    has_footprint: bool = False
    footprint_summary: dict | None = None

    def to_dict(self) -> dict:
        return {
            "input": self.input_path,
            "phase": self.phase,
            "lang": self.lang,
            "valid": self.valid,
            "xsd": {
                "valid": self.xsd_ok,
                "errors": [
                    {"line": e.line, "message": e.message}
                    for e in self.errors if e.source == "xsd"
                ],
            },
            "schematron": {
                "valid": self.schematron_ok,
                "errors": [
                    {
                        "id": e.message_id, "severity": e.severity.value,
                        "pattern": e.pattern, "rule": e.rule,
                        "location": e.location, "message": e.message,
                    }
                    for e in self.errors if e.source == "schematron"
                ],
                "warnings": [
                    {
                        "id": w.message_id, "severity": w.severity.value,
                        "pattern": w.pattern, "rule": w.rule,
                        "location": w.location, "message": w.message,
                    }
                    for w in self.warnings
                ],
            },
            "summary": {
                "errors": len(self.errors),
                "warnings": len(self.warnings),
                "elapsed_ms": self.elapsed_ms,
            },
            "document": {
                "act_type": self.act_type,
                "act_subtype": self.act_subtype,
                "doc_number": self.doc_number,
                "has_legislative_footprint": self.has_footprint,
                "footprint_summary": self.footprint_summary,
            },
        }


# -----------------------------------------------------------------------------
# Schema loading (cached)
# -----------------------------------------------------------------------------
_XSD_CACHE: etree.XMLSchema | None = None
_SCH_CACHE: isoschematron.Schematron | None = None


def _data_path(filename: str) -> Path:
    """Resolve a bundled schema file to a filesystem path."""
    return Path(str(resources.files("akn_pt.data") / filename))


def get_xsd() -> etree.XMLSchema:
    """Load and cache the AKN-PT XSD."""
    global _XSD_CACHE
    if _XSD_CACHE is None:
        _XSD_CACHE = etree.XMLSchema(etree.parse(str(_data_path("akn-pt.xsd"))))
    return _XSD_CACHE


def get_schematron() -> isoschematron.Schematron:
    """Load and cache the AKN-PT Schematron."""
    global _SCH_CACHE
    if _SCH_CACHE is None:
        _SCH_CACHE = isoschematron.Schematron(
            etree.parse(str(_data_path("akn-pt-rules.sch"))),
            store_report=True,
        )
    return _SCH_CACHE


# -----------------------------------------------------------------------------
# Validation pipeline
# -----------------------------------------------------------------------------
AKN_NS = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17"
AKN_PT_NS = "http://eli.gov.pt/ns/akn-pt/1.0"
SVRL_NS = "http://purl.oclc.org/dsdl/svrl"


def _parse(xml: XmlInput) -> tuple[etree._ElementTree, str]:
    """Parse input into an ElementTree, return (tree, input_path_str)."""
    if isinstance(xml, (str, Path)):
        path = Path(xml)
        if path.is_file():
            return etree.parse(str(path)), str(path)
        # treat as string content if not a file
        return etree.ElementTree(etree.fromstring(str(xml).encode("utf-8"))), ""
    if isinstance(xml, bytes):
        return etree.ElementTree(etree.fromstring(xml)), ""
    raise TypeError(f"Unsupported input type: {type(xml).__name__}")


def _extract_metadata(tree: etree._ElementTree) -> dict:
    """Extract act_type, subtype, doc_number, footprint info from the XML."""
    ns = {"akn": AKN_NS}
    root = tree.getroot()
    info = {"act_type": "", "act_subtype": "", "doc_number": "",
            "has_footprint": False, "footprint_summary": None}

    act = root.find("akn:act", ns)
    if act is not None:
        info["act_type"] = act.get("name", "")

    subtype = root.find(".//akn:FRBRWork/akn:FRBRsubtype", ns)
    if subtype is not None:
        info["act_subtype"] = subtype.get("value", "")

    number = root.find(".//akn:FRBRWork/akn:FRBRnumber", ns)
    if number is not None:
        info["doc_number"] = number.get("value", "")

    # workflow vive no namespace akn-pt: (ADR-0011)
    ns_pt = {"akn": AKN_NS, "akn-pt": AKN_PT_NS}
    workflow = root.find(".//akn:meta/akn-pt:workflow", ns_pt)
    if workflow is not None:
        info["has_footprint"] = True
        steps = workflow.findall("akn-pt:step", ns_pt)
        inputs = workflow.findall(".//akn-pt:input", ns_pt)
        info["footprint_summary"] = {
            "n_steps": len(steps),
            "n_inputs": len(inputs),
            "step_types": [s.get("refersTo", "").lstrip("#") for s in steps],
            "contributors": [
                {
                    "source": i.get("source", ""),
                    "type": i.get("type", ""),
                    "date": i.get("date", ""),
                }
                for i in inputs
            ],
        }
    return info


def _collect_xsd_errors(error_log) -> list[Issue]:
    out = []
    for err in error_log:
        out.append(Issue(
            severity=Severity.ERROR,
            source="xsd",
            pattern="",
            rule="",
            location="",
            message=err.message,
            line=err.line,
        ))
    return out


def _collect_schematron_issues(report) -> tuple[list[Issue], list[Issue]]:
    """Split Schematron SVRL report into errors and warnings."""
    errors: list[Issue] = []
    warnings: list[Issue] = []
    if report is None:
        return errors, warnings

    for fa in report.findall(f".//{{{SVRL_NS}}}failed-assert"):
        sev = Severity.WARNING if fa.get("role") == "warning" else Severity.ERROR
        text = fa.find(f"{{{SVRL_NS}}}text")
        raw = (text.text or "") if text is not None else ""
        mid, clean = _split_message_id(raw)
        issue = Issue(
            severity=sev,
            source="schematron",
            pattern=_find_pattern_id(fa),
            rule=fa.get("test", ""),
            location=fa.get("location", ""),
            message=clean,
            message_id=mid,
        )
        (warnings if sev == Severity.WARNING else errors).append(issue)

    for sr in report.findall(f".//{{{SVRL_NS}}}successful-report"):
        # successful-report = sch:report fired = a (typically warning) condition was met
        sev = Severity.WARNING if sr.get("role") == "warning" else Severity.INFO
        text = sr.find(f"{{{SVRL_NS}}}text")
        raw = (text.text or "") if text is not None else ""
        mid, clean = _split_message_id(raw)
        warnings.append(Issue(
            severity=sev,
            source="schematron",
            pattern=_find_pattern_id(sr),
            rule=sr.get("test", ""),
            location=sr.get("location", ""),
            message=clean,
            message_id=mid,
        ))

    return errors, warnings


# eId vs num coherence check (Python, não Schematron — XPath 1.0 não permite
# expressar isto de forma robusta). Activa em todas as fases (parte do
# pattern lógico "referential-integrity"). IDs reservados:
#   STR-0010  artigo: eId art_N não bate com num "Artigo N.º"
#   STR-0011  paragrafo: eId art_N__para_M não bate com num "M -" (ou "M.")
#   STR-0012  alínea: eId art_N__para_M__lit_X não bate com num "X)"
_RE_ART_EID  = re.compile(r"^art_(\d+)$")
_RE_ART_NUM  = re.compile(r"^\s*Artigo\s+(\d+)\.[ºo°]?\s*$", re.IGNORECASE)
_RE_PARA_EID = re.compile(r"^art_\d+__para_(\d+)$|^para_(\d+)$")
_RE_PARA_NUM = re.compile(r"^\s*(\d+)\s*[-.–—]\s*$")
_RE_LIT_EID  = re.compile(r"^.+__lit_([a-z])$")
_RE_LIT_NUM  = re.compile(r"^\s*([a-z])\s*\)\s*$")


def _check_eid_num_coherence(tree: etree._ElementTree) -> list[Issue]:
    """Verifica que o eId e o <num> visível são coerentes em ordem sequencial.

    Limitações conscientes (não falha):
      - Artigos com sufixo intencional (num "Artigo 5.º-A" → eId art_6) — skip;
      - Parágrafos com num vazio (intro/único) — skip;
      - eIds não-canónicos (e.g. quoted__art_1 em diplomas alteradores) — skip.
    """
    issues: list[Issue] = []
    ns = {"akn": AKN_NS}

    # Artigos
    for art in tree.findall(".//akn:body//akn:article", ns):
        eId = art.get("eId", "")
        num_el = art.find("akn:num", ns)
        if not eId or num_el is None:
            continue
        num_text = (num_el.text or "").strip()
        m_eid = _RE_ART_EID.match(eId)
        m_num = _RE_ART_NUM.match(num_text)
        if not (m_eid and m_num):
            continue  # sufixos ou formatos não-canónicos — skip silenciosamente
        if m_eid.group(1) != m_num.group(1):
            issues.append(Issue(
                severity=Severity.ERROR,
                source="schematron",
                pattern="referential-integrity",
                rule="eId↔num coherence (article)",
                location=f"//article[@eId='{eId}']",
                message=(f"eId '{eId}' não bate com num '{num_text}' — "
                         f"o eId indica artigo {m_eid.group(1)} mas o num indica artigo {m_num.group(1)}."),
                message_id="STR-0010",
            ))

    # Parágrafos numerados (paragraph com num "N -" e eId terminado em para_N)
    for p in tree.findall(".//akn:paragraph", ns):
        eId = p.get("eId", "")
        num_el = p.find("akn:num", ns)
        if not eId or num_el is None:
            continue
        num_text = (num_el.text or "").strip()
        if not num_text:
            continue  # paragraph único / intro — skip
        m_eid = _RE_PARA_EID.match(eId)
        m_num = _RE_PARA_NUM.match(num_text)
        if not (m_eid and m_num):
            continue
        eid_n = m_eid.group(1) or m_eid.group(2)
        if eid_n != m_num.group(1):
            issues.append(Issue(
                severity=Severity.ERROR,
                source="schematron",
                pattern="referential-integrity",
                rule="eId↔num coherence (paragraph)",
                location=f"//paragraph[@eId='{eId}']",
                message=(f"eId '{eId}' não bate com num '{num_text}' — "
                         f"o eId indica parágrafo {eid_n} mas o num indica {m_num.group(1)}."),
                message_id="STR-0011",
            ))

    # Alíneas (point) com num "a)", "b)", ... e eId ...__lit_a, ...__lit_b
    for pt in tree.findall(".//akn:point", ns):
        eId = pt.get("eId", "")
        num_el = pt.find("akn:num", ns)
        if not eId or num_el is None:
            continue
        num_text = (num_el.text or "").strip()
        m_eid = _RE_LIT_EID.match(eId)
        m_num = _RE_LIT_NUM.match(num_text)
        if not (m_eid and m_num):
            continue
        if m_eid.group(1).lower() != m_num.group(1).lower():
            issues.append(Issue(
                severity=Severity.ERROR,
                source="schematron",
                pattern="referential-integrity",
                rule="eId↔num coherence (point)",
                location=f"//point[@eId='{eId}']",
                message=(f"eId '{eId}' não bate com num '{num_text}' — "
                         f"o eId indica alínea {m_eid.group(1)} mas o num indica {m_num.group(1)}."),
                message_id="STR-0012",
            ))

    return issues


def _find_pattern_id(node) -> str:
    """Walk back the SVRL report to find the enclosing pattern id.

    lxml's isoschematron emits `<svrl:active-pattern id="...">` markers; some
    other processors use `<svrl:fired-pattern>`. We check both.
    """
    active = f"{{{SVRL_NS}}}active-pattern"
    fired = f"{{{SVRL_NS}}}fired-pattern"
    prev = node.getprevious()
    while prev is not None:
        if prev.tag in (active, fired):
            return prev.get("id", "") or prev.get("name", "")
        prev = prev.getprevious()
    return ""


# -----------------------------------------------------------------------------
# Public API
# -----------------------------------------------------------------------------
def validate(
    xml: XmlInput,
    phase: str = "publication",
    lang: str = "pt",
) -> ValidationReport:
    """Validate one AKN-PT document.

    Args:
        xml: path to .akn.xml file, bytes, or string content.
        phase: 'drafting' | 'review' | 'publication'. Default publication.
        lang: 'pt' (default) | 'en'. Affects only validator labels, not assertion text.

    Returns:
        ValidationReport with structured results.

    Note:
        The Schematron is invoked unfiltered (all patterns); phase filtering is
        applied post-hoc by inspecting fired pattern ids. This is a v0.1.0
        simplification — in production, the Schematron should be re-compiled
        per phase for performance.
    """
    if phase not in {p.value for p in Phase}:
        raise ValueError(f"Unknown phase: {phase!r}. Must be one of {[p.value for p in Phase]}.")
    if lang not in {"pt", "en"}:
        raise ValueError(f"Unknown language: {lang!r}. Must be 'pt' or 'en'.")

    i18n.set_language(lang)
    started = time.monotonic()

    tree, input_path = _parse(xml)
    report = ValidationReport(
        phase=phase, lang=lang, input_path=input_path,
    )
    report.__dict__.update(_extract_metadata(tree))

    # Step 1: XSD
    xsd = get_xsd()
    if xsd.validate(tree):
        report.xsd_ok = True
    else:
        report.errors.extend(_collect_xsd_errors(xsd.error_log))
        report.valid = False
        report.elapsed_ms = int((time.monotonic() - started) * 1000)
        return report

    # Step 2: Schematron — validate() returns bool but we read the report directly.
    sch = get_schematron()
    sch.validate(tree)
    sch_errors, sch_warnings = _collect_schematron_issues(sch.validation_report)

    # Step 2b: Python-side eId↔num coherence (não exprimível em XPath 1.0).
    # Pertence logicamente a referential-integrity, portanto sujeita-se ao
    # filtro de fase como qualquer outro pattern do Schematron.
    eid_num_issues = _check_eid_num_coherence(tree)
    sch_errors.extend(eid_num_issues)

    # Filter by phase: keep only issues from patterns active in this phase.
    active_patterns = _active_patterns(phase)
    sch_errors = [i for i in sch_errors if not i.pattern or i.pattern in active_patterns]
    sch_warnings = [i for i in sch_warnings if not i.pattern or i.pattern in active_patterns]

    report.schematron_ok = not sch_errors
    report.errors.extend(sch_errors)
    report.warnings.extend(sch_warnings)
    report.valid = report.xsd_ok and report.schematron_ok
    report.elapsed_ms = int((time.monotonic() - started) * 1000)
    return report


_PHASE_PATTERNS = {
    "drafting": {"structural-integrity", "referential-integrity"},
    "review": {
        "structural-integrity", "referential-integrity",
        "metadata-completeness", "act-type-coherence", "subtype-coherence",
        "legistica-conventions",
    },
    "publication": {
        "structural-integrity", "referential-integrity",
        "metadata-completeness", "act-type-coherence", "subtype-coherence",
        "legistica-conventions", "lifecycle-coherence", "frbr-uri-consistency",
        "legislative-footprint", "temporal-consistency",
    },
}


def _active_patterns(phase: str) -> set[str]:
    return _PHASE_PATTERNS.get(phase, _PHASE_PATTERNS["publication"])
