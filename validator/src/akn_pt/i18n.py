# SPDX-License-Identifier: EUPL-1.2
"""Minimal i18n for validator labels (not Schematron assertion text).

Schematron assertion messages are emitted in PT (the source). Translation of
each assertion to EN is planned for v0.1.1 via stable message ids; for v0.1.0
this module translates only the validator's own UI labels (headers, summaries,
status words).
"""
from __future__ import annotations

from typing import Literal

Lang = Literal["pt", "en"]
_current_lang: Lang = "pt"


_LABELS = {
    "pt": {
        "valid": "Validação completa",
        "invalid": "Validação falhou",
        "xsd_ok": "XSD válido",
        "xsd_fail": "XSD falhou",
        "schematron_ok": "Schematron válido",
        "schematron_fail": "Schematron falhou",
        "errors": "erros",
        "warnings": "avisos",
        "phase": "fase",
        "elapsed": "tempo",
        "document": "Documento",
        "type": "Tipo",
        "subtype": "Subtipo",
        "number": "Número",
        "error_at": "ERRO em",
        "warning_at": "AVISO em",
        "pattern": "padrão",
        "rule": "regra",
        "footprint_present": "Pegada legislativa: presente",
        "footprint_absent": "Pegada legislativa: ausente",
        "footprint_steps": "passos",
        "footprint_inputs": "contributos externos",
        "step_types": "Tipos de passo",
        "contributors": "Contributos",
        "summary": "Resumo",
    },
    "en": {
        "valid": "Validation passed",
        "invalid": "Validation failed",
        "xsd_ok": "XSD valid",
        "xsd_fail": "XSD failed",
        "schematron_ok": "Schematron valid",
        "schematron_fail": "Schematron failed",
        "errors": "errors",
        "warnings": "warnings",
        "phase": "phase",
        "elapsed": "elapsed",
        "document": "Document",
        "type": "Type",
        "subtype": "Subtype",
        "number": "Number",
        "error_at": "ERROR at",
        "warning_at": "WARNING at",
        "pattern": "pattern",
        "rule": "rule",
        "footprint_present": "Legislative footprint: present",
        "footprint_absent": "Legislative footprint: absent",
        "footprint_steps": "steps",
        "footprint_inputs": "external inputs",
        "step_types": "Step types",
        "contributors": "Contributors",
        "summary": "Summary",
    },
}


def set_language(lang: Lang) -> None:
    """Set the active language ('pt' or 'en')."""
    global _current_lang
    if lang not in _LABELS:
        raise ValueError(f"Unknown language {lang!r}; supported: pt, en")
    _current_lang = lang


def get_language() -> Lang:
    return _current_lang


def t(key: str) -> str:
    """Translate a label key. Falls back to PT if missing in target lang."""
    return _LABELS[_current_lang].get(key) or _LABELS["pt"].get(key) or key
