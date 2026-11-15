# Free space for FINAL PHASE build — safe caches only
$ErrorActionPreference = "Continue"
Write-Host "=== Disk before ==="
Get-PSDrive -PSProvider FileSystem | ForEach-Object {
  "{0}: free={1:N2} GB" -f $_.Name, ($_.Free/1GB)
}

$roots = @(
  "D:\N I G H T\rare-oud-platform\.next",
  "D:\N I G H T\rare-oud-platform\design-lab\.next",
  "$env:TEMP\*",
  "$env:LOCALAPPDATA\Temp\*"
)

if (Test-Path "D:\N I G H T\rare-oud-platform\.next") {
  Remove-Item -Recurse -Force "D:\N I G H T\rare-oud-platform\.next" -ErrorAction SilentlyContinue
  Write-Host "Removed platform .next"
}
if (Test-Path "D:\N I G H T\rare-oud-platform\design-lab\.next") {
  Remove-Item -Recurse -Force "D:\N I G H T\rare-oud-platform\design-lab\.next" -ErrorAction SilentlyContinue
  Write-Host "Removed design-lab .next"
}

# Playwright / lighthouse caches can be huge
$pw = "$env:USERPROFILE\AppData\Local\ms-playwright"
if (Test-Path $pw) {
  Get-ChildItem $pw -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "chromium_headless_shell-*" -or $_.Name -like "ffmpeg-*" } |
    ForEach-Object {
      Write-Host "Keeping playwright core; skip aggressive wipe of $($_.FullName)"
    }
}

# Next/swc / npm caches
$npmCache = npm cache clean --force 2>&1
Write-Host "npm cache: $npmCache"

Write-Host "=== Disk after ==="
Get-PSDrive -PSProvider FileSystem | ForEach-Object {
  "{0}: free={1:N2} GB" -f $_.Name, ($_.Free/1GB)
}
