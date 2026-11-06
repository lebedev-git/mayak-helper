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
$tmp = Join-Path $env:TEMP 'mayak-helper-unzip'

Invoke-WebRequest 'https://github.com/lebedev-git/mayak-helper/archive/refs/heads/main.zip' -OutFile $zip -UseBasicParsing
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
Expand-Archive $zip $tmp
if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
Move-Item (Join-Path $tmp 'mayak-helper-main') $dir
Remove-Item $zip, $tmp -Recurse -Force -ErrorAction SilentlyContinue

$v = (Get-Content (Join-Path $dir 'manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json).version
Set-Clipboard $dir
Write-Host "Помощник МАЯК $v в папке $dir"
Write-Host 'Путь скопирован. Первый раз: Режим разработчика, Загрузить распакованное, вставить путь.'
Write-Host 'Обновление: круглая стрелка у расширения на странице chrome://extensions.'
try { Start-Process chrome 'chrome://extensions' } catch { Write-Host 'Откройте в Chrome адрес chrome://extensions' }
