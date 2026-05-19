# SPDX-License-Identifier: EUPL-1.2
"""Testes do conversor ELI-PT ↔ dre.pt legacy.

Cobre amostras representativas por tipo de ato e os casos de erro.
"""
import sys
from pathlib import Path

# Allow running standalone without installing the package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from conversion import (  # noqa: E402
    EliId,
    dre_to_eli,
    eli_to_dre_legacy,
    parse_dre,
    parse_eli,
)


@pytest.mark.parametrize(
    ("legacy", "expected_eli"),
    [
        (
            "https://dre.pt/dre/detalhe/decreto-lei/22-2026-100000000",
            "https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt",
        ),
        (
            "https://dre.pt/dre/detalhe/lei/12-2026-200000000",
            "https://eli.gov.pt/eli/pt/lei/2026/12/pt",
        ),
        (
            "https://dre.pt/dre/detalhe/portaria/87-2026-300000000",
            "https://eli.gov.pt/eli/pt/portaria/2026/87/pt",
        ),
        (
            "https://dre.pt/dre/detalhe/resolucao-do-conselho-de-ministros/45-2026-400000000",
            "https://eli.gov.pt/eli/pt/res-cm/2026/45/pt",
        ),
        (
            # Sem hash legado
            "https://dre.pt/dre/detalhe/decreto-lei/22-2026",
            "https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt",
        ),
    ],
)
def test_dre_to_eli(legacy: str, expected_eli: str) -> None:
    assert dre_to_eli(legacy) == expected_eli


@pytest.mark.parametrize(
    ("eli_uri", "expected_legacy"),
    [
        (
            "https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt",
            "https://dre.pt/dre/detalhe/decreto-lei/22-2026",
        ),
        (
            "https://eli.gov.pt/eli/pt/lei/2026/12/pt",
            "https://dre.pt/dre/detalhe/lei/12-2026",
        ),
        (
            "https://eli.gov.pt/eli/pt/portaria/2026/87/pt/2027-01-01.xml",
            "https://dre.pt/dre/detalhe/portaria/87-2026",
        ),
    ],
)
def test_eli_to_dre_legacy(eli_uri: str, expected_legacy: str) -> None:
    assert eli_to_dre_legacy(eli_uri) == expected_legacy


def test_parse_eli_full() -> None:
    uri = "https://eli.gov.pt/eli/pt-20/dlr/2026/3/pt/2027-06-01.xml#art_5__para_1__lit_a"
    eid = parse_eli(uri)
    assert eid == EliId(
        jurisdiction="pt-20",
        act_type="dlr",
        year=2026,
        number=3,
        language="pt",
        point_in_time="2027-06-01",
        fmt="xml",
        fragment="art_5__para_1__lit_a",
    )
    assert eid.to_uri() == uri


def test_parse_dre_rejects_unknown_type() -> None:
    with pytest.raises(ValueError, match="Tipo dre.pt desconhecido"):
        parse_dre("https://dre.pt/dre/detalhe/tipo-inexistente/1-2026")


def test_parse_eli_rejects_malformed() -> None:
    with pytest.raises(ValueError, match="URI ELI-PT não reconhecido"):
        parse_eli("https://eli.gov.pt/algo/qualquer/coisa")


def test_round_trip_regional() -> None:
    eid = EliId(jurisdiction="pt-30", act_type="dlr", year=2026, number=4)
    uri = eid.to_uri()
    assert uri == "https://eli.gov.pt/eli/pt-30/dlr/2026/4/pt"
    assert parse_eli(uri) == eid


def test_round_trip_with_data_dre_pt_domain() -> None:
    """Demonstra que a estrutura do path não muda quando o domínio passa a data.dre.pt."""
    eid = EliId(jurisdiction="pt", act_type="dec-lei", year=2026, number=22)
    uri = eid.to_uri(domain="data.dre.pt")
    assert uri == "https://data.dre.pt/eli/pt/dec-lei/2026/22/pt"
    assert parse_eli(uri) == eid
