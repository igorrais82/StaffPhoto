# Starts the Realme Android emulator and keeps the window centered.
param(
    [string]$AvdName = "Realme_12_Pro_Plus",
    [switch]$ColdBoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$emulator = Join-Path $sdk "emulator\emulator.exe"
$adb = Join-Path $sdk "platform-tools\adb.exe"
$centerScript = Join-Path $PSScriptRoot "Center-AndroidEmulator.ps1"

if (-not (Test-Path $emulator)) { throw "emulator.exe not found at $emulator" }
if (-not (Test-Path $centerScript)) { throw "Missing $centerScript" }

$env:Path = "$sdk\emulator;$sdk\platform-tools;$env:Path"

function Test-DeviceOnline {
    $out = & $adb devices 2>$null
    return [bool]($out | Select-String -Pattern "emulator-\d+\s+device")
}

# Prefill centered coordinates for cold start.
Add-Type -AssemblyName System.Windows.Forms
$wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$approxW = 434
$approxH = [Math]::Min(976, $wa.Height)
$prefX = [int]($wa.X + ($wa.Width - $approxW) / 2)
$prefY = [int]($wa.Y + [Math]::Max(0, ($wa.Height - $approxH) / 2))

$iniPath = Join-Path $env:USERPROFILE ".android\avd\$AvdName.avd\emulator-user.ini"
$iniDir = Split-Path $iniPath -Parent
if (Test-Path $iniDir) {
    $uuidLine = $null
    if (Test-Path $iniPath) {
        $uuidLine = Get-Content $iniPath | Where-Object { $_ -match '^\s*uuid\s*=' } | Select-Object -First 1
    }
    $lines = @(
        "window.x = $prefX",
        "window.y = $prefY",
        "window.scale = -1.000000",
        "resizable.config.id = -1",
        "posture = 0"
    )
    if ($uuidLine) { $lines += $uuidLine }
    Set-Content -Path $iniPath -Value $lines -Encoding UTF8
    Write-Host "Prefill launch position: $prefX,$prefY"
}

if (-not (Test-DeviceOnline)) {
    $launchArgs = @("-avd", $AvdName, "-netdelay", "none", "-netspeed", "full")
    if ($ColdBoot) { $launchArgs += "-no-snapshot-load" }
    Write-Host "Starting emulator $AvdName..."
    Start-Process -FilePath $emulator -ArgumentList $launchArgs | Out-Null
} else {
    Write-Host "Emulator already running."
}

Write-Host "Waiting for window to center..."
$deadline = (Get-Date).AddMinutes(3)
$centered = $false
do {
    $result = & powershell -NoProfile -ExecutionPolicy Bypass -File $centerScript -AvdName $AvdName -SaveToIni
    if ($LASTEXITCODE -eq 0) {
        $result | ForEach-Object { Write-Host $_ }
        $centered = $true
        break
    }
    Start-Sleep -Seconds 2
} while ((Get-Date) -lt $deadline)

if (-not $centered) {
    Write-Warning "Could not center emulator window in time."
}

& $adb wait-for-device | Out-Null
Write-Host "Device ready."
