$tests = @(
  @{ command='/catchup'; workspaceId='marketing'; label='catchup' },
  @{ command='/memory decision'; workspaceId='marketing'; label='memory' },
  @{ command='/now'; workspaceId='marketing'; label='now' }
)

foreach ($t in $tests) {
  Write-Host "=== $($t.label) ==="
  $body = @{ command = $t.command; workspaceId = $t.workspaceId } | ConvertTo-Json
  try {
    $res = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3333/api/commands/execute' -ContentType 'application/json' -Body $body
    $res | ConvertTo-Json -Depth 8
  } catch {
    Write-Host "ERROR: $($_.Exception.Message)"
  }
  Write-Host ""
}
