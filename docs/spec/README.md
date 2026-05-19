# Specification (Artefacto 1)

The AKN-PT specification — PT primary body + EN summary.

## Layout

```
docs/spec/
├── pt/
│   ├── index.md                       ← entry / TOC
│   ├── 01-introducao.md
│   ├── 02-conformidade.md
│   ├── 03-modelo-documental.md
│   ├── 04-tipologia-atos.md
│   ├── 05-estrutura-documento.md
│   ├── 06-mapeamento-estrutural.md
│   ├── 07-referencias-citacoes.md
│   ├── 08-identificadores.md
│   ├── 09-metadados.md
│   ├── 10-multilinguismo.md
│   ├── 11-ciclo-vida.md
│   ├── 12-validacao.md
│   ├── 13-extensoes-proibicoes.md
│   ├── 14-exemplos.md
│   ├── 15-glossario.md
│   ├── 16-referencias.md
│   └── 17-changelog.md
├── en/
│   └── executive-summary.md
├── pandoc-metadata.yaml               ← shared Pandoc config
└── Makefile                           ← build PDF via Pandoc
```

## Build PDF (opcional — não obrigatório)

Requer Pandoc 3.x e LaTeX (XeLaTeX).

```bash
cd docs/spec
make pt        # → AKN-PT-Specification-v0.1.0-pt.pdf
make en        # → AKN-PT-Specification-v0.1.0-en.pdf
make all       # ambos
make clean
```

A spec é entregue em Markdown — o PDF é produto derivado, gerado por
CI ou localmente. Markdown é a fonte autoritativa.

## Estado da spec

| Capítulo | Estado |
|---|---|
| 1. Introdução | Completo |
| 2. Conformidade | Completo |
| 3. Modelo documental | Completo |
| 4. Tipologia | Completo |
| 5. Estrutura geral | Completo |
| 6. Mapeamento por tipo | Completo |
| 7. Referências e citações | Completo |
| 8. Identificadores | Completo |
| 9. Metadados | Completo |
| 10. Multilinguismo | Completo |
| 11. Ciclo de vida | Completo |
| 12. Validação | Completo |
| 13. Extensões e proibições | Completo |
| 14. Exemplos | Completo |
| 15. Glossário PT-EN | Completo |
| 16. Referências bibliográficas | Completo |
| 17. Changelog | Completo |
| EN executive summary | Completo |

Total: ~52 páginas A4 corpo 11 em PT + ~12 páginas EN.
