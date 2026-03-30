param(
  [Parameter(Mandatory=$true)][string]$ApiKey
)

# Updates the API_KEY in .env (creates .env if missing)
$envPath = Join-Path -Path (Get-Location) -ChildPath '.env'
if (-Not (Test-Path $envPath)) {
  "API_KEY=$ApiKey`nAPI_BASE_URL=https://api.openai.com/v1`nPORT=3000" | Out-File -FilePath $envPath -Encoding utf8
  Write-Host "Created .env and set API_KEY"
  exit 0
}

$content = Get-Content -Path $envPath -Raw
if ($content -match '(?m)^API_KEY=.*$') {
  $content = [regex]::Replace($content, '(?m)^API_KEY=.*$', "API_KEY=$ApiKey")
} else {
  $content = "API_KEY=$ApiKey`n" + $content
}
Set-Content -Path $envPath -Value $content -Encoding utf8
Write-Host "Updated .env with new API_KEY (not committed)."