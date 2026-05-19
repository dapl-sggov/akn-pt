# ELI-PT — Política de permanência e versionamento

## Princípio geral

Os URIs ELI-PT são **identificadores estáveis a longo prazo**. A estabilidade
não é uma opção técnica — é a única razão pela qual estes URIs valem a pena
existir.

## Compromisso por camada FRBR

### Work URI

- **Permanente para sempre.**
- Não pode ser reatribuído a outro ato, mesmo após revogação.
- Mesmo se o ato for revogado, o URI continua válido para resolver para uma
  representação histórica (ou para uma representação "este ato foi revogado, ver X").

### Expression URI

- **Permanente para sempre.**
- Identifica uma versão concreta no tempo. Novas consolidações criam novos
  Expression URIs (com `{point-in-time}` mais recente); URIs anteriores
  continuam a resolver para a versão a que se referem.

### Manifestation URI

- **Permanente em condições normais.**
- **Pode ser regenerado** se a manifestação binária mudar — por exemplo:
  - Correção de erro de marcação no XML.
  - Migração entre versões do schema AKN-PT.
  - Substituição do PDF facsimile por versão de melhor qualidade.
- A nova manifestação **DEVE** ser semanticamente equivalente à anterior.
- O URI antigo **DEVE** responder com HTTP 301 para o novo.

## Compromisso temporal

| Camada | Período mínimo de permanência |
|---|---|
| Work | Permanente — sem prazo |
| Expression | Permanente — sem prazo |
| Manifestation | 25 anos com URI estável, idealmente permanente |

A meta de 100 anos referida no ELI europeu aplica-se a Work e Expression
sem reserva. Manifestation tem flexibilidade técnica mas a expectativa
operacional é também de longo prazo.

## Mudanças permitidas

Sob esta política, são permitidas as seguintes operações que afectam URIs:

| Operação | Permitida? | Tratamento |
|---|---|---|
| Reatribuir Work URI a outro ato | Não | Proibido |
| Mover Work URI para outro domínio (e.g. de `eli.gov.pt` para `data.dre.pt`) | Sim, uma vez | HTTP 301 permanente; mapeamento publicado |
| Adicionar novas Expressions (consolidações) | Sim | Novos URIs; antigas mantêm-se válidas |
| Adicionar novas Manifestations (e.g. formato JSON antes inexistente) | Sim | Novos URIs |
| Regenerar Manifestation existente | Sim, com cuidado | HTTP 301 do antigo para o novo |
| Retirar Manifestation por defeito | Não | Sempre mantém pelo menos uma representação |

## Casos especiais

### Ato revogado

O Work URI mantém-se válido e resolve para:
- A última Expression em vigor antes da revogação;
- Ou uma página de "registo histórico" se a Expression foi também removida do
  uso ativo.

A metadata RDFa do ato indica `eli:date_no_longer_in_force`.

### Ato declarado inconstitucional (TC)

Igual a revogado. A acrescenta-se `eli:status = "unconstitutional"` (extensão
proposta; não é parte do ELI europeu).

### Retificação

Não cria novo Work — a retificação aplica-se ao Work existente. Cria uma nova
Expression (versão corrigida), tipicamente com data igual à da publicação da
declaração de retificação.

### Erro material em URI publicado

Se um URI foi publicado com erro (e.g. número trocado), o procedimento é:
1. Reservar o URI errado como **alias permanente** com HTTP 301 para o URI correcto.
2. Nunca reutilizar o URI errado para outro ato.
3. Publicar nota técnica explicando o ocorrido.

## Compromisso institucional

A persistência destes URIs é uma garantia da SGGOV em conjunto com a INCM,
operacionalizada por:

- Compromisso vinculativo no Caderno de Encargos de qualquer plataforma que
  sirva ELI-PT.
- Backup formal dos mapeamentos URI ↔ conteúdo em sistema redundante.
- Manutenção de registo público de mudanças de URI (`changelog-uris.md`,
  futuramente).

## Auditoria

A INCM (operador técnico) **DEVERIA** publicar, anualmente, relatório que
inclua:
- Número total de URIs ELI-PT activos.
- Número de redireccionamentos HTTP 301 em uso.
- Casos de mudança de Manifestation ocorridos.
- Eventuais incidentes de permanência (URIs que deixaram de resolver).

A SGGOV avalia o relatório no quadro da Comissão Técnica AKN-PT.
