# SPDX-License-Identifier: EUPL-1.2
"""Unit tests for the core validator engine."""
from __future__ import annotations

from pathlib import Path

import pytest

from akn_pt import Phase, ValidationReport, validate
from akn_pt.core import _active_patterns

REPO_ROOT = Path(__file__).resolve().parents[2]


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def corpus_dl_simple() -> Path:
    return REPO_ROOT / "corpus" / "dec-lei" / "dl-72-2020.akn.xml"


@pytest.fixture
def corpus_rcm() -> Path:
    return REPO_ROOT / "corpus" / "res-cm" / "rcm-53-2020.akn.xml"


@pytest.fixture
def corpus_dlr() -> Path:
    return REPO_ROOT / "corpus" / "dlr" / "dlr-19-2020-A.akn.xml"


@pytest.fixture
def positive_minimal_dl() -> Path:
    return REPO_ROOT / "schema" / "tests" / "positive" / "dec-lei-minimal.akn.xml"


@pytest.fixture
def footprint_positive() -> Path:
    return REPO_ROOT / "schema" / "tests" / "positive" / "dec-lei-with-footprint.akn.xml"


@pytest.fixture
def xsd_negative() -> Path:
    return REPO_ROOT / "schema" / "tests" / "negative" / "n01-unknown-act-name.akn.xml"


@pytest.fixture
def schematron_negative_rcm_article() -> Path:
    return REPO_ROOT / "schema" / "tests" / "schematron-negative" / "s02-rcm-with-article.akn.xml"


@pytest.fixture
def schematron_negative_footprint_missing() -> Path:
    return REPO_ROOT / "schema" / "tests" / "schematron-negative" / "s11-footprint-missing-after-cutoff.akn.xml"


# ---------------------------------------------------------------------------
# Basic validation
# ---------------------------------------------------------------------------
def test_validate_valid_dl(corpus_dl_simple):
    report = validate(corpus_dl_simple)
    assert isinstance(report, ValidationReport)
    assert report.valid is True
    assert report.xsd_ok is True
    assert report.schematron_ok is True
    assert report.act_type == "dec-lei"
    assert report.act_subtype == "dec-lei-ordinario"
    assert report.doc_number == "72"
    assert len(report.errors) == 0


def test_validate_rcm(corpus_rcm):
    """RCM uses <paragraph> (no <article>)."""
    report = validate(corpus_rcm)
    assert report.valid is True
    assert report.act_type == "res-cm"


def test_validate_regional_dlr(corpus_dlr):
    """DLR has jurisdiction pt-20 and is signed by the Representative of the Republic."""
    report = validate(corpus_dlr)
    assert report.valid is True
    assert report.act_type == "dlr"


def test_validate_minimal_positive(positive_minimal_dl):
    report = validate(positive_minimal_dl)
    assert report.valid is True


# ---------------------------------------------------------------------------
# Negative cases
# ---------------------------------------------------------------------------
def test_xsd_negative_fails(xsd_negative):
    report = validate(xsd_negative)
    assert report.valid is False
    assert report.xsd_ok is False
    assert len(report.errors) >= 1


def test_schematron_negative_rcm_with_article(schematron_negative_rcm_article):
    """Should pass XSD but fail Schematron."""
    report = validate(schematron_negative_rcm_article)
    assert report.xsd_ok is True
    assert report.schematron_ok is False
    assert report.valid is False
    # Should contain an error about <article> in RCM body
    msgs = " ".join(e.message for e in report.errors).lower()
    assert "article" in msgs or "rcm" in msgs or "body" in msgs


def test_footprint_missing_fails(schematron_negative_footprint_missing):
    """Acts published after 2026-07-27 without workflow must fail in publication phase."""
    report = validate(schematron_negative_footprint_missing, phase="publication")
    assert report.valid is False
    assert any("workflow" in e.message.lower() or "pegada" in e.message.lower()
               for e in report.errors)


# ---------------------------------------------------------------------------
# Phases
# ---------------------------------------------------------------------------
def test_phase_drafting_lenient(schematron_negative_footprint_missing):
    """In drafting phase, footprint absence is not an error (pattern not active)."""
    report = validate(schematron_negative_footprint_missing, phase="drafting")
    # Document still has act/@name and structure, so drafting passes
    assert report.xsd_ok is True
    # Drafting phase doesn't check footprint
    assert report.valid is True or all(
        "workflow" not in e.message.lower() and "pegada" not in e.message.lower()
        for e in report.errors
    )


def test_active_patterns_drafting():
    patterns = _active_patterns("drafting")
    assert "structural-integrity" in patterns
    assert "legislative-footprint" not in patterns


def test_active_patterns_publication():
    patterns = _active_patterns("publication")
    assert "structural-integrity" in patterns
    assert "legislative-footprint" in patterns
    assert "frbr-uri-consistency" in patterns


# ---------------------------------------------------------------------------
# Footprint extraction
# ---------------------------------------------------------------------------
def test_footprint_extracted(footprint_positive):
    report = validate(footprint_positive)
    assert report.valid is True
    assert report.has_footprint is True
    fs = report.footprint_summary
    assert fs is not None
    assert fs["n_steps"] >= 3
    assert fs["n_inputs"] >= 1
    assert "iniciativa" in fs["step_types"]
    assert "publicacao" in fs["step_types"]


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------
def test_invalid_phase_raises():
    with pytest.raises(ValueError, match="Unknown phase"):
        validate(b"<x/>", phase="invalid-phase")


def test_invalid_lang_raises():
    with pytest.raises(ValueError, match="Unknown language"):
        validate(b"<x/>", lang="de")


# ---------------------------------------------------------------------------
# API surface
# ---------------------------------------------------------------------------
def test_phase_enum_values():
    assert Phase.DRAFTING.value == "drafting"
    assert Phase.REVIEW.value == "review"
    assert Phase.PUBLICATION.value == "publication"


def test_report_to_dict(corpus_dl_simple):
    report = validate(corpus_dl_simple)
    d = report.to_dict()
    assert d["valid"] is True
    assert d["phase"] == "publication"
    assert d["xsd"]["valid"] is True
    assert d["document"]["act_type"] == "dec-lei"
    assert "summary" in d
