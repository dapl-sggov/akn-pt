# Casos especiais

Catálogo de construtos legísticos portugueses que exigem marcação não-óbvia
ou que cortam transversalmente vários tipos de ato.

## Artigo X.º-A — inserção entre artigos

A prática PT, ao inserir um artigo entre o 5.º e o 6.º de um diploma, designa-o
"Artigo 5.º-A". Pode haver cadeia: 5.º-A, 5.º-B, 5.º-C.

**Marcação:**
```xml
<article eId="art_5_a">
  <num>Artigo 5.º-A</num>
  <heading>Disposição inserida</heading>
  ...
</article>
```

- eId: minúscula + underscore (`art_5_a`).
- Texto do `<num>`: mantém o "Artigo 5.º-A" exacto.
- Ordem em `<body>`: imediatamente após `art_5`, antes de `art_6`.

## Republicação técnica

Diploma alterador que substitui integralmente o texto do diploma alterado.
Modelo PT: a Lei n.º 4/2018 estabelece a convenção (republicação como anexo).

**Marcação:**
- O diploma alterador é um `<act>` normal.
- A republicação aparece como `<attachment>` com `<heading>Anexo (a que se refere o n.º X do artigo Y.º)</heading>`.
- Dentro do `<attachment>`, abre-se um `<mainBody>` que contém a estrutura completa do diploma republicado, com **os mesmos eIds que o diploma original mas prefixados** (`rep__art_1`, `rep__art_2`, …) para evitar colisão.
- Header da republicação: `<heading>` interna com "Decreto-Lei n.º X/YYYY (Republicação)".
- O diploma republicado mantém o seu próprio bloco `<meta>` simplificado em `<attachment>/<meta>`.

## Decreto-Lei autorizado

DL emitido ao abrigo de lei de autorização legislativa (alínea b) do n.º 1 do art. 198.º CRP).

**Marcação:**
- `<FRBRsubtype value="dec-lei-autorizado">` no `<FRBRWork>`.
- Preâmbulo cita a lei de autorização: `<ref href="https://eli.gov.pt/lei/2026/12/pt">Lei n.º 12/2026, de 15 de fevereiro</ref>` dentro de um `<recital>`.
- Fórmula promulgatória usa a variante "ao abrigo da autorização legislativa concedida pela…" (ver §Fórmulas).

## Decreto-Lei parlamentar

DL aprovado em CM nos termos da alínea c) do n.º 1 do art. 198.º (matéria reservada à AR
mas delegada). Raro.

**Marcação:**
- `<FRBRsubtype value="dec-lei-parlamentar">`.
- Fórmula promulgatória específica.

## Decreto-Lei de transposição

DL que transpõe directiva da UE.

**Marcação:**
- `<FRBRsubtype value="dec-lei-transposicao">`.
- Preâmbulo cita a directiva: `<ref href="http://data.europa.eu/eli/dir/2024/123/oj">Diretiva (UE) 2024/123 do Parlamento Europeu e do Conselho</ref>`.
- Inclui menção obrigatória à transposição num dos primeiros artigos.

## Retificação (Declaração de Retificação)

Acto que corrige erro material em diploma publicado. Tipo próprio.

**Marcação na v0.1.0:**
- Não é tipo independente coberto pelo XSD; é mecanismo de alteração.
- Marca-se como uma instância de `<analysis>/<activeModifications>` no diploma original quando a consolidação for produzida.
- Texto da declaração de retificação fica como `<act name="declaracao-retificacao">` em corpus separado (v0.2+).

## Alteração de diploma anterior

Diploma alterador refere o diploma alterado.

**Marcação:**
- `<FRBRWork>` do alterador inclui `<FRBRsubtype value="dec-lei-alterador">` (ou tipo análogo).
- Artigo de alteração tem estrutura interna específica:

```xml
<article eId="art_2">
  <num>Artigo 2.º</num>
  <heading>Alteração ao Decreto-Lei n.º 22/2025, de 5 de novembro</heading>
  <paragraph eId="art_2__para_1">
    <intro><p>São alterados os artigos 3.º, 5.º e 7.º do Decreto-Lei n.º 22/2025, de 5 de novembro, que passam a ter a seguinte redação:</p></intro>
    <quotedStructure>
      <article eId="quoted__art_3">
        <num>Artigo 3.º</num>
        <heading>...</heading>
        ...
      </article>
    </quotedStructure>
  </paragraph>
</article>
```

`<quotedStructure>` é o elemento AKN canónico para texto citado que mantém
estrutura interna. O eId interno usa prefixo `quoted__` para evitar colisão.

## Renumeração pós-alteração

Quando um diploma alterador renumera artigos do diploma alterado.

**Marcação na v0.1.0:**
- O artigo de alteração explicita a renumeração em texto natural.
- A representação estruturada da renumeração entra em `<analysis>/<activeModifications>/<renumbering>` (v0.2+, na consolidação automática).
- Os eIds do texto consolidado seguem a nova numeração; o histórico mantém-se em `<temporalGroup>` (v0.2+).

## Vacatio legis

Período entre publicação e entrada em vigor.

**Marcação:**
- Artigo final do diploma especifica a vigência (texto natural).
- `<lifecycle>` regista `eventRef type="generation" refersTo="#entry-into-force" date="..."` com a data calculada.
- Schematron compara as duas e avisa em caso de divergência.

## Fórmulas — catálogo de variantes

Schematron valida que a fórmula de cada tipo pertence ao catálogo abaixo.
Pequenas variações de pontuação são toleradas; variação substancial é warning.

### Decreto-Lei

| Subtipo | Fórmula |
|---|---|
| `dec-lei-ordinario` | "Assim: Nos termos da alínea a) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:" |
| `dec-lei-autorizado` | "Assim: No uso da autorização legislativa concedida pela Lei n.º X/YYYY, de DD de MM, e nos termos da alínea b) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:" |
| `dec-lei-parlamentar` | "Assim: Nos termos das alíneas a) e c) do n.º 1 do artigo 198.º da Constituição, o Governo decreta o seguinte:" |
| `dec-lei-transposicao` | (Como ordinário, com menção à directiva transposta no preâmbulo) |

### Lei (AR)

- "A Assembleia da República decreta, nos termos da alínea c) do artigo 161.º da Constituição, o seguinte:"

### Decreto da AR

- "A Assembleia da República resolve, nos termos do n.º 5 do artigo 166.º da Constituição, …"

### Resolução da AR

- "A Assembleia da República resolve, nos termos do n.º 5 do artigo 166.º da Constituição, …"

### Portaria

- "Manda o Governo, pelo Ministro de X, ao abrigo do disposto no [base legal habilitante], o seguinte:"
- Variante para portarias conjuntas: "Manda o Governo, pelos Ministros de X e Y, …"

### Resolução do Conselho de Ministros

- (Sem fórmula promulgatória padrão; o resolutivo começa directamente.)

### Despacho normativo

- "Manda o Governo, pelo Ministro de X, ao abrigo do disposto no [base legal habilitante], o seguinte:"

### Decreto Legislativo Regional

- "A Assembleia Legislativa da Região Autónoma dos Açores [/da Madeira] decreta, nos termos da alínea a) do n.º 1 do artigo 227.º e do n.º 1 do artigo 232.º da Constituição da República Portuguesa, e da alínea c) do n.º 1 do artigo 31.º do Estatuto Político-Administrativo da Região Autónoma dos Açores [/da Madeira], o seguinte:"
