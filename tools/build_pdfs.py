# SPDX-License-Identifier: EUPL-1.2
"""Build release PDFs from the Markdown sources.

Strategy:
  1. Prefer Pandoc + XeLaTeX (high quality). Detected via shutil.which("pandoc").
  2. Fall back to fpdf2 (pure-Python; simpler typography, but always available).

Outputs to release/v0.1.0/.

Usage:
  python tools/build_pdfs.py            # all PDFs
  python tools/build_pdfs.py --only pt  # only the PT spec
  python tools/build_pdfs.py --backend fpdf  # force fpdf2 backend
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Sequence

ROOT = Path(__file__).resolve().parent.parent
RELEASE_DIR = ROOT / "release" / "v0.1.0"

# Bundles to build: (output_basename, lang, title, source_files)
BUNDLES: list[dict] = [
    {
        "name": "AKN-PT-Specification-v0.1.0-pt",
        "lang": "pt",
        "title": "AKN-PT — Especificação v0.1.0",
        "subtitle": "Perfil nacional português do Akoma Ntoso",
        "sources": [
            ROOT / "docs" / "spec" / "pt" / "index.md",
            *sorted((ROOT / "docs" / "spec" / "pt").glob("[0-9][0-9]-*.md")),
        ],
    },
    {
        "name": "AKN-PT-Specification-v0.1.0-en",
        "lang": "en",
        "title": "AKN-PT — Specification v0.1.0",
        "subtitle": "Portuguese national profile of Akoma Ntoso",
        "sources": [
            ROOT / "docs" / "spec" / "en" / "executive-summary.md",
            ROOT / "docs" / "spec" / "en" / "technical-overview.md",
            ROOT / "docs" / "spec" / "en" / "implementation-guide.md",
        ],
    },
    {
        "name": "ELI-PT-Specification-v0.1.0-pt",
        "lang": "pt",
        "title": "ELI-PT — Especificação v0.1.0",
        "subtitle": "European Legislation Identifier — Perfil Nacional Português",
        "sources": [
            ROOT / "eli-pt" / "specification-pt.md",
            ROOT / "eli-pt" / "uri-templates.md",
            ROOT / "eli-pt" / "permanence-policy.md",
        ],
    },
    {
        "name": "ELI-PT-Specification-v0.1.0-en",
        "lang": "en",
        "title": "ELI-PT — Specification v0.1.0",
        "subtitle": "European Legislation Identifier — Portuguese national profile",
        "sources": [
            ROOT / "eli-pt" / "specification-en.md",
            ROOT / "eli-pt" / "uri-templates.md",
            ROOT / "eli-pt" / "permanence-policy.md",
        ],
    },
    {
        "name": "AKN-PT-Release-Notes-v0.1.0",
        "lang": "pt",
        "title": "AKN-PT v0.1.0 — Release Notes",
        "subtitle": "Perfil nacional português do Akoma Ntoso",
        "sources": [ROOT / "RELEASE-NOTES-v0.1.0.md"],
    },
]


# ---------------------------------------------------------------------------
# Pandoc backend
# ---------------------------------------------------------------------------
def have_pandoc() -> bool:
    return shutil.which("pandoc") is not None


def build_pandoc(bundle: dict) -> Path:
    """Build via pandoc + xelatex."""
    out = RELEASE_DIR / f"{bundle['name']}.pdf"
    metadata = ROOT / "docs" / "spec" / "pandoc-metadata.yaml"
    cmd = [
        "pandoc",
        "--from", "markdown+pipe_tables+raw_html",
        "--pdf-engine=xelatex",
        f"--metadata=title:{bundle['title']}",
        f"--metadata=subtitle:{bundle['subtitle']}",
        f"--metadata=lang:{'pt-PT' if bundle['lang'] == 'pt' else 'en'}",
        "--toc", "--toc-depth=2",
        "-o", str(out),
        *[str(s) for s in bundle["sources"] if s.exists()],
    ]
    if metadata.exists() and bundle["lang"] == "pt":
        cmd.insert(2, f"--metadata-file={metadata}")
    print(f"  pandoc: {bundle['name']}")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(res.stderr, file=sys.stderr)
        raise RuntimeError(f"pandoc failed: {bundle['name']}")
    return out


# ---------------------------------------------------------------------------
# fpdf2 backend (fallback, pure Python)
# ---------------------------------------------------------------------------
def build_fpdf(bundle: dict) -> Path:
    """Build a clean text-style PDF via fpdf2 (no external tools required)."""
    from fpdf import FPDF

    out = RELEASE_DIR / f"{bundle['name']}.pdf"

    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_margins(left=20, top=20, right=20)
    pdf.set_title(bundle["title"])
    pdf.set_author("DAPL / SGGOV")
    pdf.set_creator("akn-pt build_pdfs.py")

    # Cover page
    pdf.add_page()
    kw = dict(new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_font("Helvetica", "B", 24)
    pdf.ln(40)
    pdf.multi_cell(0, 12, _ascii(bundle["title"]), **kw)
    pdf.set_font("Helvetica", "", 14)
    pdf.ln(8)
    pdf.multi_cell(0, 8, _ascii(bundle["subtitle"]), **kw)
    pdf.ln(20)
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(0, 7, _ascii("v0.1.0 (proposta) - 2026-05-18"), **kw)
    pdf.multi_cell(0, 7, _ascii("DAPL / Secretaria-Geral do Governo - Portugal"), **kw)
    pdf.multi_cell(0, 7, _ascii("Licenca: EUPL-1.2"), **kw)
    pdf.ln(15)
    pdf.set_font("Helvetica", "I", 9)
    pdf.multi_cell(0, 5, _ascii(
        "Documento gerado por tools/build_pdfs.py com backend fpdf2 (pure-Python). "
        "Para tipografia profissional usar 'make pt' ou 'make en' em docs/spec/ "
        "(requer Pandoc + XeLaTeX)."
    ), **kw)

    # Content pages
    for src in bundle["sources"]:
        if not src.exists():
            print(f"    WARN: source missing: {src}")
            continue
        text = src.read_text(encoding="utf-8")
        _render_markdown(pdf, text)

    pdf.output(str(out))
    print(f"  fpdf2: {bundle['name']} -> {out.name}")
    return out


def _ascii(text: str) -> str:
    """Replace common unicode characters with ASCII equivalents for fpdf2 default font."""
    # fpdf2 default font is Latin-1; arrows / special chars need replacing.
    # For real production, use Unicode TTF font; here we keep it simple.
    replacements = {
        "—": "-",  # em dash
        "–": "-",  # en dash
        "‘": "'", "’": "'",
        "“": '"', "”": '"',
        "…": "...",
        " ": " ",
        "→": "->", "←": "<-",
        "✓": "OK", "✗": "X",
        "«": "<<", "»": ">>",
        "​": "",
        # Symbols often seen in our docs
        "≡": "===",
        "→": "->", "⇒": "=>",
        "▲": "^", "▼": "v",
        "│": "|", "─": "-",
        "├": "+", "└": "+", "┤": "+", "┬": "+", "┴": "+",
        "┌": "+", "┐": "+", "┘": "+",
        "·": "*",
    }
    out = text
    for k, v in replacements.items():
        out = out.replace(k, v)
    return out.encode("latin-1", "replace").decode("latin-1")


_H_RE = re.compile(r"^(#{1,4})\s+(.+)$")
_CODE_FENCE = "```"


def _safe_multi_cell(pdf, h: float, text: str) -> None:
    """multi_cell that breaks unbreakable tokens (URIs) and uses CHAR wrap as fallback."""
    if not text:
        text = " "
    try:
        pdf.multi_cell(0, h, text, new_x="LMARGIN", new_y="NEXT", wrapmode="CHAR")
    except Exception:
        try:
            pdf.multi_cell(0, h, text[:120], new_x="LMARGIN", new_y="NEXT", wrapmode="CHAR")
        except Exception:
            pass


def _render_markdown(pdf, text: str) -> None:
    """Minimal markdown rendering: H1-H4, paragraphs, code blocks, lists, tables (raw)."""
    pdf.add_page()
    in_code = False
    in_table = False

    for raw_line in text.split("\n"):
        line = raw_line.rstrip()

        if line.startswith(_CODE_FENCE):
            in_code = not in_code
            pdf.set_font("Courier", "", 8 if in_code else 9)
            continue

        if in_code:
            pdf.set_font("Courier", "", 8)
            _safe_multi_cell(pdf, 4, _ascii(line) if line else " ")
            continue

        # Headings
        m = _H_RE.match(line)
        if m:
            depth = len(m.group(1))
            text_h = m.group(2)
            size = {1: 18, 2: 14, 3: 12, 4: 11}.get(depth, 11)
            if depth == 1:
                pdf.add_page()
            pdf.ln(3 if depth > 1 else 2)
            pdf.set_font("Helvetica", "B", size)
            _safe_multi_cell(pdf, size * 0.55, _ascii(text_h))
            pdf.ln(2)
            pdf.set_font("Helvetica", "", 10)
            continue

        # Table lines (rough)
        if "|" in line and line.strip().startswith("|"):
            if not in_table:
                pdf.set_font("Courier", "", 7)
                in_table = True
            _safe_multi_cell(pdf, 3.5, _ascii(line))
            continue
        else:
            if in_table:
                pdf.set_font("Helvetica", "", 10)
                in_table = False

        # List items
        if line.lstrip().startswith(("- ", "* ", "+ ")) or re.match(r"^\d+\.\s", line.lstrip()):
            pdf.set_font("Helvetica", "", 10)
            _safe_multi_cell(pdf, 5, _ascii("  " + line))
            continue

        # Blank line
        if not line.strip():
            pdf.ln(2)
            continue

        # Plain paragraph
        pdf.set_font("Helvetica", "", 10)
        _safe_multi_cell(pdf, 5, _ascii(line))


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------
def main(argv: Sequence[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", nargs="*", default=None,
                        help="Build only bundles whose name contains one of the given strings.")
    parser.add_argument("--backend", choices=["auto", "pandoc", "fpdf"], default="auto")
    args = parser.parse_args(argv)

    RELEASE_DIR.mkdir(parents=True, exist_ok=True)

    backend = args.backend
    if backend == "auto":
        backend = "pandoc" if have_pandoc() else "fpdf"
    if backend == "pandoc" and not have_pandoc():
        print("Pandoc not found; falling back to fpdf2", file=sys.stderr)
        backend = "fpdf"

    print(f"Building PDFs into {RELEASE_DIR.relative_to(ROOT)} (backend={backend})")

    n_ok = 0
    n_fail = 0
    bundles = BUNDLES
    if args.only:
        bundles = [b for b in BUNDLES if any(s in b["name"] for s in args.only)]
    for bundle in bundles:
        try:
            if backend == "pandoc":
                build_pandoc(bundle)
            else:
                build_fpdf(bundle)
            n_ok += 1
        except Exception as exc:
            print(f"  FAIL {bundle['name']}: {exc}", file=sys.stderr)
            n_fail += 1

    print(f"\nBuilt {n_ok}/{len(bundles)} PDFs. {n_fail} failed.")
    print(f"Output: {RELEASE_DIR.relative_to(ROOT)}/")
    for f in sorted(RELEASE_DIR.glob("*.pdf")):
        size_kb = f.stat().st_size / 1024
        print(f"  {f.name}  ({size_kb:.1f} KB)")
    return 0 if n_fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
