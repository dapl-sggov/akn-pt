# 1. Introdução

## 1.1 Propósito

O AKN-PT é o perfil nacional português do standard internacional Akoma Ntoso
(OASIS LegalDocML 1.0), aplicado à representação estruturada dos atos
normativos publicados em Portugal.

Define, num único corpo coerente:

1. **Que tipos de ato** estão cobertos (catálogo da v0.1.0).
2. **Que estrutura XML** cada tipo deve ter (XSD + Schematron).
3. **Como se identificam** acto e respetivas versões (esquema ELI-PT).
4. **Que metadados** os acompanham (FRBR triple + actores + lifecycle).
5. **Como se valida** um documento candidato (modelo de validação em três fases).
6. **Como se reutiliza** o resultado (referenciação, citações, conversões).

Esta especificação é simultaneamente:

- **Documento normativo** para quem produz, transporta ou consome AKN-PT;
- **Contrato de interoperabilidade** com sistemas externos (SmartLegis,
  Diário da República, EUR-Lex);
- **Memória institucional** das decisões técnicas tomadas durante a sua
  construção.

## 1.2 Contexto

Portugal produz hoje a sua legislação em DOCX e publica-a em PDF e HTML
através do Diário da República. Em paralelo, vários ecossistemas internacionais
convergem para o standard Akoma Ntoso: Itália (Senato della Repubblica), União
Europeia (AKN4EU, Publications Office), Grécia (Parlamento Helénico), Espanha
(BOE), Reino Unido (National Archives), Brasil (LexML), África do Sul, Quénia.

A janela imediata em que o AKN-PT deve estar pronto tem três alinhamentos:

- A plataforma **SmartLegis** entra em produção em 2026; definir agora o
  formato canónico decide o resto.
- A **Lei n.º 5-A/2026** torna a pegada legislativa obrigatória a 27 de julho
  de 2026; sem texto estruturado, a sua implementação técnica fica frágil.
- A **missão prevista a Bruxelas** abre acesso directo a quem governa o
  AKN4EU (Publications Office) e ao instrumento de financiamento TSI da
  DG REFORM.

Adoptar agora não é vanguarda — é convergência com prática estabelecida nos
sistemas comparáveis. Sem o standard, qualquer investimento subsequente em
consolidação automática, pegada legislativa, IA legal ou interoperabilidade
com EUR-Lex continuará a ser frágil e caro.

## 1.3 Audiência

| Audiência | O que tira da spec |
|---|---|
| Implementador técnico (SGGOV, INCM, AR, fornecedores SmartLegis) | Schemas, regras de validação, contratos URI, formato de metadados |
| Jurista que produz texto legal | Compreensão do modelo, casos especiais, glossário PT-EN |
| Comunidade internacional Akoma Ntoso | Posicionamento do perfil PT face a AKN4EU, IT, BR; conformance level |
| Auditor / revisor externo | Decisões registadas; fundamentação técnica; trade-offs explícitos |
| Investigador (FDUL/ICJP) | Catálogo da tipologia PT mapeado a um standard internacional |

## 1.4 Posicionamento face a outros standards e perfis

```
   Akoma Ntoso 1.0  (OASIS LegalDocML, 2018)
        |
        +--- AKN4EU                    (perfil UE; Publications Office; IMFC desde 2018)
        +--- AKN-IT (Senato)           (perfil italiano, estricto, em uso desde 2013)
        +--- LegalDocML.de             (perfil alemão, Bundestag)
        +--- AKN-PT  <-- esta spec     (perfil português, v0.1.0)
        +--- LexML Brasil
        +--- (outros)
```

O AKN-PT **não substitui** o Akoma Ntoso — restringe-o e contextualiza-o.

- O **namespace XML é o canónico OASIS**:
  `http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD17`.
- O **perfil nacional** é declarado em `<FRBRformat>`:
  `application/akn+xml; profile=akn-pt-1.0`.

Esta separação garante que ferramentas genéricas Akoma Ntoso (parsers,
viewers, transformadores) reconhecem o documento como AKN; o perfil PT
adiciona invariantes nacionais sem fragmentar a ecologia.

## 1.5 Escopo da v0.1.0

A versão 0.1.0 estabelece **cobertura completa** para os quatro tipos de ato
de maior frequência e impacto:

- **Decreto-Lei** (todas as variantes: ordinário, autorizado, parlamentar, transposição)
- **Lei** da Assembleia da República
- **Portaria**
- **Resolução do Conselho de Ministros**

E **cobertura de esqueleto** (mapping + XSD, sem exemplo de corpus) para:

- Decreto da AR
- Resolução da AR
- Despacho normativo
- Decreto Legislativo Regional (Açores e Madeira)
- Decreto Regulamentar Regional

Fora de escopo da v0.1.0 (sem prejuízo de versões posteriores):

- Jurisprudência (acórdãos do TC, STJ, STA, TRs) — Akoma Ntoso tem modelo
  separado `<judgment>` que justifica artefacto próprio;
- Atos administrativos (alvarás, licenças, decisões individualizadas);
- Atos pré-1976 (complicações técnicas e historiográficas);
- Atos orçamentais (Orçamento do Estado tem regime próprio);
- Comunicações ao Tribunal Constitucional;
- Avisos do Banco de Portugal, CMVM e demais autoridades reguladoras
  independentes (publicação por canais próprios).

## 1.6 Princípios orientadores

Sete princípios condicionaram todas as decisões técnicas registadas nesta
spec:

1. **Convergência com o standard internacional, não divergência.** Quando há
   dúvida entre invenção PT e prática já estabelecida em AKN4EU/AKN-IT,
   prefere-se a prática estabelecida.
2. **Estruturação dos metadados é tão importante como a estruturação do corpo.**
   Sem FRBR completo, ELI-PT estável e references TLC, o ganho técnico do AKN
   é metade.
3. **Modelo de validação em três fases** (drafting / review / publication),
   reconhecendo que a legística real tem latitude no momento de redacção que
   não tem no momento da publicação.
4. **Permanência de URIs é compromisso institucional**, não escolha técnica.
5. **EUPL-1.2 desde o primeiro commit.** Tudo o que aqui está pertence à
   comunidade.
6. **Decisões registadas com fundamentação.** ADRs e changelog de schema
   tornam a especificação reversível.
7. **Compatibilidade forward.** Documentos válidos hoje têm de continuar
   válidos quando o schema evoluir; documentos antigos validam para sempre
   contra a versão do schema que viram nascer.

## 1.7 Estrutura desta especificação

A spec está organizada em três grandes blocos:

- **Capítulos 1–4** — enquadramento: o que é, o que cobre, como se conforma,
  que documentos modela.
- **Capítulos 5–11** — modelo técnico: estrutura, mapeamento por tipo,
  identificadores, metadados, ciclo de vida.
- **Capítulos 12–17** — operação: validação, extensões, exemplos, glossário,
  referências, changelog.

Cada capítulo é auto-contido — pode ser lido isoladamente, mas os
cross-references são frequentes e devem ser seguidos quando aparecerem.

## 1.8 Licença e custódia

Esta especificação é publicada sob **Licença Pública da União Europeia
(EUPL-1.2)**, nos termos da Decisão de Execução (UE) 2017/863 da Comissão.
Qualquer redistribuição, derivação ou implementação derivada **DEVE** manter
a mesma licença ou licença compatível.

A custódia técnica do documento é da Divisão de Apoio ao Processo
Legislativo (DAPL) da Secretaria-Geral do Governo, sob o modelo de
governação hibrido formalizado na ADR-0001 (sanção do Secretário-Geral +
Comissão Técnica AKN-PT interinstitucional).
