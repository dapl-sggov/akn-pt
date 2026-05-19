"""Gera testes que passam o XSD mas violam regras Schematron.

Cada caso aplica uma mutacao subtil ao baseline DL que e' bem-formada
estruturalmente (XSD valida) mas viola um invariante semantico do
Schematron (e.g. coerencia entre tipo e estrutura).
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASELINE_DL = (ROOT / "positive" / "dec-lei-minimal.akn.xml").read_text(encoding="utf-8")
BASELINE_RCM = (ROOT / "positive" / "res-cm-minimal.akn.xml").read_text(encoding="utf-8")
BASELINE_PORTARIA = (ROOT / "positive" / "portaria-minimal.akn.xml").read_text(encoding="utf-8")
BASELINE_FOOTPRINT = (ROOT / "positive" / "dec-lei-with-footprint.akn.xml").read_text(encoding="utf-8")

BASELINES = {
    "dec-lei": BASELINE_DL,
    "res-cm": BASELINE_RCM,
    "portaria": BASELINE_PORTARIA,
    "footprint": BASELINE_FOOTPRINT,
}
OUTDIR = ROOT / "schematron-negative"
OUTDIR.mkdir(exist_ok=True)


def _sub(text: str, pattern: str, replacement: str, *, count: int = 1) -> str:
    new, n = re.subn(pattern, replacement, text, count=count, flags=re.DOTALL)
    if n != count:
        raise RuntimeError(f"Expected {count} substitutions, got {n} for pattern {pattern!r}")
    return new


SCHEMATRON_CASES: list[tuple[str, str, str, callable]] = [
    (
        "s01-dec-lei-without-promulgation.akn.xml",
        "DL sem signature role='promulgation'",
        "dec-lei",
        lambda s: _sub(
            s,
            r'<formula type="promulgation">.*?</signature>\s*',
            '',
        ),
    ),
    (
        "s02-rcm-with-article.akn.xml",
        "RCM com article em body (erro frequente)",
        "res-cm",
        lambda s: _sub(
            s,
            r'<body>.*?</body>',
            '<body><article eId="art_1"><num>Artigo 1.o</num><heading>Bad</heading><paragraph eId="art_1__para_1"><content><p>X.</p></content></paragraph></article></body>',
        ),
    ),
    (
        "s03-article-no-heading.akn.xml",
        "Artigo sem <heading> (legistica)",
        "dec-lei",
        lambda s: _sub(s, r'<heading>Objeto</heading>', '<heading></heading>'),
    ),
    (
        "s04-broken-internal-ref.akn.xml",
        "Referencia interna #art_999 nao resolve",
        "dec-lei",
        lambda s: _sub(s, r'href="#art_1"', 'href="#art_999"'),
    ),
    (
        "s05-duplicate-eid.akn.xml",
        "eId duplicado",
        "dec-lei",
        lambda s: _sub(s, r'eId="art_2"', 'eId="art_1"'),
    ),
    (
        "s06-publication-before-adoption.akn.xml",
        "Data de publicacao anterior a' adopcao",
        "dec-lei",
        lambda s: _sub(s, r'<eventRef eId="e3" date="2026-03-15"', '<eventRef eId="e3" date="2026-02-01"'),
    ),
    (
        "s07-frbr-uri-type-mismatch.akn.xml",
        "FRBRuri menciona 'lei' mas act/@name e 'dec-lei'",
        "dec-lei",
        lambda s: _sub(
            s,
            r'<FRBRuri value="https://eli.gov.pt/eli/pt/dec-lei/2026/22/pt"/>',
            '<FRBRuri value="https://eli.gov.pt/eli/pt/lei/2026/22/pt"/>',
        ),
    ),
    (
        "s08-preface-missing-shortTitle.akn.xml",
        "Preface sem <shortTitle>",
        "dec-lei",
        lambda s: _sub(s, r'<shortTitle>[^<]+</shortTitle>', ''),
    ),
    (
        "s09-portaria-no-habilitante.akn.xml",
        "Portaria sem ref a lei habilitante no preambulo",
        "portaria",
        lambda s: _sub(
            s,
            r'<recital eId="rec_1">.*?</recital>',
            '<recital eId="rec_1"><p>Considerando.</p></recital>',
        ),
    ),
    (
        "s10-frbr-subtype-mismatch.akn.xml",
        "act/@name='dec-lei' com FRBRsubtype 'lei-comum'",
        "dec-lei",
        lambda s: _sub(s, r'value="dec-lei-ordinario"', 'value="lei-comum"'),
    ),
    (
        "s11-footprint-missing-after-cutoff.akn.xml",
        "Acto publicado apos 2026-07-27 sem bloco workflow (pegada legislativa em falta)",
        "footprint",
        lambda s: _sub(s, r'<workflow source="#dapl">.*?</workflow>\s*', '', count=1),
    ),
    (
        "s12-footprint-missing-iniciativa.akn.xml",
        "Workflow sem step 'iniciativa' (pegada legislativa incompleta)",
        "footprint",
        lambda s: _sub(
            s,
            r'<step eId="step_iniciativa"[^>]*>\s*<description><p>[^<]+</p></description>\s*</step>\s*',
            '',
            count=1,
        ),
    ),
]


def _wrap(content: str, reason: str) -> str:
    note = f"<!-- SCHEMATRON NEGATIVE. Expected to PASS xsd but FAIL schematron: {reason} -->"
    return re.sub(r'<!--.*?-->', note, content, count=1, flags=re.DOTALL)


def main() -> None:
    for filename, reason, baseline_key, mutator in SCHEMATRON_CASES:
        baseline = BASELINES.get(baseline_key)
        if baseline is None:
            print(f"  SKIP {filename}: unknown baseline {baseline_key!r}")
            continue
        # Strip/replace leading comment from baseline FIRST so it can't be
        # matched by the mutation regex (some mutations are very broad).
        wrapped = _wrap(baseline, reason)
        try:
            mutated = mutator(wrapped)
        except RuntimeError as exc:
            print(f"  SKIP {filename}: {exc}")
            continue
        (OUTDIR / filename).write_text(mutated, encoding="utf-8")
        print(f"  WROTE {filename}")


if __name__ == "__main__":
    main()
