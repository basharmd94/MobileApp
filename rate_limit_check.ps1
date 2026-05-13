# test_rate_limit.ps1
param(
    [string]$Url = "http://localhost:8500/api/v1/health",
    [int]$TotalRequests = 150,
    [string]$Method = "GET",
    [string]$Body = $null
)

Write-Host "🚀 Rate Limit Testing Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "URL: $Url" -ForegroundColor Yellow
Write-Host "Total Requests: $TotalRequests" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$rateLimitCount = 0
$errorCount = 0

for ($i = 1; $i -le $TotalRequests; $i++) {
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ErrorAction = 'Stop'
        }
        
        if ($Body -and $Method -in @("POST", "PUT", "PATCH")) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        $successCount++
        Write-Host "Request $i : ✅ 200 OK" -ForegroundColor Green
        
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            $rateLimitCount++
            Write-Host "Request $i : 🚫 429 Rate Limited" -ForegroundColor Yellow
            
            # Show retry-after header if available
            $retryAfter = $_.Exception.Response.Headers["Retry-After"]
            if ($retryAfter) {
                Write-Host "         Retry-After: $retryAfter seconds" -ForegroundColor Yellow
            }
        } else {
            $errorCount++
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "Request $i : ❌ $statusCode Error" -ForegroundColor Red
        }
    }
    
    # Optional: Add small delay to see progress
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "📊 RESULTS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "✅ Successful: $successCount" -ForegroundColor Green
Write-Host "🚫 Rate Limited: $rateLimitCount" -ForegroundColor Yellow
Write-Host "❌ Errors: $errorCount" -ForegroundColor Red
Write-Host "📈 Success Rate: $([math]::Round(($successCount/$TotalRequests)*100, 2))%" -ForegroundColor White