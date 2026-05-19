# SPDX-License-Identifier: EUPL-1.2
"""Rendering of ValidationReport in text and JSON formats."""
from __future__ import annotations

import json

from .core import ValidationReport
from .i18n import t


def render_text(report: ValidationReport, quiet: bool = False, verbose: bool = False) -> str:
    """Render a ValidationReport as human-readable text (PT or EN per report.lang)."""
    lines: list[str] = []

    if quiet:
        return "OK" if report.valid else "FAIL"

    # XSD line
    if report.xsd_ok:
        lines.append(f"  {t('xsd_ok')}")
    else:
        lines.append(f"  {t('xsd_fail')}")

    # Schematron line
    if report.xsd_ok:
        if report.schematron_ok:
            lines.append(f"  {t('schematron_ok')} ({report.phase})")
        else:
            lines.append(f"  {t('schematron_fail')} ({report.phase})")

    # Document metadata
    if report.act_type:
        lines.append("")
        lines.append(f"  {t('document')}: {report.act_type}"
                     + (f" n.o {report.doc_number}" if report.doc_number else ""))
        if report.act_subtype:
            lines.append(f"  {t('subtype')}: {report.act_subtype}")

    # Footprint summary (when present)
    if report.has_footprint and report.footprint_summary:
        fs = report.footprint_summary
        lines.append("")
        lines.append(f"  {t('footprint_present')}: {fs.get('n_steps', 0)} {t('footprint_steps')}, "
                     f"{fs.get('n_inputs', 0)} {t('footprint_inputs')}")
        if verbose:
            steps = ", ".join(fs.get("step_types", []))
            lines.append(f"    {t('step_types')}: {steps}")
            for c in fs.get("contributors", []):
                lines.append(f"    - {c['source']} ({c['type']}, {c['date']})")

    # Errors
    if report.errors:
        lines.append("")
        for e in report.errors:
            tag = t("error_at")
            loc = e.location or (f"line {e.line}" if e.line else "?")
            lines.append(f"  {tag} {loc}")
            lines.append(f"    {e.message}")
            if verbose and e.pattern:
                lines.append(f"    ({t('pattern')}: {e.pattern})")

    # Warnings
    if report.warnings:
        lines.append("")
        for w in report.warnings:
            tag = t("warning_at")
            loc = w.location or "?"
            lines.append(f"  {tag} {loc}")
            lines.append(f"    {w.message}")
            if verbose and w.pattern:
                lines.append(f"    ({t('pattern')}: {w.pattern})")

    # Summary
    lines.append("")
    summary_word = t("valid") if report.valid else t("invalid")
    lines.append(
        f"  {summary_word}: {len(report.errors)} {t('errors')}, "
        f"{len(report.warnings)} {t('warnings')}, {report.elapsed_ms} ms"
    )

    return "\n".join(lines)


def render_json(report: ValidationReport) -> str:
    """Render a ValidationReport as JSON."""
    return json.dumps(report.to_dict(), ensure_ascii=False, indent=2)
