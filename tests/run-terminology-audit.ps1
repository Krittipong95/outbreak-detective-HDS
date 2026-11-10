$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$files=Get-ChildItem (Join-Path $root 'js') -Filter '*.js' -File
$errors=@()
foreach($file in $files){
  $text=[IO.File]::ReadAllText($file.FullName)
  if($text -match '>\s*Odds\s*<'){$errors+="$($file.Name): standalone Odds label"}
  if($text -match '<th>\s*OR\s*(?:<|\s)'){$errors+="$($file.Name): unexplained OR table heading"}
  if($text -match "\['📊 Odds Ratio',"){$errors+="$($file.Name): Odds Ratio label missing abbreviation"}
}
$required=[IO.File]::ReadAllText((Join-Path $root 'js\field-views.js'))
if($required -notmatch 'อัตราส่วนออดส์ \(OR\)'){$errors+='field analysis lacks full Thai term'}
if($required -notmatch 'ช่วงความเชื่อมั่น 95% \(95% CI\)'){$errors+='field analysis lacks full confidence interval term'}
[pscustomobject]@{checks=$files.Count;errors=$errors}|ConvertTo-Json -Depth 4
if($errors.Count){throw ($errors -join '; ')}
