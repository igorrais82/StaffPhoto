# Centers the Android Emulator window on the primary monitor and persists
# window.x / window.y into the AVD emulator-user.ini for the next launch.
param(
    [string]$AvdName = "Realme_12_Pro_Plus",
    [switch]$SaveToIni = $true
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class EmulatorWindowUtil {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    [DllImport("user32.dll")] public static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint dwFlags);
    [DllImport("user32.dll")] public static extern bool GetMonitorInfo(IntPtr hMonitor, ref MONITORINFO lpmi);
    [DllImport("user32.dll")] public static extern bool SystemParametersInfo(uint uiAction, uint uiParam, ref RECT pvParam, uint fWinIni);

    public const uint SWP_NOSIZE = 0x0001;
    public const uint SWP_NOZORDER = 0x0004;
    public const uint MONITOR_DEFAULTTONEAREST = 2;
    public const uint SPI_GETWORKAREA = 0x0030;

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    public struct MONITORINFO {
        public int cbSize;
        public RECT rcMonitor;
        public RECT rcWork;
        public uint dwFlags;
    }

    public static List<IntPtr> FindWindowsByTitlePrefix(string prefix) {
        var result = new List<IntPtr>();
        EnumWindows((hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;
            var sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, sb.Capacity);
            var title = sb.ToString();
            if (!string.IsNullOrEmpty(title) && title.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) {
                result.Add(hWnd);
            }
            return true;
        }, IntPtr.Zero);
        return result;
    }
}
"@ -ErrorAction SilentlyContinue

function Get-WorkArea([IntPtr]$hwnd) {
    if ($hwnd -ne [IntPtr]::Zero) {
        $monitor = [EmulatorWindowUtil]::MonitorFromWindow($hwnd, [EmulatorWindowUtil]::MONITOR_DEFAULTTONEAREST)
        $mi = New-Object EmulatorWindowUtil+MONITORINFO
        $mi.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($mi)
        if ([EmulatorWindowUtil]::GetMonitorInfo($monitor, [ref]$mi)) {
            return $mi.rcWork
        }
    }
    $work = New-Object EmulatorWindowUtil+RECT
    [void][EmulatorWindowUtil]::SystemParametersInfo([EmulatorWindowUtil]::SPI_GETWORKAREA, 0, [ref]$work, 0)
    return $work
}

function Save-EmulatorUserIni {
    param(
        [string]$Name,
        [int]$X,
        [int]$Y
    )
    $iniPath = Join-Path $env:USERPROFILE ".android\avd\$Name.avd\emulator-user.ini"
    $dir = Split-Path $iniPath -Parent
    if (-not (Test-Path $dir)) {
        Write-Warning "AVD folder not found: $dir"
        return
    }

    $lines = @()
    if (Test-Path $iniPath) {
        $lines = @(Get-Content $iniPath)
    }

    $map = [ordered]@{
        "window.x" = "$X"
        "window.y" = "$Y"
    }
    $seen = @{}
    $out = New-Object System.Collections.Generic.List[string]
    foreach ($line in $lines) {
        if ($line -match '^\s*([^=]+?)\s*=\s*(.*)$') {
            $key = $Matches[1].Trim()
            if ($map.Contains($key)) {
                $seen[$key] = $true
                $out.Add(("{0} = {1}" -f $key, $map[$key]))
                continue
            }
        }
        $out.Add($line)
    }
    foreach ($key in $map.Keys) {
        if (-not $seen.ContainsKey($key)) {
            $out.Add(("{0} = {1}" -f $key, $map[$key]))
        }
    }
    Set-Content -Path $iniPath -Value $out -Encoding ascii
    Write-Host "Saved $iniPath -> window.x=$X window.y=$Y"
}

$prefix = "Android Emulator - $AvdName"
$windows = [EmulatorWindowUtil]::FindWindowsByTitlePrefix($prefix)
if ($windows.Count -eq 0) {
    # Fallback: any Android Emulator window
    $windows = [EmulatorWindowUtil]::FindWindowsByTitlePrefix("Android Emulator - ")
}
if ($windows.Count -eq 0) {
    Write-Error "Emulator window for '$AvdName' not found."
    exit 1
}

$hwnd = $windows[0]
$rect = New-Object EmulatorWindowUtil+RECT
[void][EmulatorWindowUtil]::GetWindowRect($hwnd, [ref]$rect)
$width = $rect.Right - $rect.Left
$height = $rect.Bottom - $rect.Top

$work = Get-WorkArea $hwnd
$workW = $work.Right - $work.Left
$workH = $work.Bottom - $work.Top

$x = [int]($work.Left + [Math]::Max(0, ($workW - $width) / 2))
$y = [int]($work.Top + [Math]::Max(0, ($workH - $height) / 2))

[void][EmulatorWindowUtil]::SetWindowPos(
    $hwnd,
    [IntPtr]::Zero,
    $x,
    $y,
    0,
    0,
    [EmulatorWindowUtil]::SWP_NOSIZE -bor [EmulatorWindowUtil]::SWP_NOZORDER
)

Write-Host "Centered '$AvdName' at $x,$y (size ${width}x${height})"

if ($SaveToIni) {
    Save-EmulatorUserIni -Name $AvdName -X $x -Y $y
}
