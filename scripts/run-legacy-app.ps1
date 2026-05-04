$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
$projectDir = Join-Path $repoRoot "src\ContosoUniversity"
$solutionFile = Join-Path $projectDir "ContosoUniversity.sln"
$port = 5555
$appUrl = "http://localhost:$port"

Write-Host "=== ContosoUniversity Legacy App ===" -ForegroundColor Cyan

# --- Find MSBuild ---
Write-Host "`n[1/3] Locating MSBuild..." -ForegroundColor Yellow
$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (-not (Test-Path $vsWhere)) {
    Write-Host "ERROR: Visual Studio not found. Install VS 2022 or Build Tools." -ForegroundColor Red
    exit 1
}
$msbuild = (& $vsWhere -latest -products * -requires Microsoft.Component.MSBuild -find "MSBuild\**\Bin\MSBuild.exe" |
    Select-Object -First 1)

if ([string]::IsNullOrWhiteSpace($msbuild) -or -not (Test-Path $msbuild)) {
    Write-Host "ERROR: MSBuild not found. Install Visual Studio 2022 or Build Tools with the ASP.NET and web development workload." -ForegroundColor Red
    exit 1
}
Write-Host "  Found: $msbuild" -ForegroundColor Green

# --- Restore NuGet packages ---
Write-Host "`n[2/3] Restoring NuGet packages & building..." -ForegroundColor Yellow
$nuget = Get-Command nuget.exe -ErrorAction SilentlyContinue
if ($nuget) {
    & nuget.exe restore $solutionFile
} else {
    # Use MSBuild restore as fallback
    & $msbuild $solutionFile /t:Restore /p:RestorePackagesConfig=true /v:quiet
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: NuGet restore failed." -ForegroundColor Red
    exit 1
}
Write-Host "  Packages restored." -ForegroundColor Green

# --- Build ---
& $msbuild $solutionFile /p:Configuration=Debug /v:minimal
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed." -ForegroundColor Red
    exit 1
}
Write-Host "  Build succeeded." -ForegroundColor Green

# --- Launch IIS Express ---
Write-Host "`n[3/3] Launching IIS Express on $appUrl ..." -ForegroundColor Yellow
$iisExpress = "C:\Program Files\IIS Express\iisexpress.exe"
if (-not (Test-Path $iisExpress)) {
    $iisExpress = "C:\Program Files (x86)\IIS Express\iisexpress.exe"
}
if (-not (Test-Path $iisExpress)) {
    Write-Host "ERROR: IIS Express not found." -ForegroundColor Red
    exit 1
}

Write-Host "  Opening browser..." -ForegroundColor Green
Start-Process $appUrl

# Run IIS Express (blocks until Ctrl+C)
Write-Host "  Press Ctrl+C to stop." -ForegroundColor Gray
& $iisExpress /path:"$projectDir" /port:$port
