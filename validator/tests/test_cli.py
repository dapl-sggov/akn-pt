# SPDX-License-Identifier: EUPL-1.2
"""CLI integration tests."""
from __future__ import annotations

from pathlib import Path

import pytest
from click.testing import CliRunner

from akn_pt.cli import main

REPO_ROOT = Path(__file__).resolve().parents[2]
DL_SIMPLE = REPO_ROOT / "corpus" / "dec-lei" / "dl-72-2020.akn.xml"
DL_WITH_FOOTPRINT = REPO_ROOT / "schema" / "tests" / "positive" / "dec-lei-with-footprint.akn.xml"
XSD_NEGATIVE = REPO_ROOT / "schema" / "tests" / "negative" / "n01-unknown-act-name.akn.xml"
CORPUS_DIR = REPO_ROOT / "corpus"


@pytest.fixture
def runner():
    return CliRunner()


def test_version(runner):
    result = runner.invoke(main, ["--version"])
    assert result.exit_code == 0
    assert "0.1.0" in result.output


def test_validate_ok(runner):
    result = runner.invoke(main, ["validate", str(DL_SIMPLE)])
    assert result.exit_code == 0
    assert "Documento" in result.output or "valid" in result.output.lower()


def test_validate_quiet(runner):
    result = runner.invoke(main, ["validate", str(DL_SIMPLE), "--quiet"])
    assert result.exit_code == 0
    assert result.output.strip() == "OK"


def test_validate_fails_with_exit_1(runner):
    result = runner.invoke(main, ["validate", str(XSD_NEGATIVE)])
    assert result.exit_code == 1


def test_validate_json_output(runner):
    result = runner.invoke(main, ["validate", str(DL_SIMPLE), "--json"])
    assert result.exit_code == 0
    assert '"valid": true' in result.output
    assert '"act_type": "dec-lei"' in result.output


def test_validate_lang_en(runner):
    result = runner.invoke(main, ["validate", str(DL_SIMPLE), "--lang", "en"])
    assert result.exit_code == 0
    assert "Document" in result.output
    assert "Validation" in result.output


def test_validate_phase_drafting(runner):
    """Drafting phase is more lenient — should still pass on a clean doc."""
    result = runner.invoke(main, ["validate", str(DL_SIMPLE), "--phase", "drafting"])
    assert result.exit_code == 0


def test_validate_footprint_present(runner):
    result = runner.invoke(main, ["validate", str(DL_WITH_FOOTPRINT), "-v"])
    assert "egada legislativa" in result.output or "ootprint" in result.output


def test_batch_corpus_ok(runner):
    result = runner.invoke(main, ["batch", str(CORPUS_DIR)])
    assert result.exit_code == 0
    # Corpus pode crescer (e.g. pressure tests v0.1.1 — CIRS excerpt em
    # Maio/2026); só asserto que TODOS são OK (zero falhas).
    assert "0 failed" in result.output


def test_schema_path(runner):
    result = runner.invoke(main, ["schema-path"])
    assert result.exit_code == 0
    assert "akn_pt" in result.output and "data" in result.output


def test_help(runner):
    result = runner.invoke(main, ["--help"])
    assert result.exit_code == 0
    assert "validate" in result.output
    assert "batch" in result.output
