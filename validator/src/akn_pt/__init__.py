# SPDX-License-Identifier: EUPL-1.2
# Copyright (c) 2026 SGGOV / DAPL
"""AKN-PT reference validator and library.

Public API:
    validate(xml: bytes|str|Path, phase: str = "publication", lang: str = "pt") -> ValidationReport
    ValidationReport — structured result of XSD + Schematron validation
    Phase — Enum-like values: "drafting", "review", "publication"
"""
from __future__ import annotations

from .core import Phase, ValidationReport, validate
from .i18n import set_language

__all__ = ["validate", "ValidationReport", "Phase", "set_language"]

__version__ = "0.1.0"
