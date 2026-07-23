#!/usr/bin/env pwsh
# =============================================================================
# Backup do histórico do repositório AKN-PT.
#
# CONTEXTO (24/07/2026) — porque é que este script mudou:
#   O repositório passou a viver dentro da OneDrive, pelo que os FICHEIROS já
#   são sincronizados para a nuvem. O espelho por robocopy deixou de fazer
#   sentido e, pior, tornou-se perigoso: o destino que estava fixo no código
#   ficou a apontar para dentro do próprio repositório, o que faria um
#   "robocopy /MIR" do repo para uma subpasta de si mesmo.
#
# O QUE FAZ AGORA:
#   Grava o histórico git completo (todas as referências) num único ficheiro
#   — um bundle — FORA do repositório, e verifica-o. É o que a sincronização
#   de ficheiros da OneDrive não garante: recuperação com história.
#
# USO:
#   pwsh tools/backup-historico-git.ps1
#   pwsh tools/backup-historico-git.ps1 -Destino "D:\backups\aknpt"
#
# RECUPERAÇÃO:
#   git clone "akn-pt-history.bundle" <pasta-destino>
# =============================================================================
param(
    [string]$Destino
)
$ErrorActionPreference = 'Stop'

# Raiz do repositório = pasta-mãe de tools/ (sem caminhos absolutos fixos).
$repo = (Resolve-Path (Split-Path -Parent $PSScriptRoot)).Path

# Destino por omissão: pasta irmã do repositório — fora dele, mas no mesmo
# ramo da árvore (se o repo estiver na OneDrive, o backup também fica).
if (-not $Destino) {
    $Destino = Join-Path (Split-Path -Parent $repo) 'AKNPT-backup'
}

# Guarda de segurança: o destino NUNCA pode ficar dentro do repositório.
# Foi exactamente este erro que tornou a versão anterior perigosa.
$repoFull = $repo.TrimEnd('\') + '\'
$destFull = ([System.IO.Path]::GetFullPath($Destino)).TrimEnd('\') + '\'
if ($destFull.StartsWith($repoFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Destino inválido: '$Destino' está dentro do repositório ($repo). Escolha uma pasta fora."
}

New-Item -ItemType Directory -Force -Path $Destino | Out-Null
$bundle = Join-Path $Destino 'akn-pt-history.bundle'

git -C $repo bundle create $bundle --all 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "git bundle falhou (código $LASTEXITCODE)" }

git -C $repo bundle verify $bundle 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "o bundle foi criado mas não passou na verificação" }

$head  = (git -C $repo rev-parse --short HEAD).Trim()
$ramo  = (git -C $repo rev-parse --abbrev-ref HEAD).Trim()
$stamp = (Get-Date).ToString('yyyy-MM-dd HH:mm')

@"
BACKUP DO HISTÓRICO — repositório AKN-PT

Este ficheiro guarda o histórico git completo do AKN-PT num único bundle,
verificado no momento da gravação.

Repositório de origem : $repo
Última gravação       : $stamp
Ramo / commit         : $ramo / $head

Recuperar:
    git clone "akn-pt-history.bundle" <pasta-destino>

Nota: os ficheiros de trabalho não são copiados para aqui — o repositório está
dentro da OneDrive e já é sincronizado para a nuvem. O que a OneDrive não
garante é a história do git; é isso que este bundle protege.
"@ | Set-Content -Path (Join-Path $Destino '_LEIA-ME-backup.txt') -Encoding UTF8

$kb = [math]::Round((Get-Item $bundle).Length / 1KB)
Write-Output "Histórico guardado e verificado ($kb KB, $ramo/$head)"
Write-Output "  -> $bundle"
