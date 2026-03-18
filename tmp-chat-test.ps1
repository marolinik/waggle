$body = @{ message = 'Where are we? What matters here now?'; workspace = 'marketing'; session = 'sanity-slice1' } | ConvertTo-Json
try {
  $res = Invoke-WebRequest -Method Post -Uri 'http://127.0.0.1:3333/api/chat' -ContentType 'application/json' -Body $body
  $res.Content
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
}
