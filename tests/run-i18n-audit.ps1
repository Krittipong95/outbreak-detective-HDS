$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$chrome='C:\Program Files\Google\Chrome\Application\chrome.exe'
$tag=[guid]::NewGuid().ToString('N')
$htmlPath=Join-Path $root ("__i18n_"+$tag+'.html')
$profile=Join-Path ([IO.Path]::GetTempPath()) ('od-i18n-'+$tag)
try{
  $html=[IO.File]::ReadAllText((Join-Path $root 'index.html')).Replace('<head>','<head><script>window.__OD_I18N_OFFLINE__=true</script>').Replace('</body>','<script src="tests/i18n-audit.js"></script></body>')
  [IO.File]::WriteAllText($htmlPath,$html,[Text.UTF8Encoding]::new($false))
  $url=([Uri]$htmlPath).AbsoluteUri+'?lang=en'
  $shot=Join-Path $root '.qa-review\english-title.png'
  $ErrorActionPreference='Continue'
  $output=(& $chrome --headless --disable-gpu --no-sandbox '--window-size=1366,820' "--user-data-dir=$profile" --virtual-time-budget=3500 "--screenshot=$shot" --dump-dom $url 2>$null|Out-String)
  $ErrorActionPreference='Stop'
  if($output -notmatch '(?s)<pre id="i18n-audit-output">(.*?)</pre>'){throw 'i18n audit output missing'}
  $result=[Net.WebUtility]::HtmlDecode($Matches[1])|ConvertFrom-Json
  $result|ConvertTo-Json -Depth 5
  if($result.errors.Count){throw "i18n audit failed: $($result.errors -join '; ')"}
}finally{if(Test-Path -LiteralPath $htmlPath){Remove-Item -LiteralPath $htmlPath}}
