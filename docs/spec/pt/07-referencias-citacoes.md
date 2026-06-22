# 7. Referências e citações

## 7.1 Tipos de referência em AKN-PT

| Tipo | Elemento | Exemplo de `@href` |
|---|---|---|
| Interna ao mesmo documento | `<ref>` | `#art_3` |
| Interna a fragmento granular | `<ref>` | `#art_3__para_1__lit_a` |
| Externa a outro acto PT | `<ref>` | URI ELI-PT completo |
| Externa a directiva UE | `<ref>` | URI ELI europeu (`http://data.europa.eu/eli/dir/...`) |
| Range interno (de X a Y) | `<rref>` | `from="#art_3" upTo="#art_5"` |
| Citação informal sem identificador estruturado | `<authorialNote>` | n/a (texto livre) |

## 7.2 Referência interna a artigo

```xml
<p>... nos termos do <ref href="#art_3">artigo 3.º</ref> ...</p>
```

- O texto da referência é o que o leitor humano vê ("artigo 3.º").
- O `@href` é o eId do artigo alvo, prefixado por `#`.
- O Schematron valida que o eId alvo existe no documento.

## 7.3 Referência interna granular

```xml
<p>... conforme previsto na <ref href="#art_5__para_2__lit_b">alínea b) do n.º 2 do artigo 5.º</ref> ...</p>
```

Permite referenciar até à granularidade da alínea (ou subalínea, opcionalmente).
O texto humano segue a convenção legística PT: "alínea b) do n.º 2 do
artigo 5.º" (do mais específico para o mais geral). O `@href` segue a ordem
contrária no eId (do mais geral para o mais específico, separado por `__`).

## 7.4 Referência externa a outro acto português

```xml
<p>O <ref href="https://data.dre.pt/eli/dec-lei/120/2025/11/05/p/dre">Decreto-Lei n.º 120/2025, de 5 de novembro</ref>, estabeleceu o regime de ...</p>
```

A referência externa **deve** usar URI ELI-PT canónico (ver [cap. 8](08-identificadores.md)).
Atalhos para URIs legados do dre.pt **não são** aceitáveis nos `@href` de
`<ref>` em documentos novos.

Para referenciar um fragmento específico de outro acto:

```xml
<p>... nos termos do <ref href="https://data.dre.pt/eli/dec-lei/120/2025/11/05/p/dre#art_8__para_3">n.º 3 do artigo 8.º do Decreto-Lei n.º 120/2025</ref> ...</p>
```

Para referenciar uma versão consolidada concreta:

```xml
<p>... na redação dada pela <ref href="https://data.dre.pt/eli/dec-lei/120/2025/p/cons/20270115/pt">redacção em vigor a 15 de janeiro de 2027</ref> ...</p>
```

## 7.5 Referência a directiva ou regulamento UE

Para o caso típico de DL de transposição:

```xml
<recital eId="rec_3">
  <p>O presente decreto-lei transpõe a <ref href="http://data.europa.eu/eli/dir/2024/123/oj">Diretiva (UE) 2024/123 do Parlamento Europeu e do Conselho, de 15 de março de 2024</ref> ...</p>
</recital>
```

O Schematron, na fase publication, exige que diplomas com subtipo
`dec-lei-transposicao` tenham pelo menos uma `<ref>` cujo `@href` aponte para
o domínio `data.europa.eu/eli/dir/...`.

## 7.6 Range de referências

```xml
<p>... aplicam-se os <rref from="#art_3" upTo="#art_7">artigos 3.º a 7.º</rref> ...</p>
```

O `<rref>` indica início (`@from`) e fim (`@upTo`) do range. Schematron valida
que ambos os extremos resolvem para eIds existentes.

## 7.7 Citação com estrutura interna — `<quotedStructure>`

Em diplomas alteradores, quando se cita o texto novo que vai substituir o
texto antigo:

```xml
<article eId="art_2">
  <num>Artigo 2.º</num>
  <heading>Alteração ao Decreto-Lei n.º 22/2025, de 5 de novembro</heading>
  <paragraph eId="art_2__para_1">
    <intro><p>São alterados os artigos 3.º e 5.º do Decreto-Lei n.º 22/2025, de 5 de novembro, que passam a ter a seguinte redação:</p></intro>
    <quotedStructure>
      <article eId="quoted__art_3">
        <num>Artigo 3.º</num>
        <heading>...</heading>
        ...
      </article>
      <article eId="quoted__art_5">
        ...
      </article>
    </quotedStructure>
  </paragraph>
</article>
```

Notas:

- Os eIds internos da `<quotedStructure>` usam prefixo `quoted__` para evitar
  colisão com os eIds do diploma alterador.
- A `<quotedStructure>` pode conter `@startQuote` e `@endQuote` para indicar
  símbolos de citação visíveis no render.
- A consolidação automática (v0.2+) usa `<quotedStructure>` para reconstruir
  o texto consolidado do diploma alterado.

## 7.8 Citação informal — `<authorialNote>`

Para citações que não correspondem a um identificador estruturado (e.g.
referência a "jurisprudência constante" sem acórdão específico, ou comentário
do drafter):

```xml
<p>Como se sabe<authorialNote marker="1">Sobre o ponto, ver acórdão do Tribunal Constitucional n.º 123/2015.</authorialNote>, ...</p>
```

`<authorialNote>` rende como nota de pé de página ou nota lateral; o
`@marker` é o número visível.

## 7.9 Estilo PT vs. estilo `@href`

A convenção legística PT formata uma referência do mais específico para o
mais geral:

> alínea b) do n.º 2 do artigo 5.º do Decreto-Lei n.º 22/2026, de 15 de março

O `@href`, por contraste, é estruturado do mais geral para o mais específico:

> `https://data.dre.pt/eli/dec-lei/22/2026/03/15/p/dre#art_5__para_2__lit_b`

Esta dualidade é deliberada — o texto visível obedece à legística humana, o
identificador máquina obedece à navegabilidade técnica. Não há "tradução
automática" no XSD; o drafter (ou editor) constrói as duas formas em
paralelo.

## 7.10 Cardinalidade e obrigatoriedade

| Caso | Cardinalidade | Obrigatório? |
|---|---|---|
| Portaria deve referenciar lei habilitante | 1+ no preâmbulo | Sim (Schematron error) |
| Despacho normativo deve referenciar lei habilitante | 1+ no preâmbulo | Sim (Schematron error) |
| DL autorizado deve referenciar lei de autorização | 1+ no preâmbulo | Sim (Schematron error) |
| DL de transposição deve referenciar directiva UE | 1+ no preâmbulo | Sim (Schematron error) |
| DRR deve referenciar DLR/lei habilitante | 1+ no preâmbulo | Sim (Schematron error) |
| Res AR de cessação de vigência deve referenciar DL alvo | 1 no preâmbulo | Sim (Schematron error) |
| Qualquer `<ref href="#xxx">` interno | qualquer | Schematron error se o eId alvo não existe |
