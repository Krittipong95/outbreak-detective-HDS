# Run the browser audit without changing the game or the user's saved progress.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$chrome = @('C:\Program Files\Google\Chrome\Application\chrome.exe','C:\Program Files (x86)\Google\Chrome\Application\chrome.exe') | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $chrome) { throw 'Google Chrome was not found at the standard installation paths.' }
$tag = [guid]::NewGuid().ToString('N')
$htmlPath = Join-Path $root ("__audit_" + $tag + '.html')
$reportPath = Join-Path $root ("__audit_report_" + $tag + '.js')
$profile = Join-Path ([IO.Path]::GetTempPath()) ("od-audit-" + $tag)
try {
  $report = [IO.File]::ReadAllText((Join-Path $root 'js\report.js')).Replace('return {run, truth, related};','return {run, truth, related, gradeFor, score};')
  $html = ([IO.File]::ReadAllText((Join-Path $root 'index.html')) -replace 'src="js/report\.js(?:\?[^" ]*)?"',('src="' + [IO.Path]::GetFileName($reportPath) + '"')).Replace('</body>','<script src="tests/outbreak-audit.js"></script></body>')
  [IO.File]::WriteAllText($reportPath,$report,[Text.UTF8Encoding]::new($false))
  [IO.File]::WriteAllText($htmlPath,$html,[Text.UTF8Encoding]::new($false))
  $url = ([Uri]$htmlPath).AbsoluteUri
  $ErrorActionPreference = 'Continue'
  $output = (& $chrome --headless --disable-gpu --no-sandbox "--user-data-dir=$profile" --virtual-time-budget=25000 --dump-dom $url 2>$null | Out-String)
  $ErrorActionPreference = 'Stop'
  if ($output -notmatch '(?s)<pre id="audit-output">(.*?)</pre>') { throw 'Audit output was not produced.' }
  $result = [System.Net.WebUtility]::HtmlDecode($Matches[1]) | ConvertFrom-Json
  $result | ConvertTo-Json -Depth 6
  if ($result.errors.Count -gt 0) { throw "Audit found $($result.errors.Count) failure(s)." }
} finally {
  if (Test-Path -LiteralPath $htmlPath) { Remove-Item -LiteralPath $htmlPath }
  if (Test-Path -LiteralPath $reportPath) { Remove-Item -LiteralPath $reportPath }
}
