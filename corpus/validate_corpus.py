# SPDX-License-Identifier: EUPL-1.2
"""Corpus validator — valida os 10 ficheiros AKN-PT contra XSD + Schematron (publication).

Exit 0 se tudo passar, 1 caso contrario.
"""
from __future__ import annotations

import sys
from pathlib import Path

from lxml import etree, isoschematron

ROOT = Path(__file__).resolve().parent.parent
XSD = ROOT / "schema" / "xsd" / "akn-pt.xsd"
SCH = ROOT / "schema" / "schematron" / "akn-pt-rules.sch"
CORPUS_DIR = ROOT / "corpus"


def main() -> int:
    if not XSD.is_file() or not SCH.is_file():
        print(f"Schema not found ({XSD}, {SCH})")
        return 2

    xsd = etree.XMLSchema(etree.parse(str(XSD)))
    sch = isoschematron.Schematron(etree.parse(str(SCH)), store_report=True)

    files = sorted(CORPUS_DIR.rglob("*.akn.xml"))
    if not files:
        print(f"No corpus files found in {CORPUS_DIR}")
        return 1

    failures: list[str] = []
    print(f"Corpus validation ({len(files)} files) — XSD + Schematron (publication):\n")

    for f in files:
        rel = f.relative_to(ROOT).as_posix()
        try:
            doc = etree.parse(str(f))
        except etree.XMLSyntaxError as exc:
            failures.append(rel)
            print(f"  FAIL  {rel}  (parse: {exc})")
            continue

        if not xsd.validate(doc):
            failures.append(rel)
            err = xsd.error_log[0] if len(xsd.error_log) else None
            msg = f"line {err.line}: {err.message[:120]}" if err else "unknown"
            print(f"  FAIL  {rel}  (XSD: {msg})")
            continue

        if not sch.validate(doc):
            failures.append(rel)
            print(f"  FAIL  {rel}  (Schematron):")
            ns = "{http://purl.oclc.org/dsdl/svrl}"
            for failed in sch.validation_report.findall(f".//{ns}failed-assert"):
                msg = failed.find(f"{ns}text")
                txt = msg.text.strip() if msg is not None and msg.text else "?"
                print(f"        - {txt[:160]}")
            continue

        print(f"  OK    {rel}")

    print()
    print(f"Summary: {len(files) - len(failures)}/{len(files)} OK, {len(failures)} failed")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
