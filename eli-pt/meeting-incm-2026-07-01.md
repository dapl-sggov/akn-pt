# Kit de reunião INCM — 2026-07-01

**Participantes (DAPL/SGGOV):** [a confirmar]
**Objeto:** Alinhamento do ELI-PT no contexto do projeto AKN-PT; reativação e
evolução do compromisso ELI de Portugal.
**Postura geral:** colaborativa mas firme. A INCM é parceiro indispensável e
detentor do mandato legal — não há AKN-PT viável sem ela. Mas chegamos com um
diagnóstico concreto (o ELI-PT regrediu) e uma proposta construída, não com uma
folha em branco.

> Material de apoio: [dossier de conhecimento ELI](research/eli-international-dossier.md)
> · [análise de lacunas](research/eli-pt-gap-analysis.md) · [especificação
> ELI-PT v0.1.0](specification-pt.md).

## 1. Objetivos da reunião (concretos)

1. **Estabelecer factualmente o estado real do ELI-PT na INCM** — confirmar se
   os Pilares I/II declarados em 2016/2017 continuam ativos após a migração
   para OutSystems, dado que a verificação externa indica que os URIs `/eli/`
   redirecionam para `/dr/home` e que não há RDFa/JSON-LD no HTML servido.
2. **Obter a especificação oficial e atual** dos três templates de URI ELI da
   INCM (jornal, ato, consolidada) e a tabela controlada de tipos de ato —
   para reconciliar com a nossa proposta de 9 tipos.
3. **Decidir o domínio e a autoridade de resolução** do ELI-PT (`data.dre.pt`
   vs. `eli.gov.pt`) e quem se compromete a garantir a persistência de longo
   prazo.
4. **Clarificar o modelo de governação** — quem detém autoridade normativa
   sobre a especificação ELI-PT e quem opera, à luz do modelo híbrido
   (ADR-001) e do precedente espanhol.
5. **Acordar próximos passos e calendário** — incluindo a possibilidade de a
   INCM injetar captura estrutural (AKN-PT) no novo Sistema de Submissão de
   Atos (SSA, em produção desde 05-01-2026).

## 2. Pontos de decisão que SÓ a INCM pode resolver

A DAPL pode propor, mas estas decisões são prerrogativa da INCM (titular do
mandato legal — DL 235/2015 / DL 83/2016):

- **Domínio final e autoridade de resolução.** O `data.dre.pt` é da INCM;
  qualquer namespace ELI-PT persistente vive sob a sua infraestrutura. Só a
  INCM pode comprometer-se com a meta de 100 anos.
- **Quem opera a resolução de URIs.** A camada de resolução (content
  negotiation, redirects 301/303, time-travel de consolidadas) corre na
  infraestrutura da INCM.
- **Registo no EUR-Lex.** Só o coordenador nacional ELI (de facto, a INCM)
  pode declarar/atualizar o template no registo do Publications Office.
- **Calendário de (re)implementação.** Pilares III (RDFa/JSON-LD) e IV
  (feeds), e eventual exportação AKN, dependem do roadmap técnico da INCM.
- **Base legal / caderno de encargos.** Se a (re)implementação carecer de
  instrumento jurídico (alteração regulamentar, protocolo SGGOV-INCM, caderno
  de encargos), é a INCM a responsável pela edição autêntica — sob
  superintendência do Primeiro-Ministro.

## 3. Banco de perguntas (agrupadas e priorizadas)

### A. Técnicas — **prioridade máxima**

1. **[P1]** Os Pilares I e II declarados ao EUR-Lex (2016/2017) ainda estão
   **ativos** após a migração para OutSystems? Porque é que
   `https://dre.pt/eli/lei/.../p/dre` redireciona para `/dr/home` em vez de
   resolver o ato?
2. **[P1]** Qual é a **especificação completa e atual** dos três templates de
   URI (jornal, ato, consolidada), incluindo a gramática de componentes?
3. **[P1]** O template ELI-PT do ato usa a **data que consta da citação** (a
   data do diploma — "..., de {dia} de {mês}") ou a **data de publicação no
   DR**? (Determina se o URI canónico data.dre.pt é construível diretamente a
   partir da citação completa, ou se há desfasamento citação↔publicação.)
   Zero-padding ou sem zeros à esquerda (convenção UE/FR)?
4. **[P1]** O ELI-PT desce a **nível de artigo/subdivisão** (como FR
   `/article_N`, IE `/section/N`) ou para no nível do ato? Determina como
   mapeamos os eIds AKN-PT.
5. **[P2]** O DRE serve HTML server-side (onde se pode embeber **RDFa**) ou
   exige JSON-LD por renderização JS? Qual o plano para re-emitir metadados?
6. **[P2]** Que **versão da ontologia** está em produção (declararam v1.1 em
   2017)? Há plano para v1.5 (2024)?
7. **[P2]** Existe **API pública documentada** (REST/SPARQL) ou o único acesso
   programático continua a ser via endpoints JSON OutSystems internos?
8. **[P3]** Há **content negotiation** (Accept + extensões + 303), ou só URLs
   com extensão explícita?
9. **[P3]** Publica-se ou planeia-se **feed Atom/sitemap (Pilar IV)** para
   harvesting EUR-Lex/DCAT-AP?

### B. Governação — **prioridade alta (é aqui que a reunião se ganha ou perde)**

10. **[P1]** Quem é, **formalmente, o coordenador nacional ELI** de Portugal
    junto do Publications Office? A declaração no registo está atualizada?
11. **[P1]** Quem detém a **autoridade normativa** sobre a especificação
    técnica ELI-PT — a INCM como operador, ou deveria existir um órgão de
    coordenação (tipo Grupo de Trabajo ELI espanhol)? Como se articula com o
    modelo híbrido do ADR-001?
12. **[P2]** Quem é o **owner técnico** do mapping ELI na INCM, disponível para
    alinhar o padrão de URI com o AKN-PT?
13. **[P2]** A INCM participa ativamente na **ELI Task Force / eLaw Working
    Party**, ou apenas consome o standard?
14. **[P3]** Qual o enquadramento jurídico para o **AKN-PT coexistir** com a
    edição autêntica (Lei 74/98, art. 1.º n.º 5) — representação derivada,
    formato de intercâmbio, ou candidato a futura fonte autêntica?

### C. Calendário

15. **[P1]** O novo **SSA (jan/2026)** captura estrutura semântica na origem
    (drafting estruturado) ou apenas ficheiros? Há aqui oportunidade de injetar
    AKN-PT no ponto de submissão?
16. **[P2]** Qual o **horizonte realista** da INCM para re-emitir ELI (Pilar
    III) e adotar feeds (Pilar IV)?
17. **[P3]** Que **dependências** (orçamento, contratação, prioridades
    internas) condicionam o calendário?

### D. Recursos

18. **[P2]** Que **recursos técnicos** a INCM pode alocar a um trabalho
    conjunto AKN-PT / ELI-PT?
19. **[P3]** Existem **datasets oficiais** em dados.gov.pt / data.europa.eu,
    ou a federação cobre só metadados de catálogo?
20. **[P3]** Há disponibilidade para **indexação EuroVoc** (`is_about`),
    nativa ou via vocabulário nacional mapeado?

## 4. O que a DAPL leva para a mesa

- **A proposta ELI-PT v0.1.0 como contributo técnico** (não imposição):
  template, 9 tipos, FRBR, metadados, point-in-time, fragmentos via eId,
  permanência. Apresentar como rascunho aberto à reconciliação com o template
  real da INCM.
- **O diagnóstico do gap** (factual, verificável): URIs `/eli/` partidos,
  ausência de RDFa/JSON-LD — enquadrado como dívida técnica a saldar **em
  conjunto**, não como crítica.
- **O ativo AKN-PT**: a estrutura semântica que a INCM não tem hoje (portal só
  serve HTML renderizado + PDF) e que dá granularidade ao artigo e
  interoperabilidade aberta.
- **Os precedentes europeus** como argumentos: consolidação LU/IT,
  granularidade FR/IE, governação ES, par ELI+AKN4EU do Publications Office,
  LEOS como prova de implementação conjunta.
- **O argumento institucional**: Interoperable Europe Act (2024/903) reforça a
  pressão por identificadores comuns (sem tornar o ELI obrigatório).

## 5. Riscos e pontos de tensão antecipados

- **A INCM pode querer domínio próprio e controlo total.** É legítimo — tem o
  mandato exclusivo. Risco: a DAPL ficar reduzida a "fornecedor de XML".
  *Mitigação:* invocar o modelo ES (norma separada da operação) e o ADR-001;
  posicionar a DAPL como autoridade normativa/legística, a INCM como operador.
- **Divergência de modelo de dados.** A INCM tem backend próprio (sem AKN);
  pode resistir. *Mitigação:* enquadrar AKN como formato de intercâmbio/
  representação derivada, não substituição da edição autêntica; oferecer o
  conversor bidirecional.
- **Propriedade / conflito de interesses (ADR-001).** A INCM controla
  publicação e porta de entrada (SSA). Pode ver o AKN-PT como intrusão.
  *Mitigação:* posicionar como benefício mútuo (cumprimento do compromisso ELI
  + valor acrescentado).
- **A INCM pode estar defensiva quanto ao gap.** Apontar regressão pode soar a
  acusação. *Mitigação:* facto técnico neutro, focar na solução, dar à INCM o
  crédito da implementação original de 1991/2016.
- **Desalinhamento de calendário.** A INCM acabou de lançar o SSA.
  *Mitigação:* ligar o AKN-PT ao SSA como oportunidade de captura na origem.
- **Quem assina o quê.** Pode faltar instrumento jurídico habilitante.
  *Mitigação:* levar a hipótese de protocolo SGGOV-INCM para discussão, sem
  fechar.

## 6. Próximos passos pós-reunião (proposta)

1. **Ata técnica conjunta** com decisões e questões em aberto, validada por
   ambas as partes (prazo: 1 semana).
2. **Obtenção da especificação oficial dos templates ELI-PT** da INCM, para
   reconciliar com a v0.1.0 e produzir uma **v0.2.0 alinhada**.
3. **Decisão formalizada (ADR-0009)** sobre domínio e autoridade de resolução,
   com a posição da INCM registada.
4. **Definição do modelo de governação** (quem normaliza, quem opera, quem
   regista no EUR-Lex) — eventual minuta de protocolo SGGOV-INCM.
5. **Prova de conceito conjunta**: mapear 3–5 diplomas reais AKN-PT → ELI-PT,
   validando a composição eId→fragmento e a resolução de consolidadas.
6. **Roadmap de (re)implementação** dos Pilares III e IV pela INCM, com
   avaliação da integração no SSA.
7. **Agendar reunião de seguimento** (M+1) para validar a v0.2.0 e o protocolo.

---

## Anexo — Checklist de 1 página para levar à mesa

**Confirmar (factos):** ☐ Pilares I/II ainda ativos? ☐ template oficial dos 3
URIs ☐ data assinatura vs publicação ☐ desce a artigo? ☐ versão ontologia em
produção ☐ coordenador nacional ELI formal ☐ SSA capta estrutura?

**Decidir (com a INCM):** ☐ domínio (`data.dre.pt`?) ☐ **adotar data completa**
(template INCM em produção; construível a partir da citação legística completa
— ano+número fica só como alinhamento estético UE/jurisdição explícita) ☐ quem
normaliza / quem opera ☐ calendário Pilares III/IV ☐
instrumento jurídico (protocolo?)

**Levar:** ☐ ELI-PT v0.1.0 impressa ☐ gap-analysis ☐ 3 diplomas AKN-PT de
exemplo ☐ argumento Interoperable Europe Act ☐ proposta de PoC conjunta
