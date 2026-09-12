$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectDirectory

if (-not (Test-Path -LiteralPath (Join-Path $projectDirectory 'node_modules'))) {
    throw 'Dependências ausentes. Execute npm ci com internet antes da apresentação.'
}

$addresses = @(Get-NetIPAddress -AddressFamily IPv4 -AddressState Preferred -ErrorAction SilentlyContinue |
    Where-Object {
        $_.IPAddress -notlike '127.*' -and
        $_.IPAddress -notlike '169.254.*' -and
        ($_.IPAddress -like '10.*' -or $_.IPAddress -like '192.168.*' -or $_.IPAddress -match '^172\.(1[6-9]|2[0-9]|3[01])\.')
    } |
    Select-Object -ExpandProperty IPAddress -Unique)

Write-Host ''
Write-Host 'Irrint - contingência local' -ForegroundColor Green
Write-Host 'Mantenha esta janela aberta durante a apresentação.'
Write-Host 'Aplicativo no notebook: http://127.0.0.1:5173'
if ($addresses.Count -gt 0) {
    Write-Host 'No APK, abra "Conexão local de contingência" e use um destes endereços:'
    foreach ($address in $addresses) {
        Write-Host "  http://${address}:8787" -ForegroundColor Cyan
    }
} else {
    Write-Warning 'Nenhum IPv4 privado foi encontrado. Ative o Wi-Fi ou o ponto de acesso do notebook.'
}
Write-Host ''
& npm run demo:start:lan
