# Помощник МАЯК: скачать последнюю версию с GitHub в постоянную папку и открыть страницу расширений Chrome.
# Первый раз: в Chrome включить "Режим разработчика", "Загрузить распакованное" и выбрать эту папку
# (путь скрипт кладёт в буфер обмена). Обновление: снова запустить скрипт и нажать круглую стрелку
# у расширения. Папка та же, поэтому Chrome подхватывает новую версию без переустановки.
#   irm https://raw.githubusercontent.com/lebedev-git/mayak-helper/main/install.ps1 | iex
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue' # в PowerShell 5 полоска загрузки замедляет скачивание в разы
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$dir = Join-Path $env:LOCALAPPDATA 'MayakHelper'
$zip = Join-Path $env:TEMP 'mayak-helper.zip'
# ZIP берётся с того же raw.githubusercontent.com, откуда пришла эта команда: раз она скачалась, адрес
# доступен. github.com из России открывается не всегда (06.11.2026 у Андрея "Невозможно соединиться").
$url = 'https://raw.githubusercontent.com/lebedev-git/mayak-helper/main/mayak-helper.zip'
for ($i = 1; $i -le 3; $i++) {
  try { Invoke-WebRequest $url -OutFile $zip -UseBasicParsing -TimeoutSec 60; break }
  catch {
    if ($i -eq 3) { throw "Не удалось скачать помощника: $($_.Exception.Message) Проверьте интернет и запустите команду ещё раз." }
    Start-Sleep 3
  }
}
if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
Expand-Archive $zip $dir
Remove-Item $zip -Force

$v = (Get-Content (Join-Path $dir 'manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json).version
Set-Clipboard $dir
Write-Host "Помощник МАЯК $v в папке $dir"
Write-Host 'Путь скопирован. Первый раз: Режим разработчика, Загрузить распакованное, вставить путь.'
Write-Host 'Обновление: круглая стрелка у расширения на странице chrome://extensions.'
try { Start-Process chrome 'chrome://extensions' } catch { Write-Host 'Откройте в Chrome адрес chrome://extensions' }
