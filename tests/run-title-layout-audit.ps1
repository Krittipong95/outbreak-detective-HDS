$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$tag = [guid]::NewGuid().ToString('N')
$htmlPath = Join-Path $root ("__title_layout_" + $tag + '.html')
try {
  $html = [IO.File]::ReadAllText((Join-Path $root 'index.html')).Replace('</body>','<script src="tests/title-layout-audit.js"></script></body>')
  [IO.File]::WriteAllText($htmlPath,$html,[Text.UTF8Encoding]::new($false))
  $results = @()
  foreach($size in @('1366,768','1873,950','390,844')){
    $profile = Join-Path ([IO.Path]::GetTempPath()) ("od-title-" + [guid]::NewGuid().ToString('N'))
    $shot = Join-Path $root ('.qa-review\title-' + $size.Replace(',','x') + '.png')
    $ErrorActionPreference = 'Continue'
    $output = (& $chrome --headless --disable-gpu --no-sandbox "--window-size=$size" "--user-data-dir=$profile" --virtual-time-budget=4000 "--screenshot=$shot" --dump-dom ([Uri]$htmlPath).AbsoluteUri 2>$null | Out-String)
    $ErrorActionPreference = 'Stop'
    if ($output -notmatch '(?s)<pre id="title-layout-output">(.*?)</pre>') { throw "Title audit output missing at $size" }
    $result = [System.Net.WebUtility]::HtmlDecode($Matches[1]) | ConvertFrom-Json
    $results += $result
    if ($result.errors.Count -gt 0) { throw "Title audit failed at $size`: $($result.errors -join '; ')" }
  }
  $results | ConvertTo-Json -Depth 5
} finally { if(Test-Path -LiteralPath $htmlPath){Remove-Item -LiteralPath $htmlPath} }
