"""Generate 20 negative test files by mutating the positive baseline.

Each negative file introduces a single deliberate error and is expected to
fail XSD validation. The script reads the baseline DL minimal positive,
applies a mutation, and writes the result with a leading comment describing
the expected failure.

Run: python generate_negatives.py
"""
from __future__ import annotations

import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASELINE = (ROOT / "positive" / "dec-lei-minimal.akn.xml").read_text(encoding="utf-8")
OUTDIR = ROOT / "negative"
OUTDIR.mkdir(exist_ok=True)


def _mutate(text: str, pattern: str, replacement: str, *, count: int = 1) -> str:
    """Substitui `pattern` por `replacement` exactamente uma vez (por defeito)."""
    new, n = re.subn(pattern, replacement, text, count=count)
    if n != count:
        raise RuntimeError(f"Expected {count} substitutions, got {n} for pattern {pattern!r}")
    return new


MUTATIONS: list[tuple[str, str, callable]] = [
    (
        "n01-unknown-act-name.akn.xml",
        "act name fora do enum ActTypeName",
        lambda s: _mutate(s, r'<act name="dec-lei">', '<act name="lei-bizarra">'),
    ),
    (
        "n02-bad-subtype.akn.xml",
        "FRBRsubtype fora do enum SubtypeValue",
        lambda s: _mutate(s, r'<FRBRsubtype value="dec-lei-ordinario"/>', '<FRBRsubtype value="inexistente"/>'),
    ),
    (
        "n03-bad-jurisdiction.akn.xml",
        "FRBRcountry value fora do enum JurisdictionType",
        lambda s: _mutate(s, r'<FRBRcountry value="pt"/>', '<FRBRcountry value="es"/>'),
    ),
    (
        "n04-bad-language.akn.xml",
        "FRBRlanguage language fora do enum LanguageType",
        lambda s: _mutate(s, r'<FRBRlanguage language="por"/>', '<FRBRlanguage language="eng"/>'),
    ),
    (
        "n05-malformed-eli-uri.akn.xml",
        "FRBRuri sem o segmento /eli/",
        lambda s: _mutate(s, r'eli/pt/dec-lei/2026/22/pt', 'pt/dec-lei/2026/22/pt', count=1),
    ),
    (
        "n06-bad-eid.akn.xml",
        "eId com maiusculas e espaco",
        lambda s: _mutate(s, r'eId="art_1"', 'eId="ARTIGO 1"'),
    ),
    (
        "n07-bad-date.akn.xml",
        "FRBRdate date em formato YYYY/MM/DD",
        lambda s: _mutate(s, r'date="2026-03-10" name="adoption"', 'date="2026/03/10" name="adoption"'),
    ),
    (
        "n08-missing-meta.akn.xml",
        "<act> sem bloco <meta>",
        lambda s: re.sub(r'<meta>.*?</meta>', '', s, count=1, flags=re.DOTALL),
    ),
    (
        "n09-missing-frbr-author.akn.xml",
        "<FRBRWork> sem <FRBRauthor>",
        lambda s: _mutate(s, r'\s*<FRBRauthor href="#governo"/>', '', count=1),
    ),
    (
        "n10-bad-format.akn.xml",
        "FRBRformat com media type fora do enum",
        lambda s: _mutate(s, r'value="application/akn\+xml; profile=akn-pt-1.0"', 'value="application/zip"'),
    ),
    (
        "n11-unknown-signature-role.akn.xml",
        "<signature role> fora do enum SignatureRole",
        lambda s: _mutate(s, r'role="countersignature"', 'role="abracadabra"', count=1),
    ),
    (
        "n12-bad-formula-type.akn.xml",
        "<formula type> fora do enum FormulaType",
        lambda s: _mutate(s, r'<formula type="enacting">', '<formula type="random">'),
    ),
    (
        "n13-bad-frbr-date-name.akn.xml",
        "FRBRdate name fora do enum FrbrDateName",
        lambda s: _mutate(s, r'name="adoption"', 'name="nascimento"'),
    ),
    (
        "n14-article-missing-heading.akn.xml",
        "<article> sem <heading>",
        lambda s: _mutate(s, r'<num>Artigo 1\.o</num>\s*<heading>Objeto</heading>', '<num>Artigo 1.o</num>'),
    ),
    (
        "n15-ref-missing-href.akn.xml",
        "<ref> sem atributo href (obrigatorio)",
        lambda s: _mutate(s, r'<ref href="#art_1">', '<ref>'),
    ),
    (
        "n16-extra-element.akn.xml",
        "elemento <dragon> nao previsto dentro de <body>",
        lambda s: _mutate(s, r'<body>', '<body><dragon/>'),
    ),
    (
        "n17-bad-ontology-href.akn.xml",
        "TLCRole href fora do padrao OntologyUriType",
        lambda s: _mutate(
            s,
            r'href="/akn/ontology/role/pt/primeiro-ministro"',
            'href="bad-uri"',
            count=1,
        ),
    ),
    (
        "n18-tlc-missing-attribute.akn.xml",
        "TLCRole sem atributo showAs (obrigatorio)",
        lambda s: _mutate(
            s,
            r'<TLCRole eId="primeiro-ministro" href="/akn/ontology/role/pt/primeiro-ministro" showAs="Primeiro-Ministro"/>',
            '<TLCRole eId="primeiro-ministro" href="/akn/ontology/role/pt/primeiro-ministro"/>',
        ),
    ),
    (
        "n19-lifecycle-bad-type.akn.xml",
        "eventRef type fora do enum (generation/amendment/repeal)",
        lambda s: _mutate(s, r'type="generation" refersTo="#approval-cm"', 'type="death" refersTo="#approval-cm"'),
    ),
    (
        "n20-bad-frbr-subtype-format.akn.xml",
        "FRBRsubtype em uppercase (nao no enum)",
        lambda s: _mutate(s, r'<FRBRsubtype value="dec-lei-ordinario"/>', '<FRBRsubtype value="DEC-LEI-ORDINARIO"/>'),
    ),
]


def _wrap_with_comment(content: str, reason: str) -> str:
    """Substitui o comentario de cabecalho pela explicacao do erro deliberado."""
    new_comment = f"<!-- NEGATIVE TEST. Expected XSD failure: {reason}. -->"
    return re.sub(r'<!--.*?-->', new_comment, content, count=1, flags=re.DOTALL)


def main() -> None:
    for filename, reason, mutator in MUTATIONS:
        try:
            mutated = mutator(BASELINE)
        except RuntimeError as exc:
            print(f"  SKIP {filename}: {exc}")
            continue
        content = _wrap_with_comment(mutated, reason)
        (OUTDIR / filename).write_text(content, encoding="utf-8")
        print(f"  WROTE {filename}")


if __name__ == "__main__":
    main()
