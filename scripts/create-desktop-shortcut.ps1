$WshShell = New-Object -comObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$ShortcutPath = Join-Path $DesktopPath "PRISM.lnk"
$TargetDir = Split-Path -Parent $PSScriptRoot

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = Join-Path $TargetDir "Start-Prism.bat"
$Shortcut.WorkingDirectory = $TargetDir
$Shortcut.Description = "Launch PRISM - Autonomous Deal Studio & Distribution Engine"
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully at: $ShortcutPath"
