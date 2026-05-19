# 10. Multilinguismo e Regiões Autónomas

## 10.1 Portugal como jurisdição monolingue

Para efeitos de AKN-PT, **Portugal é jurisdição monolingue** em português
europeu. Todos os actos do escopo da v0.1.0 são publicados em PT e:

- `<FRBRlanguage language="por">` é sempre obrigatório nas Expressions.
- `{language}` na URI ELI-PT é sempre `pt`.
- Não há versões em outras línguas dos atos PT (ao contrário do que acontece
  com atos UE no AKN4EU).

A excepção mais comum — texto bilingual no anexo de um Decreto da AR de
aprovação de tratado internacional — não modifica esta regra: o ato em si
é PT; o anexo pode conter texto original em outra língua, mas isso é
conteúdo do anexo, não uma Expression separada.

## 10.2 Regiões Autónomas — jurisdição, não língua

Açores e Madeira são tratados como **jurisdições distintas** dentro do mesmo
sistema linguístico. A distinção materializa-se em:

| Aspecto | Açores | Madeira |
|---|---|---|
| `<FRBRcountry value>` | `pt-20` | `pt-30` |
| Jurisdição na URI ELI-PT | `pt-20` | `pt-30` |
| Tipos de ato | DLR, DRR | DLR, DRR |
| Autoridade emanante (DLR) | Assembleia Legislativa Regional dos Açores (`#alra`) | Assembleia Legislativa Regional da Madeira (`#alrm`) |
| Autoridade emanante (DRR) | Governo Regional dos Açores (`#gov-regional-acores`) | Governo Regional da Madeira (`#gov-regional-madeira`) |
| Promulgação | Representante da República para os Açores | Representante da República para a Madeira |
| Sufixo do número em `<docNumber>` | `/A` (e.g. "n.º 3/2026/A") | `/M` (e.g. "n.º 3/2026/M") |
| Fórmula promulgatória | Cita "Região Autónoma dos Açores" e o Estatuto Político-Administrativo dos Açores | Equivalente para a Madeira |

## 10.3 Codificação ISO 3166-2

`pt-20` e `pt-30` seguem o standard ISO 3166-2:PT:

- `PT-20` — Açores (em minúsculas na URI: `pt-20`).
- `PT-30` — Madeira (em minúsculas na URI: `pt-30`).

Outros códigos ISO 3166-2:PT (distritos do continente) **não** são usados em
AKN-PT — actos relativos a distritos (e.g. Portarias específicas para um
município) usam jurisdição `pt` e identificam o distrito/concelho como
conteúdo, não como jurisdição.

## 10.4 Referenciação cruzada entre níveis

Referências de actos nacionais para actos regionais e vice-versa são
referências externas normais com URI ELI-PT completo:

```xml
<!-- Num DL nacional que referencia um DLR -->
<p>... nos termos do <ref href="https://eli.gov.pt/eli/pt-20/dlr/2025/4/pt">Decreto Legislativo Regional n.º 4/2025/A, de 1 de março</ref> ...</p>

<!-- Num DLR que referencia uma lei nacional -->
<p>... em conformidade com a <ref href="https://eli.gov.pt/eli/pt/lei/2026/12/pt">Lei n.º 12/2026, de 20 de fevereiro</ref> ...</p>
```

Nada de especial — a jurisdição é parte da URI; o validador trata
referências cruzadas como qualquer outra referência externa.

## 10.5 Línguas dos artefactos do projecto

Por ADR-0006, as línguas em uso são:

| Artefacto | Língua primária | Língua secundária |
|---|---|---|
| Especificação (este documento) | PT | EN summary (~20pp) |
| ADRs | EN | — |
| Mapping | PT | — |
| ELI-PT specification | PT | EN bilingual completo |
| Mensagens do validador | PT | EN via `--lang en` |
| Código (Python) e comentários | EN | — |
| Commits Git | EN | — |
| Outreach internacional | EN | — |
| Outreach institucional | PT | — |
| READMEs do repo | EN | — |
| Issue / PR templates | EN | — |

Esta separação reflecte a dualidade de audiência: comunidade jurídica
portuguesa (PT) vs. comunidade técnica internacional (EN), sem onerar nenhuma
das duas com tradução desnecessária.

## 10.6 O que não está em escopo

- **Documentos de outros sistemas linguísticos UE** — não fazem parte do
  AKN-PT; pertencem ao AKN4EU ou aos perfis nacionais respectivos. Quando
  referenciados, usam URIs próprias.
- **Tradução para línguas estrangeiras de actos PT** — fora de escopo da
  v0.1; quando existir necessidade técnica (e.g. consulta multilingue),
  abrir-se-á extensão para `<FRBRExpression>` em outras línguas que aponte
  para o mesmo `<FRBRWork>`.
- **Mirandês** — não há base legal para considerar atos em mirandês como
  jurisdição AKN-PT em v0.1; pode ser considerado em v0.2+ se houver caso
  de uso institucional.

## 10.7 Considerações para o futuro (v0.2+)

- Suporte explícito a versões traduzidas (e.g. tratado bilingual com a versão
  em outra língua como `<FRBRExpression language="eng">` apontando para o
  mesmo Work).
- Suporte a actos com regiões autónomas com texto particular para
  insularidade.
- Classificação EuroVoc multilíngue (que existe em todas as 24 línguas UE).
