# SPDX-License-Identifier: EUPL-1.2
"""Core validation engine — XSD + Schematron for AKN-PT documents."""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from importlib import resources
from pathlib import Path
from typing import Union

from lxml import etree, isoschematron

from . import i18n

# Type alias for input
XmlInput = Union[bytes, str, Path]


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
                        "severity": e.severity.value, "pattern": e.pattern,
                        "rule": e.rule, "location": e.location, "message": e.message,
                    }
                    for e in self.errors if e.source == "schematron"
                ],
                "warnings": [
                    {
                        "severity": w.severity.value, "pattern": w.pattern,
                        "rule": w.rule, "location": w.location, "message": w.message,
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

    workflow = root.find(".//akn:meta/akn:workflow", ns)
    if workflow is not None:
        info["has_footprint"] = True
        steps = workflow.findall("akn:step", ns)
        inputs = workflow.findall(".//akn:input", ns)
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
        issue = Issue(
            severity=sev,
            source="schematron",
            pattern=_find_pattern_id(fa),
            rule=fa.get("test", ""),
            location=fa.get("location", ""),
            message=(text.text or "").strip() if text is not None else "",
        )
        (warnings if sev == Severity.WARNING else errors).append(issue)

    for sr in report.findall(f".//{{{SVRL_NS}}}successful-report"):
        # successful-report = sch:report fired = a (typically warning) condition was met
        sev = Severity.WARNING if sr.get("role") == "warning" else Severity.INFO
        text = sr.find(f"{{{SVRL_NS}}}text")
        warnings.append(Issue(
            severity=sev,
            source="schematron",
            pattern=_find_pattern_id(sr),
            rule=sr.get("test", ""),
            location=sr.get("location", ""),
            message=(text.text or "").strip() if text is not None else "",
        ))

    return errors, warnings


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

    # Step 2: Schematron
    sch = get_schematron()
    sch_ok_xpath = sch.validate(tree)
    sch_errors, sch_warnings = _collect_schematron_issues(sch.validation_report)

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
        "legislative-footprint",
    },
}


def _active_patterns(phase: str) -> set[str]:
    return _PHASE_PATTERNS.get(phase, _PHASE_PATTERNS["publication"])
