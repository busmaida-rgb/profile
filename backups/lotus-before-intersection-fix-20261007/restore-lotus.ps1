$ErrorActionPreference = 'Stop'
$project = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$source = Join-Path $PSScriptRoot 'intro-lotus.js'
$target = Join-Path $project 'js/intro-lotus.js'
Copy-Item -LiteralPath $source -Destination $target -Force
if ((Get-FileHash -LiteralPath $source).Hash -ne (Get-FileHash -LiteralPath $target).Hash) {
    throw 'Restore verification failed.'
}
Write-Host 'Restored and verified js/intro-lotus.js. Reload the browser.'
