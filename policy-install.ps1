# Помощник МАЯК на компьютерах площадки: Chrome сам ставит его из Chrome Web Store, сам обновляет и не даёт
# удалить случайно (политика ExtensionInstallForcelist). Нужны права администратора, скрипт сам их попросит.
# Работает, только когда расширение опубликовано в магазине: на компьютерах вне домена Chrome ставит по
# политике лишь расширения из магазина. Отмена: policy-remove.ps1.
#   irm https://raw.githubusercontent.com/lebedev-git/mayak-helper/main/policy-install.ps1 | iex
$ErrorActionPreference = 'Stop'
$self = 'https://raw.githubusercontent.com/lebedev-git/mayak-helper/main/policy-install.ps1'
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) {
  Write-Host 'Нужны права администратора: Windows сейчас спросит разрешение.'
  Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"irm $self | iex`""
  return
}

$id = 'mldmbhfpnpcfcpankjiepbdldpgljhij'
$key = 'HKLM:\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist'
# New-Item -Force по существующему ключу стёр бы чужие расширения из списка: создаём, только если ключа нет.
if (-not (Test-Path $key)) { New-Item $key -Force | Out-Null }
$names = @((Get-Item $key).Property)
$name = $names | Where-Object { (Get-ItemPropertyValue $key $_) -like "$id*" } | Select-Object -First 1
if (-not $name) { $n = 1; while ($names -contains "$n") { $n++ }; $name = "$n" }
New-ItemProperty $key -Name $name -Value "$id;https://clients2.google.com/service/update2/crx" -PropertyType String -Force | Out-Null

# Копия из папки (install.ps1) рядом с магазинной дала бы на странице две подсказки сразу.
$old = Join-Path $env:LOCALAPPDATA 'MayakHelper'
if (Test-Path $old) {
  Remove-Item $old -Recurse -Force
  Write-Host 'Копия помощника из папки удалена. На странице chrome://extensions у неё будет ошибка: нажмите там Удалить.'
}
Write-Host 'Готово. Закройте Chrome полностью и откройте снова: помощник поставится сам примерно за минуту.'
Write-Host 'Проверка: адрес chrome://policy, строка ExtensionInstallForcelist.'
Read-Host 'Нажмите Enter, чтобы закрыть окно'
