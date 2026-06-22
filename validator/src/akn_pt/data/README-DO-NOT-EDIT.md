# `validator/src/akn_pt/data/` — cópia sincronizada (NÃO EDITAR)

Os ficheiros XSD e Schematron neste directório são **cópias automaticamente
sincronizadas** a partir da fonte autoritativa em `schema/`:

| Ficheiro neste directório         | Fonte autoritativa                            |
|-----------------------------------|-----------------------------------------------|
| `akn-pt.xsd`                      | `schema/xsd/akn-pt.xsd`                       |
| `akn-pt-types.xsd`                | `schema/xsd/akn-pt-types.xsd`                 |
| `akn-pt-metadata.xsd`             | `schema/xsd/akn-pt-metadata.xsd`              |
| `akn-pt-structure.xsd`            | `schema/xsd/akn-pt-structure.xsd`             |
| `akn-pt-rules.sch`                | `schema/schematron/akn-pt-rules.sch`          |

**Não edite directamente os ficheiros neste directório.** Quaisquer edições
serão silenciosamente sobrescritas pelo `tools/sync_schemas.py` e a CI
falhará no job `schema-sync` (cf. `.github/workflows/ci.yml`).

## Porquê esta cópia existe

O pacote do validador é distribuído como Python `package_data` (cf.
`pyproject.toml` `[tool.setuptools.package-data]`). O `importlib.resources`
só consegue resolver ficheiros que vivam **dentro** do package — não pode
sair para `../../schema/`. Por isso mantemos uma cópia local, sincronizada.

## Como manter sincronizado

```bash
# Sincronizar (copia schema/ → validator/src/akn_pt/data/)
python tools/sync_schemas.py

# Verificar sincronização (usado em CI — sai com 1 se houver drift)
python tools/sync_schemas.py --check
```

A CI corre o `--check` no job `schema-sync` (job 1 em `ci.yml`) e bloqueia
o merge se houver drift. Localmente, se acabou de editar `schema/`, corra
`python tools/sync_schemas.py` antes de fazer commit.

## Fluxo recomendado de edição

1. Editar **apenas** ficheiros em `schema/`.
2. `python tools/sync_schemas.py` (copia para aqui).
3. `git add schema/ validator/src/akn_pt/data/` (commitar ambos os lados).
4. `python schema/tests/run_tests.py` (verificar 43+ cenários).
5. `cd validator && python -m pytest` (verificar testes do validador).
