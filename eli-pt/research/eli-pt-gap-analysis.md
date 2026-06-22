# Análise de lacunas ELI-PT vs prática internacional

**Para:** DAPL/SGGOV — preparação da reunião INCM de 2026-07-01
**Objeto:** Confronto crítico da proposta ELI-PT v0.1.0 com a prática
internacional dominante e com o estado real de Portugal no registo ELI.

> Documento-companheiro do [dossier de conhecimento](eli-international-dossier.md)
> e do [kit de reunião](../meeting-incm-2026-07-01.md).

## Nota de enquadramento (não saltar)

Há um facto que reorganiza toda esta análise e que a proposta v0.1.0
subestima: **Portugal já é implementador ELI registado no EUR-Lex desde
2016/2017** (Pilar I em 19-12-2016; Pilar II em 27-07-2017, ontologia v1.1),
operado pela INCM no domínio `data.dre.pt`, com template em produção do tipo
`http://data.dre.pt/eli/dec-lei/83/2016/12/16/p/dre/pt/html`. **Não estamos a
criar um ELI-PT do zero — estamos a propor reformar/realinhar um ELI-PT que já
existe e que, segundo a verificação direta de 2026-06-22, regrediu**: o portal
OutSystems não serve RDFa/JSON-LD e os URIs `/eli/` legados redirecionam para
`/dr/home` em vez de resolverem o ato.

Isto muda a postura negocial: a DAPL não chega como inovadora a propor algo
novo, chega a apontar uma **dívida técnica e um compromisso público
incumprido** da INCM, e a oferecer uma arquitetura para o saldar. É uma
posição mais forte, mas também mais sensível politicamente.

## Tabela de análise

| Dimensão | Nossa proposta (v0.1.0) | Prática internacional dominante | Veredicto | Ação |
|---|---|---|---|---|
| **Estrutura do URI** | `…/eli/{jur}/{type}/{year}/{number}/{lang}[…]` — ano+número, **sem data completa** | Minimalista ano+número (UE) vs. parlante por data (FR/LU/IT/ES). **O ELI-PT EM PRODUÇÃO usa data completa**: `dec-lei/83/2016/12/16/…` | **Divergente (interno) — crítico** | Divergimos do **próprio template da INCM**. Esclarecimento decisivo: a citação legística completa em PT inclui sempre a data (ex. 'Decreto-Lei n.º 43-B/2024, de 2 de julho'), pelo que o template data.dre.pt (data completa) É construível a partir de uma citação completa — basta o parser extrair '..., de {dia} de {mês} [de {ano}]'. A construtibilidade NÃO é, portanto, argumento a favor de ano+número. À forma ano+número restam pontos menores: jurisdição explícita no URI e alinhamento estético com o padrão ano+número da UE. Análise franca: a forma da INCM não é errada — é a tradição legística PT. Recomenda-se adotar o template data.dre.pt (b) por continuidade do legado e alinhamento FR/LU/IT + lei 74/98. |
| **Domínio** | Placeholder `eli.gov.pt`; recomendação `data.dre.pt` (ADR-0009) | UE separa domínio persistente (307→portal). ES/FR/IE/LU usam domínio do boletim. **PT já tem `data.dre.pt` registado** | **Lacuna de decisão, direção boa** | `data.dre.pt` já existe e está registado — adotá-lo evita 2.º namespace. `eli.gov.pt` só se houver vontade de desacoplar do operador (cf. Polónia `eli.gov.pl`). **Decisão é da INCM.** |
| **Point-in-time** | ISO 8601 `YYYY-MM-DD`; omitido p/ originária | LU `/consolide/{AAAAMMDD}`, IT `/CONSOLIDATED/{data}`, UE substitui `/oj`. Sem versão → consolidação mais recente | **Alinhado — validar** | Boa escolha. **Acrescentar regra de redireccionamento URI-sem-PIT → consolidação corrente** (padrão LU/IT), que a proposta não explicita. |
| **Fragmentos** | `#{fragment}` = eId AKN-PT; granularidade até alínea **obrigatória** | AKN4EU/LEOS: eId hierárquico anexado via `#`. FR desce a `/article_N` no path; IE `/section/N` | **Alinhado — o nosso ponto mais forte** | Composição eId→fragmento é exactamente o AKN4EU. **Decidir** se queremos fragmentos dereferenciáveis server-side (FR/IE: nível no path) ou só identificadores (`#`). |
| **Metadados** | 9 obrigatórias mapeadas de AKN-PT | Núcleo ELI: 6 obrigatórias; `is_about` (EuroVoc) recomendada | **Alinhado e acima do mínimo** | Cobrimos o núcleo e acrescentamos. **Mas não fixamos a versão da ontologia** — ancorar em **v1.5 (2024-03-21)**. Falta decidir serialização (ver lacuna 2). |
| **Multilinguismo** | `{language}` no Work→Expression; default `pt` | UE serve `por` (3 letras ISO 639-2/T); legado INCM usa `pt`; FRBR Expression = língua | **Lacuna menor** | Fixar a convenção: `pt` (2 letras, como legado INCM) vs. `por` (3 letras, UE). Impacto baixo p/ PT monolingue, mas condiciona interoperabilidade UE. |
| **Tipos de ato** | 9 tipos com subtipos | Cada país declara tabela controlada. PT legado usa `dec-lei`, `decpresrep`, `diario`… | **Alinhado, verificar cobertura** | **Reconciliar com a tabela real da INCM.** Faltam-nos: decreto presidencial (`decpresrep`), decreto regulamentar, declaração de retificação, aviso, deliberação. |
| **Governação / operador** | Implícito: DAPL norma, INCM opera (ADR-001) | UE: OP opera + IMFC normaliza. **ES: análogo ao nosso** — Grupo de Trabajo (norma) ≠ AEBOE (operação) | **Lacuna crítica de articulação** | A INCM tem **competência legal exclusiva** (DL 235/2015) e é coordenador nacional ELI de facto. A nossa proposta não pode "declarar" um template — só a INCM o regista. Invocar o modelo ES. |
| **Permanência** | Work/Expression permanentes; Manifestation regenerável c/ 301; 100 anos | W3C "Cool URIs don't change"; persistência via camada de resolução estável | **Alinhado — validar** | Conforme. **Mas depende inteiramente da INCM** (camada de resolução por 100 anos). Transformar em requisito contratual/regulamentar. |

## Síntese por categoria

**Onde estamos BONS (validar e defender):**
- Point-in-time por data ISO — padrão canónico LU/IT.
- Composição eId AKN-PT → fragmento ELI — mecanismo AKN4EU/LEOS; o nosso ativo
  mais defensável tecnicamente.
- Conjunto de metadados acima do mínimo obrigatório.
- Modelo FRBR Work/Expression/Manifestation — alinhamento natural AKN↔ELI.
- Princípios de permanência conformes ao W3C.

**Onde DIVERGIMOS da norma (justificar ou corrigir):**
- **URI ano+número vs. data completa** — divergimos do template INCM em
  produção e da escola parlante. Escolher conscientemente **a favor da data
  completa** (continuidade + lei formulário). Nota decisiva: a citação
  legística completa ('..., de {dia} de {mês} de {ano}') fornece dia e mês,
  pelo que o template data.dre.pt É construível a partir dela — a
  construtibilidade deixa de ser argumento pró-ano+número. A forma da INCM não
  é errada: é a tradição legística PT.
- **Fragmento só em `#` vs. nível no path** — divergimos de FR/IE.
- **Código de língua `pt` vs. `por`** — divergência menor face à UE.

**LACUNAS (o que falta na proposta):**
1. **Versão da ontologia não fixada** — ancorar em ELI v1.5 (2024).
2. **Serialização não decidida** — RDFa (dominante, mais barato) vs. JSON-LD.
   Crítico porque o portal OutSystems **não serve nenhuma** (problema de
   implementação da INCM).
3. **Pilar IV (feeds Atom/sitemap)** ausente — necessário para harvesting
   EUR-Lex/DCAT-AP.
4. **Articulação ELI-I / ELI-DL** — ignoramos as extensões 2024 para impactos
   (consolidação estruturada) e draft legislation (tramitação), que mapeiam
   directamente para a pegada legislativa PT (Lei 5-A/2026).
5. **Estatuto jurídico do AKN-PT face à edição autêntica** — a Lei 74/98 (art.
   1.º n.º 5) dá fé plena à edição eletrónica da INCM; o AKN-PT será
   representação derivada, não fonte autêntica, salvo alteração legislativa.
6. **DCAT-AP / HVD** — sob o regime High Value Datasets, datasets devem
   fornecer ELI em `applicableLegislation`. Oportunidade não capturada.

**Aviso final honesto:** a parte mais difícil desta proposta não é técnica —
está quase toda alinhada com a norma. É de **propriedade e governação**.
Tecnicamente, podemos desenhar o ELI-PT perfeito; mas quem o regista no
EUR-Lex, quem opera a resolução e quem garante os 100 anos é a INCM, que detém
o monopólio legal. **A reunião decide-se na governação, não no template.**
