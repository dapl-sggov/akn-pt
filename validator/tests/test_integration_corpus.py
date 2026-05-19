# SPDX-License-Identifier: EUPL-1.2
"""Integration tests — validate the full corpus via the validator API."""
from __future__ import annotations

from pathlib import Path

import pytest

from akn_pt import validate

REPO_ROOT = Path(__file__).resolve().parents[2]
CORPUS_FILES = sorted((REPO_ROOT / "corpus").rglob("*.akn.xml"))
SCHEMA_POSITIVES = sorted((REPO_ROOT / "schema" / "tests" / "positive").rglob("*.akn.xml"))


@pytest.mark.parametrize("xml_path", CORPUS_FILES, ids=lambda p: p.name)
def test_corpus_validates_in_publication_phase(xml_path):
    report = validate(xml_path, phase="publication")
    assert report.valid is True, (
        f"{xml_path.name}: " +
        "; ".join(e.message[:120] for e in report.errors)
    )


@pytest.mark.parametrize("xml_path", SCHEMA_POSITIVES, ids=lambda p: p.name)
def test_schema_positives_pass_publication_phase(xml_path):
    report = validate(xml_path, phase="publication")
    assert report.valid is True, (
        f"{xml_path.name}: " +
        "; ".join(e.message[:120] for e in report.errors)
    )
