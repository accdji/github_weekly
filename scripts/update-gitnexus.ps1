param(
    [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$GitNexusRoot = "L:\Tcode\gitnexus"
)

$gitNexusCli = Join-Path $GitNexusRoot "dist\cli\index.js"

if (-not (Test-Path $gitNexusCli)) {
    Write-Error "GitNexus CLI not found: $gitNexusCli"
    exit 1
}

if (-not (Test-Path $RepoPath)) {
    Write-Error "Repository path not found: $RepoPath"
    exit 1
}

Write-Host "Refreshing GitNexus index for: $RepoPath"

Push-Location $GitNexusRoot
try {
    & node .\dist\cli\index.js analyze $RepoPath
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
