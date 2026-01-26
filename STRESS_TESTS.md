# 🧪 Stress Test Suite - Portfolio Application

## Overview
Comprehensive stress testing to validate security fixes and system reliability.

---

## Test 1: Concurrent Updates (Race Condition)

### Objective
Verify that concurrent project updates don't cause data corruption.

### Test Script
```powershell
# stress-test-concurrent.ps1
$projectId = "test-project-$(Get-Date -Format 'yyyyMMddHHmmss')"
$url = "http://localhost:3000/api/projects"

# Create test project first
$createBody = @{
    title = "Test Project"
    client = "Test Client"
    year = 2024
    tags = @("test")
    description = "Test Description"
    cover = "/test.jpg"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Cookie" = "admin_token=YOUR_TOKEN"
    "X-CSRF-Token" = "YOUR_CSRF_TOKEN"
}

# Run 100 concurrent updates
$jobs = 1..100 | ForEach-Object {
    Start-Job -ScriptBlock {
        param($url, $id, $i, $headers)
        $updateBody = @{
            id = $id
            title = "Update $i"
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$url/$id" -Method PUT -Body $updateBody -Headers $headers
    } -ArgumentList $url, $projectId, $_, $headers
}

# Wait for all jobs
$jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

Write-Host "✅ Concurrent update test completed"
```

### Expected Result
- All requests succeed or fail gracefully
- Final state is consistent (one of the updates wins)
- No data corruption
- Logs show retry attempts and conflict resolution

---

## Test 2: Input Validation

### Objective
Verify Zod schema validation prevents malformed data.

### Test Cases

#### Test 2.1: Oversized Fields
```powershell
$invalidBody = @{
    title = "A" * 10000  # Max 200
    client = "Test"
    year = 2024
    tags = @("test")
    description = "A" * 10000  # Max 5000
    cover = ""
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri $url -Method POST -Body $invalidBody -Headers $headers -ErrorAction SilentlyContinue

# Expected: 400 Bad Request with validation errors
```

#### Test 2.2: Invalid Types
```powershell
$invalidBody = @{
    title = "Test"
    client = "Test"
    year = "not-a-number"  # Should be number
    tags = @(@{nested = "object"})  # Should be string[]
    description = ""
    cover = ""
} | ConvertTo-Json

# Expected: 400 with type validation errors
```

#### Test 2.3: Nested Depth Limit
```powershell
$deepNested = @{
    level1 = @{
        level2 = @{
            level3 = @{
                level4 = @{
                    level5 = @{
                        level6 = "too deep"  # Max depth 5
                    }
                }
            }
        }
    }
}

# Expected: 400 with depth limit error
```

---

## Test 3: Rate Limiting

### Objective
Verify rate limiting prevents abuse.

### Test Script
```powershell
# Test global rate limit (100 req/15min)
$url = "http://localhost:3000/api/comments?slug=test"

1..150 | ForEach-Object {
    try {
        $response = Invoke-RestMethod -Uri $url -Method GET
        Write-Host "Request $_`: Success"
    } catch {
        Write-Host "Request $_`: Rate Limited (Expected after 100)"
    }
}
```

### Expected Result
- First 100 requests succeed
- Requests 101+ return 429 Too Many Requests
- Retry-After header present

---

## Test 4: Memory Leak Detection

### Objective
Verify cache size limits prevent memory exhaustion.

### Test Script
```powershell
# Monitor memory usage
$process = Get-Process -Name "node" | Where-Object {$_.MainWindowTitle -like "*next*"}
$initialMemory = $process.WorkingSet64 / 1MB

# Make 1000 requests
1..1000 | ForEach-Object {
    Invoke-RestMethod -Uri "http://localhost:3000/api/projects" -Method GET
    
    if ($_ % 100 -eq 0) {
        $currentMemory = (Get-Process -Id $process.Id).WorkingSet64 / 1MB
        Write-Host "After $_ requests: $currentMemory MB"
    }
}

$finalMemory = (Get-Process -Id $process.Id).WorkingSet64 / 1MB
$growth = $finalMemory - $initialMemory

Write-Host "Memory growth: $growth MB"
# Expected: < 50MB growth
```

---

## Test 5: Transaction Rollback

### Objective
Verify rollback prevents partial updates.

### Test Script
```powershell
# Create project with invalid media path
$invalidProject = @{
    title = "Test Rollback"
    client = "Test"
    year = 2024
    tags = @("test")
    cover = "/temp/non-existent-file.jpg"  # This will fail
    description = ""
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri $url -Method POST -Body $invalidProject -Headers $headers
} catch {
    Write-Host "Expected failure: $_"
}

# Verify no orphaned project record
$projects = Invoke-RestMethod -Uri $url -Method GET
$orphan = $projects.projects | Where-Object {$_.title -eq "Test Rollback"}

if ($orphan) {
    Write-Host "❌ FAIL: Orphaned project found"
} else {
    Write-Host "✅ PASS: No orphaned data"
}
```

---

## Test 6: CSRF Protection

### Objective
Verify CSRF middleware blocks unauthorized requests.

### Test Script
```powershell
# Attempt POST without CSRF token
$body = @{
    title = "Hacked"
    client = "Attacker"
    year = 2024
    tags = @("hack")
    description = ""
    cover = ""
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Cookie" = "admin_token=VALID_TOKEN"
    # Missing X-CSRF-Token header
}

try {
    Invoke-RestMethod -Uri $url -Method POST -Body $body -Headers $headers
    Write-Host "❌ FAIL: Request succeeded without CSRF token"
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ PASS: CSRF protection working"
    }
}
```

---

## Test 7: Error Recovery

### Objective
Verify graceful error handling and logging.

### Test Script
```powershell
# Simulate GitHub API failure (disconnect network temporarily)
# Or mock GitHub service to return errors

$body = @{
    title = "Test Error Recovery"
    client = "Test"
    year = 2024
    tags = @("test")
    description = ""
    cover = ""
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri $url -Method POST -Body $body -Headers $headers
} catch {
    Write-Host "Error occurred (expected): $($_.Exception.Message)"
}

# Check logs for proper error context
# Expected: Structured log with request ID, stack trace, context
```

---

## Test 8: XSS Protection

### Objective
Verify HTML sanitization prevents XSS.

### Test Script
```powershell
$xssPayload = @{
    slug = "test"
    comments = @(
        @{
            id = "test-1"
            text = "<script>alert('XSS')</script>"
            name = "<img src=x onerror=alert('XSS')>"
        }
    )
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/comments" -Method POST -Body $xssPayload -Headers $headers

# Verify response has escaped HTML
if ($response.comments[0].text -like "*&lt;script&gt;*") {
    Write-Host "✅ PASS: XSS payload sanitized"
} else {
    Write-Host "❌ FAIL: XSS payload not sanitized"
}
```

---

## Automated Test Runner

### Run All Tests
```powershell
# run-all-tests.ps1
Write-Host "🧪 Starting Stress Test Suite..."
Write-Host ""

# Test 1
Write-Host "Test 1: Concurrent Updates"
& .\stress-test-concurrent.ps1

# Test 2
Write-Host "`nTest 2: Input Validation"
& .\stress-test-validation.ps1

# Test 3
Write-Host "`nTest 3: Rate Limiting"
& .\stress-test-ratelimit.ps1

# Test 4
Write-Host "`nTest 4: Memory Leak"
& .\stress-test-memory.ps1

# Test 5
Write-Host "`nTest 5: Transaction Rollback"
& .\stress-test-rollback.ps1

# Test 6
Write-Host "`nTest 6: CSRF Protection"
& .\stress-test-csrf.ps1

# Test 7
Write-Host "`nTest 7: Error Recovery"
& .\stress-test-errors.ps1

# Test 8
Write-Host "`nTest 8: XSS Protection"
& .\stress-test-xss.ps1

Write-Host "`n✅ All tests completed!"
```

---

## Success Criteria

### Functionality
- ✅ All existing features work unchanged
- ✅ No breaking changes to API contracts
- ✅ Backward compatible responses

### Security
- ✅ CSRF protection blocks unauthorized requests
- ✅ Input validation prevents injection
- ✅ Rate limiting enforced
- ✅ XSS payloads sanitized

### Reliability
- ✅ Transaction rollback prevents corruption
- ✅ No memory leaks under load (< 50MB growth)
- ✅ Graceful error handling
- ✅ Proper logging with request IDs

### Performance
- ✅ Validation overhead < 10ms
- ✅ No significant latency increase
- ✅ Cache still effective

---

## Test Results Template

```
# Stress Test Results - [Date]

## Environment
- Node Version: 
- Next.js Version:
- OS: Windows
- Memory: 

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| Concurrent Updates | ✅/❌ | |
| Input Validation | ✅/❌ | |
| Rate Limiting | ✅/❌ | |
| Memory Leak | ✅/❌ | Growth: XX MB |
| Transaction Rollback | ✅/❌ | |
| CSRF Protection | ✅/❌ | |
| Error Recovery | ✅/❌ | |
| XSS Protection | ✅/❌ | |

## Issues Found
1. [Description]
2. [Description]

## Recommendations
1. [Recommendation]
2. [Recommendation]
```
