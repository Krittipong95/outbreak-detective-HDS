$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$chrome='C:\Program Files\Google\Chrome\Application\chrome.exe'
$tag=[guid]::NewGuid().ToString('N')
$htmlPath=Join-Path $root ('__polish_'+$tag+'.html')
try{
 $html=[IO.File]::ReadAllText((Join-Path $root 'index.html')).Replace('</body>','<script src="tests/polish-audit.js"></script></body>')
 [IO.File]::WriteAllText($htmlPath,$html,[Text.UTF8Encoding]::new($false))
 foreach($view in @('locale','title','cinema','mobile')){
  $profile=Join-Path ([IO.Path]::GetTempPath()) ('od-polish-'+[guid]::NewGuid().ToString('N'))
  $shot=Join-Path $root ('.qa-review\polish-'+$view+'.png')
  $url=([Uri]$htmlPath).AbsoluteUri+'?lang=en&view='+$view
  $size=if($view -eq 'mobile'){'480,900'}else{'1600,1000'}
  $ErrorActionPreference='Continue'
  $output=(& $chrome --headless --disable-gpu --no-sandbox "--window-size=$size" "--user-data-dir=$profile" --virtual-time-budget=12000 "--screenshot=$shot" --dump-dom $url 2>$null|Out-String)
  $ErrorActionPreference='Stop'
  if($output -notmatch '(?s)<pre id="polish-output">(.*?)</pre>'){throw "Polish output missing: $view"}
  $result=[Net.WebUtility]::HtmlDecode($Matches[1])|ConvertFrom-Json
  $result|ConvertTo-Json -Depth 5
  if($result.errors.Count){throw "Polish failed: $view"}
 }
}finally{if(Test-Path -LiteralPath $htmlPath){Remove-Item -LiteralPath $htmlPath}}
