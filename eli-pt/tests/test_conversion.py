# SPDX-License-Identifier: EUPL-1.2
"""Testes do conversor ELI-PT (canónico data.dre.pt + forma proposta) ↔ dre.pt."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from conversion import (  # noqa: E402
    EliId,
    dre_to_eli,
    eli_to_dre_legacy,
    parse_dre,
    parse_eli,
)


# --- forma CANÓNICA data.dre.pt (exige data de publicação) -----------------

def test_canonical_work_uri() -> None:
    eid = EliId("dec-lei", 2016, "83", pub_date="2016-12-16")
    assert eid.to_uri() == "https://data.dre.pt/eli/dec-lei/83/2016/12/16"


def test_canonical_expression_and_manifestation() -> None:
    eid = EliId("dec-lei", 2016, "83", pub_date="2016-12-16", fmt="html")
    # com fmt → Expression /p/dre/pt + Manifestation /html
    assert eid.to_uri() == "https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/html"


def test_canonical_consolidated() -> None:
    eid = EliId("dec-lei", 2016, "83", pub_date="2016-12-16", point_in_time="2024-01-01", fmt="xml")
    assert eid.to_uri() == "https://data.dre.pt/eli/dec-lei/83/2016/12/16/2024-01-01/dre/pt/xml"


def test_canonical_requires_pub_date() -> None:
    with pytest.raises(ValueError, match="exige pub_date"):
        EliId("dec-lei", 2026, "22").to_uri(scheme="dre")


def test_canonical_number_with_suffix() -> None:
    eid = EliId("dec-lei", 1988, "442-A", pub_date="1988-11-30")
    assert eid.to_uri() == "https://data.dre.pt/eli/dec-lei/442-A/1988/11/30"


@pytest.mark.parametrize(
    ("uri",),
    [
        ("https://data.dre.pt/eli/dec-lei/83/2016/12/16",),
        ("https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/html",),
        ("https://data.dre.pt/eli/portaria/249/2021/11/22/p/dre/pt/xml#art_2__para_1",),
        ("https://data.dre.pt/eli/lei/7/2020/04/10/2024-06-01/dre/pt",),
    ],
)
def test_parse_canonical_roundtrip(uri: str) -> None:
    eid = parse_eli(uri)
    assert eid.to_uri(scheme="dre") == uri


# --- forma PROPOSTA eli.gov.pt (construível a partir de citação) -----------

@pytest.mark.parametrize(
    ("legacy", "expected_proposed"),
    [
        ("https://dre.pt/dre/detalhe/decreto-lei/22-2026-100000000",
         "https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt"),
        ("https://dre.pt/dre/detalhe/lei/12-2026-200000000",
         "https://eli.gov.pt/eli/pt/lei/2026/12/pt"),
        ("https://dre.pt/dre/detalhe/portaria/87-2026",
         "https://eli.gov.pt/eli/pt/portaria/2026/87/pt"),
    ],
)
def test_dre_to_eli_without_date_yields_proposed(legacy: str, expected_proposed: str) -> None:
    # Sem data, o URL de detalhe só dá number/year → forma proposta construível.
    assert dre_to_eli(legacy) == expected_proposed


def test_dre_to_eli_with_date_yields_canonical() -> None:
    eli = dre_to_eli("https://dre.pt/dre/detalhe/decreto-lei/83-2016-100000000", pub_date="2016-12-16")
    assert eli == "https://data.dre.pt/eli/dec-lei/83/2016/12/16"


def test_parse_proposed_full() -> None:
    uri = "https://eli.gov.pt/eli/pt-20/dlr/2026/3/pt/2027-06-01.xml#art_5__para_1__lit_a"
    eid = parse_eli(uri)
    assert eid.jurisdiction == "pt-20"
    assert eid.act_type == "dlr"
    assert eid.number == "3"
    assert eid.point_in_time == "2027-06-01"
    assert eid.fmt == "xml"
    assert eid.fragment == "art_5__para_1__lit_a"
    assert eid.to_uri(scheme="proposed") == uri


# --- eli → dre detail (ambas as formas) ------------------------------------

@pytest.mark.parametrize(
    ("eli_uri", "expected_legacy"),
    [
        ("https://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/html",
         "https://dre.pt/dre/detalhe/decreto-lei/83-2016"),
        ("https://eli.gov.pt/eli/pt/lei/2026/12/pt",
         "https://dre.pt/dre/detalhe/lei/12-2026"),
    ],
)
def test_eli_to_dre_legacy(eli_uri: str, expected_legacy: str) -> None:
    assert eli_to_dre_legacy(eli_uri) == expected_legacy


# --- erros ------------------------------------------------------------------

def test_parse_dre_rejects_unknown_type() -> None:
    with pytest.raises(ValueError, match="Tipo dre.pt desconhecido"):
        parse_dre("https://dre.pt/dre/detalhe/tipo-inexistente/1-2026")


def test_parse_eli_rejects_malformed() -> None:
    with pytest.raises(ValueError, match="não reconhecido"):
        parse_eli("https://eli.gov.pt/algo/qualquer/coisa")
