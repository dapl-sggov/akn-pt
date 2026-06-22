#!/usr/bin/env python3
"""Sincronizar schemas canónicos para o pacote do validador.

A única source-of-truth dos schemas XSD + Schematron é a pasta `schema/`
na raiz do repositório. O pacote pip do validador (`validator/src/akn_pt/data/`)
precisa de uma cópia local porque é distribuído como package resource
(carregado via `importlib.resources`).

Este script:

  * Lê `schema/xsd/*.xsd` e `schema/schematron/*.sch` (canónicos).
  * Compara com `validator/src/akn_pt/data/`.
  * Em modo `--check` falha se houver drift (uso em CI / pre-commit).
  * Em modo normal copia os ficheiros (manter `data/` sincronizado).

Uso:
    python tools/sync_schemas.py          # copia (default)
    python tools/sync_schemas.py --check  # verifica drift, sai com erro se houver
"""

from __future__ import annotations

import argparse
import hashlib
import shutil
import sys
from pathlib import Path

# Garantir UTF-8 no stdout/stderr em consolas Windows (cp1252 por defeito).
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parent.parent

SOURCES = [
    REPO_ROOT / "schema" / "xsd" / "akn-pt.xsd",
    REPO_ROOT / "schema" / "xsd" / "akn-pt-types.xsd",
    REPO_ROOT / "schema" / "xsd" / "akn-pt-metadata.xsd",
    REPO_ROOT / "schema" / "xsd" / "akn-pt-structure.xsd",
    REPO_ROOT / "schema" / "xsd" / "akn-pt-extensions.xsd",
    REPO_ROOT / "schema" / "schematron" / "akn-pt-rules.sch",
]

DEST_DIR = REPO_ROOT / "validator" / "src" / "akn_pt" / "data"


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check_drift() -> list[tuple[str, str]]:
    """Devolve lista de (ficheiro, motivo) que estão dessincronizados."""
    drift: list[tuple[str, str]] = []
    for src in SOURCES:
        dest = DEST_DIR / src.name
        if not dest.exists():
            drift.append((src.name, "destino inexistente"))
            continue
        if _sha256(src) != _sha256(dest):
            drift.append((src.name, "conteúdo diferente"))
    return drift


def copy_all() -> int:
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    n = 0
    for src in SOURCES:
        dest = DEST_DIR / src.name
        shutil.copy2(src, dest)
        n += 1
        print(f"  copiado: schema/.../{src.name} → validator/.../{src.name}")
    return n


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Apenas verifica drift; não copia. Sai com código 1 se houver drift.",
    )
    args = parser.parse_args()

    if args.check:
        drift = check_drift()
        if not drift:
            print("✓ Schemas sincronizados — sem drift entre schema/ e validator/data/.")
            return 0
        print("✗ DRIFT DETECTADO entre schema/ canónico e validator/src/akn_pt/data/:", file=sys.stderr)
        for name, reason in drift:
            print(f"  - {name}: {reason}", file=sys.stderr)
        print("\nCorrigir: python tools/sync_schemas.py", file=sys.stderr)
        return 1

    n = copy_all()
    print(f"\n✓ {n} ficheiros sincronizados de schema/ para validator/src/akn_pt/data/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
