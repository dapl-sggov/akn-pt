# ADR-0005 — Namespace OASIS CSD17 + perfil em `<FRBRformat>`

- **Estado:** Accepted
- **Data:** 2026-05-19

## Contexto

O AKN-PT é um perfil nacional do Akoma Ntoso. Há duas escolhas a fazer:

1. **Que namespace usar para os elementos AKN?**
   - Namespace OASIS oficial (`http://docs.oasis-open.org/legaldocml/ns/akn/3.0`).
   - Namespace português próprio (e.g. `http://eli.gov.pt/ns/akn-pt/1.0`).

2. **Como sinalizar que um documento adere ao perfil AKN-PT?**
   - Elemento custom no namespace PT.
   - Atributo em `<FRBRformat>` indicando o profile.
   - Schema location.

## Decisão

**Namespace:** OASIS CSD17 oficial. Todos os elementos AKN-PT vivem no
namespace `http://docs.oasis-open.org/legaldocml/ns/akn/3.0`.

**Sinalização do perfil:**

```xml
<FRBRformat value="application/akn+xml; profile=akn-pt-1.0"/>
```

O parâmetro `profile=` no media type identifica o perfil. Tools que não
conhecem AKN-PT vêem um documento AKN válido; tools AKN-PT-aware activam
regras adicionais.

## Consequências

**Positivas:**

- **Compatibilidade ascendente** — ferramentas AKN canónicas (Bungeni, LEOS)
  conseguem ler documentos AKN-PT sem modificação.
- **Sem inventar XML** — a única extensão é metadados (`<FRBRformat>`).
- Sinalização via media-type parameter alinha com RFC 6838 e práticas web.

**Negativas:**

- Não permite invalidar documentos AKN-PT no parser XML — a validação do
  perfil faz-se via Schematron, fora do XSD canónico.
- `<workflow>` AKN com `<input>` como filho de `<step>` é extensão semântica,
  não sintáctica — não é rejeitada por validators canónicos, mas pode ser
  ignorada por eles.

## Notas para revisão externa

Pergunta para Palmirani: o uso de `profile=` em `<FRBRformat>` é aceitável,
ou OASIS prefere outro mecanismo (e.g. atributo `xmlns:aknpt` em
`<akomaNtoso>`)?
