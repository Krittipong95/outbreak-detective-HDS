$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$tag = [guid]::NewGuid().ToString('N')
$htmlPath = Join-Path $root ("__resume_flow_" + $tag + '.html')
$profile = Join-Path ([IO.Path]::GetTempPath()) ("od-resume-flow-" + $tag)
try {
  $html = [IO.File]::ReadAllText((Join-Path $root 'index.html')).Replace('</body>','<script src="tests/resume-flow-audit.js"></script></body>')
  [IO.File]::WriteAllText($htmlPath,$html,[Text.UTF8Encoding]::new($false))
  $ErrorActionPreference = 'Continue'
  $output = (& $chrome --headless --disable-gpu --no-sandbox "--user-data-dir=$profile" --virtual-time-budget=85000 --dump-dom ([Uri]$htmlPath).AbsoluteUri 2>$null | Out-String)
  $ErrorActionPreference = 'Stop'
  if ($output -notmatch '(?s)<pre id="resume-flow-output">(.*?)</pre>') { throw 'Resume flow output was not produced.' }
  $result = [System.Net.WebUtility]::HtmlDecode($Matches[1]) | ConvertFrom-Json
  $result | ConvertTo-Json -Depth 6
  if ($result.errors.Count -gt 0 -or $result.phase -ne 'complete') { throw 'Resume flow did not complete.' }
} finally { if (Test-Path -LiteralPath $htmlPath) { Remove-Item -LiteralPath $htmlPath } }
