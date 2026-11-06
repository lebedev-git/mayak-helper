# Отмена policy-install.ps1: убрать Помощника МАЯК из обязательных расширений Chrome. Другие расширения
# в этом списке не трогает. После перезапуска Chrome сам удалит помощника. Нужны права администратора.
#   irm https://raw.githubusercontent.com/lebedev-git/mayak-helper/main/policy-remove.ps1 | iex
$ErrorActionPreference = 'Stop'
$self = 'https://raw.githubusercontent.com/lebedev-git/mayak-helper/main/policy-remove.ps1'
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) {
  Write-Host 'Нужны права администратора: Windows сейчас спросит разрешение.'
  Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"irm $self | iex`""
  return
}

$id = 'mldmbhfpnpcfcpankjiepbdldpgljhij'
$key = 'HKLM:\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist'
if (Test-Path $key) {
  foreach ($name in @((Get-Item $key).Property)) {
    if ((Get-ItemPropertyValue $key $name) -like "$id*") { Remove-ItemProperty $key -Name $name }
  }
  if (-not (Get-Item $key).Property) { Remove-Item $key }
}
Write-Host 'Готово. После перезапуска Chrome уберёт Помощника МАЯК.'
Read-Host 'Нажмите Enter, чтобы закрыть окно'
