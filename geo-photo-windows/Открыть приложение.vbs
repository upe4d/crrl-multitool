Option Explicit
Dim fso, shell, root, python, command
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
root = fso.GetParentFolderName(WScript.ScriptFullName)
python = "C:\Python313\pythonw.exe"
If Not fso.FileExists(python) Then
  MsgBox "Python не найден. Запустите файл Запустить.cmd для проверки зависимостей.", 16, "Поиск места по фото"
  WScript.Quit 1
End If
command = Chr(34) & python & Chr(34) & " " & Chr(34) & root & "\desktop.py" & Chr(34)
shell.CurrentDirectory = root
shell.Run command, 0, False
