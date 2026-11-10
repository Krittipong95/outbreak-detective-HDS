$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$chrome='C:\Program Files\Google\Chrome\Application\chrome.exe'
$tag=[guid]::NewGuid().ToString('N')
$htmlPath=Join-Path $root ("__ui_feedback_"+$tag+'.html')
try{
  $html=[IO.File]::ReadAllText((Join-Path $root 'index.html')).Replace('</body>','<script src="tests/ui-feedback-audit.js"></script></body>')
  [IO.File]::WriteAllText($htmlPath,$html,[Text.UTF8Encoding]::new($false))
  $results=@()
  foreach($view in @('practice','ch1','handbook','choices','ending','overlay-cleanup','board-lines','painted-scenes')){
    $profile=Join-Path ([IO.Path]::GetTempPath()) ('od-feedback-'+[guid]::NewGuid().ToString('N'))
    $shot=Join-Path $root ('.qa-review\feedback-'+$view+'.png')
    $url=([Uri]$htmlPath).AbsoluteUri+'?view='+$view
    $ErrorActionPreference='Continue'
    $output=(& $chrome --headless --disable-gpu --no-sandbox '--window-size=1366,820' "--user-data-dir=$profile" --virtual-time-budget=4000 "--screenshot=$shot" --dump-dom $url 2>$null|Out-String)
    $ErrorActionPreference='Stop'
    if($output -notmatch '(?s)<pre id="ui-feedback-output">(.*?)</pre>'){throw "UI feedback output missing for $view"}
    $result=[Net.WebUtility]::HtmlDecode($Matches[1])|ConvertFrom-Json;$results+=$result
    if($result.errors.Count){throw "UI feedback failed for $view`: $($result.errors -join '; ')"}
  }
  $results|ConvertTo-Json -Depth 5
}finally{if(Test-Path -LiteralPath $htmlPath){Remove-Item -LiteralPath $htmlPath}}
