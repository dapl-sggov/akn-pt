# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| v0.1.x  | ✓ Pré-release com suporte activo |
| < v0.1  | ✗ Drafts internos, não suportados |

## Reportar uma vulnerabilidade

Para reportar uma vulnerabilidade **não use** issues públicas — use um dos
canais privados abaixo:

### Canal preferido

[GitHub Security Advisories](https://github.com/dapl-sggov/akn-pt/security/advisories/new)
— permite divulgação coordenada e tracking interno.

### Canal alternativo

Email: **bernardomvidal@gmail.com** (DAPL/SGGOV) com o subject prefix
`[AKN-PT SECURITY]`.

## O que esperar

- **Confirmação** de recepção em 5 dias úteis
- **Avaliação inicial** em 15 dias úteis com classificação (crítica / alta / média / baixa)
- **Patch + advisory público** assim que possível, coordenado com o reporter
- Crédito ao reporter no advisory (a menos que prefira anonimato)

## Âmbito

São **dentro** do âmbito de segurança:

- Vulnerabilidades no validador Python (`validator/`) — execução de código,
  injection, denial-of-service via XML malicioso
- XXE ou outras injecções XML que escapem ao parser configurado
- Vulnerabilidades no editor web (XSS via input do utilizador, etc.)
- Path traversal ou outras issues no CLI do validador
- Vulnerabilidades em dependências críticas (`lxml`, `mammoth.js`)

São **fora** do âmbito:

- Bugs de validação que sejam falsos positivos / negativos
  (use [issues normais](https://github.com/dapl-sggov/akn-pt/issues/new))
- Decisões de design intencionais documentadas (ver `decisions-log.md` e ADRs)
- Vulnerabilidades em ambientes hostis aos quais o utilizador exponha
  voluntariamente o editor (e.g. partilha de URL com doc confidencial)

## Considerações específicas do AKN-PT

### Editor web — assistente IA

A chave da API Anthropic configurada via UI fica **apenas** no `localStorage`
do browser do utilizador. Os pedidos vão directamente do browser para a API
Anthropic — **não há servidor intermédio**. Isto implica:

- ⚠ **Não use o assistente IA com diplomas confidenciais** sem autorização
  institucional (DAPL/SGGOV)
- A chave **nunca** é enviada para este projecto, GitHub, ou Cloudflare
- Para uso em produção pela DAPL, planeia-se um *gateway* institucional com
  SSO governamental — ver [issue](https://github.com/dapl-sggov/akn-pt/issues)

### Editor web — partilha por URL

A funcionalidade "Partilhar por URL" codifica o documento inteiro num
fragmento de URL (`#share=...`) com compressão gzip. **Quem tiver o link
vê o documento.** Não use esta funcionalidade para diplomas confidenciais.

### Validador — parsing de XML não confiável

O validador desactiva entidades externas (`resolve_entities=False`,
`no_network=True`) por defeito. Ainda assim, **não exponha o validador
como serviço público** sem rate-limiting e timeouts adequados a XML bombs.
