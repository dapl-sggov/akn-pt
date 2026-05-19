# SPDX-License-Identifier: EUPL-1.2
"""Schema test runner — XSD + Schematron, positives + negatives.

Pastas:
  positive/             XML que valida XSD AND Schematron
  negative/             XML que FALHA XSD
  schematron-negative/  XML que passa XSD mas FALHA Schematron

Uso:
  python run_tests.py            output sumario
  python run_tests.py -v         tambem mostra detalhe das falhas

Exit code 0 se tudo passar.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from lxml import etree, isoschematron

ROOT = Path(__file__).resolve().parent.parent.parent
XSD = ROOT / "schema" / "xsd" / "akn-pt.xsd"
SCH = ROOT / "schema" / "schematron" / "akn-pt-rules.sch"

POS_DIR = ROOT / "schema" / "tests" / "positive"
NEG_DIR = ROOT / "schema" / "tests" / "negative"
SCH_NEG_DIR = ROOT / "schema" / "tests" / "schematron-negative"


def _load_xsd() -> etree.XMLSchema:
    return etree.XMLSchema(etree.parse(str(XSD)))


def _load_sch() -> isoschematron.Schematron:
    return isoschematron.Schematron(etree.parse(str(SCH)), store_report=True)


def _print_sch_failures(sch: isoschematron.Schematron) -> None:
    if sch.validation_report is None:
        return
    for failed in sch.validation_report.findall(
        ".//{http://purl.oclc.org/dsdl/svrl}failed-assert"
    ) + sch.validation_report.findall(
        ".//{http://purl.oclc.org/dsdl/svrl}successful-report"
    ):
        msg = failed.find("{http://purl.oclc.org/dsdl/svrl}text")
        txt = msg.text.strip() if msg is not None and msg.text else "?"
        print(f"        {txt[:160]}")


def run(verbose: bool) -> int:
    xsd = _load_xsd()
    sch = _load_sch()

    pos = sorted(POS_DIR.glob("*.akn.xml"))
    neg = sorted(NEG_DIR.glob("*.akn.xml"))
    sch_neg = sorted(SCH_NEG_DIR.glob("*.akn.xml"))

    failures: list[str] = []

    print(f"\nPositive ({len(pos)}) — must pass XSD + Schematron:")
    for f in pos:
        doc = etree.parse(str(f))
        xsd_ok = xsd.validate(doc)
        sch_ok = sch.validate(doc) if xsd_ok else False
        name = f.name
        if xsd_ok and sch_ok:
            print(f"  OK   {name}")
        else:
            failures.append(name)
            tag = "XSD" if not xsd_ok else "SCH"
            print(f"  FAIL {name} ({tag})")
            if verbose:
                if not xsd_ok and len(xsd.error_log):
                    print(f"        {xsd.error_log[0].message[:160]}")
                elif not sch_ok:
                    _print_sch_failures(sch)

    print(f"\nXSD negative ({len(neg)}) — must FAIL XSD:")
    for f in neg:
        try:
            doc = etree.parse(str(f))
        except etree.XMLSyntaxError:
            print(f"  OK   {f.name}  (rejected at parse)")
            continue
        if xsd.validate(doc):
            failures.append(f.name)
            print(f"  FAIL {f.name}: XSD accepted (should reject)")
        else:
            print(f"  OK   {f.name}")
            if verbose:
                print(f"        {xsd.error_log[0].message[:160]}")

    print(f"\nSchematron negative ({len(sch_neg)}) — must pass XSD but FAIL Schematron:")
    for f in sch_neg:
        doc = etree.parse(str(f))
        xsd_ok = xsd.validate(doc)
        if not xsd_ok:
            failures.append(f.name)
            print(f"  FAIL {f.name}: XSD rejected (should pass XSD)")
            continue
        sch_ok = sch.validate(doc)
        if sch_ok:
            failures.append(f.name)
            print(f"  FAIL {f.name}: Schematron accepted (should reject)")
        else:
            print(f"  OK   {f.name}")
            if verbose:
                _print_sch_failures(sch)

    total = len(pos) + len(neg) + len(sch_neg)
    print()
    print(f"Summary: {total - len(failures)}/{total} passed, {len(failures)} failed")
    if failures:
        print("Failures:")
        for name in failures:
            print(f"  - {name}")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(run(verbose="-v" in sys.argv))
