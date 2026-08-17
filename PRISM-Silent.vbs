Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "Start-Prism.bat" & chr(34), 0
Set WshShell = Nothing
