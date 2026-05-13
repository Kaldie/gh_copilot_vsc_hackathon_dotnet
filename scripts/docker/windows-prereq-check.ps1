$ErrorActionPreference = "SilentlyContinue"

$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$iis1 = "C:\Program Files\IIS Express\iisexpress.exe"
$iis2 = "C:\Program Files (x86)\IIS Express\iisexpress.exe"
$net482 = "C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8.2"

Write-Host "VSWhere: $([bool](Test-Path $vswhere))"
if (Test-Path $vswhere) {
    $msbuild = & $vswhere -latest -products * -requires Microsoft.Component.MSBuild -find "MSBuild\**\Bin\MSBuild.exe" | Select-Object -First 1
    Write-Host "MSBuild: $([bool]$msbuild)"
}

Write-Host "IIS Express: $([bool]((Test-Path $iis1) -or (Test-Path $iis2)))"
Write-Host ".NET Framework 4.8.2 Developer Pack: $([bool](Test-Path $net482))"

$localDbCmd = Get-Command SqlLocalDB.exe
Write-Host "SqlLocalDB command: $([bool]$localDbCmd)"
if ($localDbCmd) {
    & SqlLocalDB.exe info MSSQLLocalDB | Out-Null
    if ($LASTEXITCODE -ne 0) {
        & SqlLocalDB.exe create MSSQLLocalDB | Out-Null
    }
    & SqlLocalDB.exe start MSSQLLocalDB | Out-Null
    Write-Host "MSSQLLocalDB instance: Ready"
}
