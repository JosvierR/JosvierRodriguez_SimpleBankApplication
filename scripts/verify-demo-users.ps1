$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$file = Join-Path $root 'docs\demo-credentials.txt'
$base = if ($env:DEMO_API_BASE) { $env:DEMO_API_BASE } else { 'http://localhost:8080' }
$identities = @()
foreach ($line in Get-Content $file) {
  if ($line -notmatch '\|' -or $line -match '^(=|ROLE)') { continue }
  $parts = $line.Split('|') | ForEach-Object { $_.Trim() }
  if ($parts.Count -ne 6) { continue }
  $identities += [pscustomobject]@{ Role = $parts[0]; Username = $parts[2]; Password = $parts[4] }
}
if ($identities.Count -ne 20) { Write-Error "Expected 20 identities, found $($identities.Count)"; exit 1 }
$ok = 0
$counts = @{}
foreach ($identity in $identities) {
  $body = @{ username = $identity.Username; password = $identity.Password } | ConvertTo-Json
  $response = Invoke-WebRequest -Uri "$base/api/auth/login" -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing
  if ($response.StatusCode -ne 200) { Write-Error "Login failed for $($identity.Username)"; exit 1 }
  $payload = $response.Content | ConvertFrom-Json
  $verify = Invoke-WebRequest -Uri "$base/api/auth/verify" -Headers @{ Authorization = "Bearer $($payload.token)" } -UseBasicParsing
  $session = $verify.Content | ConvertFrom-Json
  if ($session.username -ne $identity.Username -or $session.primaryRole -ne $identity.Role) {
    Write-Error "Role mismatch for $($identity.Username)"
    exit 1
  }
  $ok++
  if (-not $counts.ContainsKey($identity.Role)) { $counts[$identity.Role] = 0 }
  $counts[$identity.Role]++
}
Write-Output "$ok/20 authenticated"
foreach ($role in @('ADMIN','MANAGER','TELLER','AUDITOR','CUSTOMER')) { Write-Output "$role $($counts[$role])" }
if ($ok -ne 20) { exit 1 }
