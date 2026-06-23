#!/usr/bin/env pwsh
# =============================================================================
# Sincroniza o repositório AKN-PT para o espelho de backup na OneDrive.
#
#   Fonte de verdade : C:\Users\jose.vidal\Documents\AKNPT   (repo git)
#   Espelho (backup) : OneDrive\...\Documentos\AKNPT\repo (espelho atual)
#
# Correr APÓS CADA ALTERAÇÃO (commit/merge) para manter o backup atual:
#   pwsh tools/sync-onedrive-mirror.ps1
#
# O espelho é só-leitura na prática (não editar lá; é regenerado por robocopy
# /MIR). O ficheiro akn-pt-history.bundle guarda o histórico git completo para
# recuperação de desastre:  git clone "akn-pt-history.bundle" <pasta>
# =============================================================================
$ErrorActionPreference = 'Stop'

# Raiz do repo = pasta-pai de tools/
$repo   = Split-Path -Parent $PSScriptRoot
$mirror = 'C:\Users\jose.vidal\OneDrive - SGGoverno\Documentos\AKNPT\repo (espelho atual)'

New-Item -ItemType Directory -Force -Path $mirror | Out-Null

# Espelho dos ficheiros: exclui .git, dependências e caches (regeneráveis);
# preserva o bundle e o LEIA-ME (não estão no repo, senão /MIR apagava-os).
$exDirs = @('.git', 'node_modules', '.pytest_cache', '.playwright-mcp', '.claude', '__pycache__', '.venv', '.mypy_cache')
$exFiles = @('*.pyc', 'akn-pt-history.bundle', '_LEIA-ME-backup.txt')
robocopy $repo $mirror /MIR /XD @exDirs /XF @exFiles /NFL /NDL /NJH /NP /R:1 /W:1 | Out-Null
$rc = $LASTEXITCODE
if ($rc -ge 8) { throw "robocopy falhou (codigo $rc)" }   # 0-7 = sucesso

# Histórico git completo num único ficheiro (recuperação de desastre).
git -C $repo bundle create (Join-Path $mirror 'akn-pt-history.bundle') --all 2>&1 | Out-Null

# Carimbo de sincronização.
$head  = (git -C $repo rev-parse --short HEAD).Trim()
$stamp = (Get-Date).ToString('yyyy-MM-dd HH:mm')
@"
ESPELHO DE BACKUP — repositório AKN-PT
Não editar aqui: a fonte de verdade é o repo git em $repo
Este espelho é regenerado por tools/sync-onedrive-mirror.ps1 (robocopy /MIR).

Última sincronização : $stamp
Commit (HEAD)        : $head
Recuperar histórico  : git clone "akn-pt-history.bundle" <pasta-destino>
"@ | Set-Content -Path (Join-Path $mirror '_LEIA-ME-backup.txt') -Encoding UTF8

Write-Output "Espelho sincronizado (robocopy rc=$rc, HEAD=$head)"
Write-Output "  -> $mirror"
