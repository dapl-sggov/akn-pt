# Kit de reunião INCM — 2026-07-01

**Participantes (DAPL/SGGOV):** [a confirmar] · **INCM (DTI):** Diogo Proença, Bruno Pereira, Vítor Hugo Faria, Ricardo Matias, Inês Costa Marques.
**Objeto:** Alinhamento do AKN-PT com o ELI-PT em produção da INCM; oportunidades de colaboração (estrutura na origem, interoperabilidade aberta).
**Postura geral:** **colaborativa**. A INCM é parceiro indispensável, detentor do mandato legal **e** um implementador ELI maduro — pioneiro europeu do Pilar IV. Chegamos **já alinhados** com o vosso esquema real (não a diagnosticar problemas), com uma proposta construída e verificada.

> **Correção de pressuposto (importante):** a versão anterior deste kit assumia que "o ELI-PT regrediu" (URIs `/eli/` a cair em `/dr/home`, sem RDFa, sem feeds). A resposta da INCM de 2026-06-22 **e a nossa verificação empírica** desmentiram-no: os `/eli/` resolvem (301→200), o RDFa está no HTML servido a crawlers, a ontologia está atualizada, e o DR foi o **1.º jornal oficial europeu no Pilar IV**. Esta nova versão reflete isso.

> Material de apoio: [referência oficial INCM (tipos+gramática)](incm-eli-reference.md) · [dossier ELI](research/eli-international-dossier.md) · [análise de lacunas](research/eli-pt-gap-analysis.md) · [especificação ELI-PT](specification-pt.md).

## 1. O que já está estabelecido (resposta INCM 2026-06-22 + verificação)

Confirmado por email e testado por nós (resolução + RDFa em 14 tipos, 1991→2022):

- **Pilares I–IV ativos e em produção.** `/eli/` resolve; RDFa ELI no HTML (pré-renderizado para crawlers; o EUR-Lex faz scraping diário); ontologia na última versão; sitemap + **Atom update feed** (Pilar IV) públicos; piloto de pesquisa federada com ES + LU.
- **Template real** (ato): `data.dre.pt/eli/{tipo}/{nº}/{ano}/{mês}/{dia}/{p|a|m}/dre/{lang}/{fmt}`; consolidada `.../{ano}/{p|a|m}/cons/{AAAAMMDD}/...`; jornal `.../diario/{série}/{nº}/{ano}/{supl}/...`. Data de **publicação**, zero-padding. Território `p`/`a`/`m`.
- **2.ª série incluída desde 1991** (desde que o ato tenha número).
- **Sem API pública**; harvesting via scraping/feed (não usar endpoints OutSystems internos — instáveis).
- **Vocabulário de assunto nacional** (não EuroVoc) em RDF/SKOS (~70k conceitos): `is_about`.
- **SSA (jan/2026) capta apenas ficheiros**; a **estrutura semântica** é capturada **a jusante**, no sistema de edição da INCM, num **XML proprietário interno** (usado para índice + articulado no site).

**O que já fizemos com base nisto:** alinhámos o AKN-PT/ELI-PT ao template real — slugs reais (`port`, `resolconsmin`, `declegreg`…), forma do URI (Work `/{p|a|m}/dre`, consolidadas `/cons`), relação habilitante `based_on`, língua `pt`/`PRT`; corpus de 8 diplomas reais com ELI verificado; editor que emite a forma canónica.

## 2. Objetivos da reunião

1. **Validar os detalhes finos do template** contra a página oficial: tabela controlada de tipos (mapeámos os nossos 9 → slugs reais; falta confirmar `decreto-ar`→`dec`), forma das consolidadas, e o **código de língua** (`pt` no path vs `por`/`PRT` nos metadados).
2. **Apresentar o alinhamento** que já fizemos (corpus real, editor, conversor citação→ELI) e validá-lo com a INCM.
3. **A oportunidade central — estrutura na origem.** O SSA capta só ficheiros; a estrutura entra a jusante, em XML proprietário. Propor: (a) **edição estruturada em standard aberto a montante** (na redação, lado SGGOV/DAPL); (b) **AKN-PT como forma aberta e interoperável** do XML interno da INCM — definir o mapeamento.
4. **Governação** — quem detém autoridade normativa sobre o perfil AKN-PT/ELI-PT e quem opera (modelo híbrido ADR-001; precedente espanhol Grupo de Trabajo ≠ AEBOE).
5. **Próximos passos e calendário** — 2.ª série, mapeamento do vocabulário nacional (e eventual ponte para EuroVoc), e o caso de uso de um serviço de resolução citação→ELI.

## 3. A oportunidade AKN-PT (o "pitch" — 3 minutos)

O ELI da INCM está sólido; **o AKN-PT não vem corrigir o ELI — vem acrescentar a camada que falta: estrutura semântica aberta, e a montante.**

- Hoje: SSA recebe **ficheiros**; a estrutura (articulado, índice) é reconstruída **depois**, na INCM, num XML **proprietário** e **interno**.
- Proposta: **AKN-PT** (OASIS LegalDocML, standard aberto) como (1) formato de **captura na origem** — o legislador/redator produz estrutura desde o início (o nosso editor demonstra-o); e (2) **forma interoperável** do XML interno da INCM, com mapeamento bidirecional. Resultado: o articulado estruturado deixa de ser um ativo fechado e passa a reutilizável (UE, tribunais, académicos, IA).
- **Não pisa o terreno da INCM:** a INCM continua a editar e a publicar (mandato legal); a captura estrutural a montante é domínio da DAPL/SGGOV. É soma, não sobreposição.

## 4. Pontos de decisão (com a INCM)

- ☐ **Domínio**: confirmar `data.dre.pt` como canónico do ELI-PT (já adotado por nós).
- ☐ **Tabela de tipos**: confirmar o mapa AKN-PT→slug, em especial `decreto-ar`→`dec`.
- ☐ **Consolidadas / língua**: confirmar `/{ano}/{p|a|m}/cons/{AAAAMMDD}` e `pt`(path) vs `PRT`(metadados).
- ☐ **Governação**: quem normaliza (perfil) vs quem opera (resolução/publicação).
- ☐ **SSA / estrutura na origem**: abertura para captura AKN-PT a montante e/ou mapeamento do XML interno ↔ AKN-PT.
- ☐ **Instrumento**: protocolo SGGOV–INCM? caderno de encargos? alteração regulamentar?

## 5. Banco de perguntas

### A. Já respondidas por email (2026-06-22) — confirmar/aprofundar
1. ✅ Pilares I/II ativos? **Sim.** → *Confirmar planos de evolução.*
2. ✅ Spec dos 3 templates? **Página oficial DRE/ELI.** → *Validar a nossa leitura (incm-eli-reference.md).*
3. ✅ 2.ª série? **Sim, desde 1991.** → *Quais tipos da 2.ª série interessam ao escopo conjunto?*
4. ✅ Data assinatura vs publicação? **Publicação, zero-padding.** → *Confirmar que a data da citação ("de {dia} de {mês}") = data do path (sem desfasamento).* **[P1 — afeta a construtibilidade citação→ELI]**
5. ✅ Nível de artigo/subdivisão? **Não, está nos planos.** → *Quando? O nosso `#eId` está pronto a alimentar isso.*
6. ✅ RDFa no HTML? **Sim (para crawlers).** → *Servem RDFa só a user-agents de bot? Há plano de SSR/JSON-LD para todos?*
7. ✅ Versão da ontologia? **A última.** → *Confirmar (v1.5?) e se publicam o changelog.*
8. ✅ API pública? **Não; scraping/feed.** → *Aceitam um cliente de harvesting nosso sobre o feed/sitemap?*
9. ✅ Content negotiation? **Não.** → *Planeiam? (afeta dereferenciação programática)*
10. ✅ Pilar IV (feed/sitemap)? **Pioneiros; em produção.** → *Cadência de atualização do feed? formato DCAT-AP?*

### B. Novas — forward-looking
11. **[P1]** O **XML interno** da INCM (estrutura do articulado) — qual o esquema? Há abertura para um **mapeamento AKN-PT ↔ esse XML**?
12. **[P1]** O **SSA** poderia aceitar (ou evoluir para) **captura estrutural a montante** (AKN-PT) na submissão, em vez de só ficheiros?
13. **[P2]** **Vocabulário nacional de assunto** (`dre-incm-pt-legal-subject.rdf`) — está mapeado a **EuroVoc**? Aceitariam contribuição de mapeamento?
14. **[P2]** **Atos regionais** (DLR/DRR) — resolução ELI passa pelos jornais regionais (JORAA/JORAM) ou tudo por `data.dre.pt`? Como tratam território (`a`/`m`) + jurisdição?
15. **[P2]** **Cobertura pré-1991** (1.ª série) — está fora do ELI? (o Cód. IRS, DL 442-A/88, não resolve). Há plano de retrodigitalização ELI?
16. **[P3]** **Governação ELI-PT** — a INCM vê com bons olhos um perfil AKN-PT/ELI-PT co-normalizado (DAPL norma o perfil, INCM opera/publica), à imagem ES?

## 6. Riscos / sensibilidades

- **Não chegar como quem "corrige" a INCM.** O ELI deles está bom; a nossa mais-valia é a montante (estrutura aberta), não a jusante.
- **Conflito de interesses (ver project_governance):** manter a fronteira clara — DAPL não opera publicação autêntica.
- **Dependência:** sem a INCM não há ELI persistente; toda a proposta assume a INCM como operador.

## Anexo — Checklist de 1 página

**Confirmar (factos):** ☐ data citação = data path? ☐ tabela de tipos (decreto-ar→dec) ☐ consolidadas/língua ☐ versão ontologia ☐ esquema do XML interno ☐ cobertura pré-1991.

**Decidir (com a INCM):** ☐ `data.dre.pt` canónico ✓ ☐ SSA / captura estrutural a montante ☐ mapeamento AKN-PT↔XML interno ☐ quem normaliza / quem opera ☐ vocabulário→EuroVoc ☐ instrumento jurídico (protocolo?).

**Levar na pasta:** [`incm-eli-reference.md`](incm-eli-reference.md) (a nossa leitura do template, para validar linha a linha) · corpus de 8 diplomas reais · demo do editor (emite ELI canónico + RDFa/JSON-LD).
