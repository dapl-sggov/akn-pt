# ADR-0008 — Stack do validador: Python 3.12+ + lxml

- **Estado:** Accepted
- **Data:** 2026-05-19

## Contexto

O validador AKN-PT precisa de correr XSD + Schematron + checks Python
customizados (ELI-PT, refs cruzadas, lifecycle coherence). Tem de ser
usável como CLI, lib Python e via Docker.

Stacks avaliadas:

1. **Java + Saxon** — gold standard para XML. Saxon-EE tem suporte Schematron
   nativo e XSLT 2.0/3.0. Desvantagem: dependência pesada, distribuição
   complexa, JVM startup.
2. **Node.js + xmllint / sax** — lightweight. Desvantagem: ecossistema XML em
   JS é fraco; Schematron via XSLT 1.0 com libxml2 é limitado.
3. **Python + lxml** — lxml encapsula libxml2 + libxslt. Schematron via
   `lxml.isoschematron`. Boa ergonomia para checks customizados.
4. **Rust + xmlrs / quick-xml** — performance excelente, mas Schematron
   inexistente; reimplementar é fora do scope.

## Decisão

**Python 3.12+ + lxml.**

- CLI distribuído como pacote PyPI (`akn-pt`) — `pip install akn-pt`.
- Lib importável: `from akn_pt import validate`.
- Docker image (`Dockerfile` na raiz do `validator/`) para CI e ambientes sem
  Python.
- `pyproject.toml` com setuptools (evita problemas reportados em Python 3.14
  com hatchling).

## Consequências

**Positivas:**

- lxml entrega XSD 1.1, XSLT 1.0/2.0 (via libxml2/libxslt) e Schematron via
  `lxml.isoschematron`.
- Distribuição via `pip` cobre Linux, macOS, Windows sem instalação manual de
  Java.
- Ecossistema Python rico para checks adicionais (regex ELI-PT, parsing
  datas, etc.).
- 51 testes em `validator/tests/` validam parser, CLI, i18n, integração com
  corpus.

**Negativas:**

- lxml binário tem wheels pré-compiladas mas em algumas arquitecturas exóticas
  exige build (raro).
- `lxml.isoschematron` emite `<active-pattern>` enquanto Saxon emite
  `<fired-pattern>` — pipelines downstream que consomem SVRL precisam de
  aceitar ambos.
- XPath 1.0 em Schematron via lxml não compara datas ISO como strings —
  workaround documentado: `number(translate(@date, '-', ''))`.

## Notas

Se algum stakeholder institucional exigir Saxon (por compatibilidade com
pipeline existente), o `validator/` permite swap do engine SCH sem mudar a
interface CLI — basta substituir o módulo `akn_pt.schematron`.
