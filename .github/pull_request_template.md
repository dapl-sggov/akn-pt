# Resumo

<!-- 1-3 frases: o que muda e porquê -->

## Tipo de mudança

- [ ] 🐛 Bug fix (não quebra compatibilidade)
- [ ] ✨ Nova funcionalidade (não quebra compatibilidade)
- [ ] 💥 Breaking change (afecta documentos existentes)
- [ ] 📚 Documentação apenas
- [ ] 🔧 CI / build / tooling

## Compatibilidade

Cf. [ADR-0005](docs/adr/0005-namespace-uri-versioning.md):

- [ ] PATCH — bug fix sem efeito em documentos existentes
- [ ] MINOR — adições opcionais; documentos existentes continuam válidos
- [ ] MAJOR — quebra; requer migração

## Checklist

- [ ] Os testes existentes passam (`schema/`, `corpus/`, `validator/`, `editor/smoke-test.js`)
- [ ] Adicionei testes para mudanças com impacto técnico
- [ ] Actualizei o `CHANGELOG.md` (secção `[Unreleased]`)
- [ ] Actualizei a documentação relevante (`docs/spec/` ou READMEs)
- [ ] Se aplicável: adicionei entrada em `decisions-log.md`
- [ ] Se mudança normativa: criei/actualizei a ADR relevante

## Issues relacionadas

<!-- Closes #N, Refs #N -->
