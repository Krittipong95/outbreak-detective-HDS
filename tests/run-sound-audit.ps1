# Run sound control, scene and Thai speech integration checks in an isolated browser.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$chrome = @('C:\Program Files\Google\Chrome\Application\chrome.exe','C:\Program Files (x86)\Google\Chrome\Application\chrome.exe') | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $chrome) { throw 'Google Chrome was not found at the standard installation paths.' }
$tag = [guid]::NewGuid().ToString('N')
$htmlPath = Join-Path $root ("__sound_audit_" + $tag + '.html')
$profile = Join-Path ([IO.Path]::GetTempPath()) ("od-sound-audit-" + $tag)
try {
  $html = [IO.File]::ReadAllText((Join-Path $root 'index.html')).Replace('</body>','<script src="tests/sound-audit.js"></script></body>')
  [IO.File]::WriteAllText($htmlPath,$html,[Text.UTF8Encoding]::new($false))
  $url = ([Uri]$htmlPath).AbsoluteUri
  $ErrorActionPreference = 'Continue'
  $output = (& $chrome --headless --disable-gpu --no-sandbox --autoplay-policy=no-user-gesture-required "--user-data-dir=$profile" --virtual-time-budget=5000 --dump-dom $url 2>$null | Out-String)
  $ErrorActionPreference = 'Stop'
  if ($output -notmatch '(?s)<pre id="sound-audit-output">(.*?)</pre>') { throw 'Sound audit output was not produced.' }
  $result = [System.Net.WebUtility]::HtmlDecode($Matches[1]) | ConvertFrom-Json
  $result | ConvertTo-Json -Depth 6
  if ($result.errors.Count -gt 0) { throw "Sound audit found $($result.errors.Count) failure(s)." }
} finally {
  if (Test-Path -LiteralPath $htmlPath) { Remove-Item -LiteralPath $htmlPath }
}
