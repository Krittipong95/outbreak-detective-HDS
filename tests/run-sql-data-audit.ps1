$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$chrome='C:\Program Files\Google\Chrome\Application\chrome.exe'
$tag=[guid]::NewGuid().ToString('N')
$htmlPath=Join-Path $root ("__sql_data_"+$tag+'.html')
$profile=Join-Path ([IO.Path]::GetTempPath()) ('od-sql-'+$tag)
try{
  $html=[IO.File]::ReadAllText((Join-Path $root 'index.html')).Replace('</body>','<script src="tests/sql-data-audit.js"></script></body>')
  [IO.File]::WriteAllText($htmlPath,$html,[Text.UTF8Encoding]::new($false))
  $url=([Uri]$htmlPath).AbsoluteUri
  $ErrorActionPreference='Continue'
  $output=(& $chrome --headless --disable-gpu --no-sandbox '--window-size=1366,820' "--user-data-dir=$profile" --virtual-time-budget=26000 --dump-dom $url 2>$null|Out-String)
  $ErrorActionPreference='Stop'
  if($output -notmatch '(?s)<pre id="sql-data-audit-output">(.*?)</pre>'){throw 'SQL data audit output missing'}
  $result=[Net.WebUtility]::HtmlDecode($Matches[1])|ConvertFrom-Json
  $result|ConvertTo-Json -Depth 5
  if($result.errors.Count){throw "SQL data audit failed: $($result.errors -join '; ')"}
}finally{
  if(Test-Path -LiteralPath $htmlPath){Remove-Item -LiteralPath $htmlPath}
}
