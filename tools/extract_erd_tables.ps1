$ErrorActionPreference = "Stop"

$inPath = "D:\Office\True-Beauty-Anees\True_Beauty_ERD_final.drawio.xml"
$outPath = "D:\Office\True-Beauty-Anees\tools\_erd_tables.json"

function Clean-Value([string]$v) {
  if ([string]::IsNullOrWhiteSpace($v)) { return "" }
  # HTML decode
  $decoded = [System.Net.WebUtility]::HtmlDecode($v)
  # Strip tags
  $noTags = [regex]::Replace($decoded, "<[^>]+>", "")
  # Normalize whitespace
  $noTags = $noTags -replace "`u00A0", " "
  $noTags = ($noTags -replace "\s+", " ").Trim()
  return $noTags
}

$xmlText = Get-Content -LiteralPath $inPath -Raw
$xml = New-Object System.Xml.XmlDocument
$xml.PreserveWhitespace = $true
$xml.LoadXml($xmlText)

# Namespace-agnostic select of mxCell nodes
$cells = $xml.SelectNodes("//*[local-name()='mxCell']")

$parentOf = @{}
foreach ($c in $cells) {
  $id = $c.GetAttribute("id")
  if ($id) {
    $parentOf[$id] = $c.GetAttribute("parent")
  }
}

# Tables: parent="1" and style contains "shape=table;"
$tables = @{}
foreach ($c in $cells) {
  $id = $c.GetAttribute("id")
  if (-not $id) { continue }
  $parent = $c.GetAttribute("parent")
  $style = $c.GetAttribute("style")
  if ($parent -eq "1" -and $style -and $style.Contains("shape=table;")) {
    $tname = Clean-Value($c.GetAttribute("value"))
    if ($tname) {
      $tables[$id] = [ordered]@{
        id = $id
        name = $tname
        columns = New-Object System.Collections.Generic.List[string]
      }
    }
  }
}

$typeWords = @(
  "uuid","string","text","int","integer","boolean","enum","date","time","timestamp","json","url","decimal","float","double","String","TEXT[ ]"
)
$keyWords = @("PK","FK","UK","Fk")

function Find-TableAncestor([string]$cellId) {
  $seen = New-Object 'System.Collections.Generic.HashSet[string]'
  $cur = $cellId
  while ($cur -and -not $seen.Contains($cur)) {
    $seen.Add($cur) | Out-Null
    if ($tables.ContainsKey($cur)) { return $cur }
    if ($parentOf.ContainsKey($cur)) { $cur = $parentOf[$cur] } else { $cur = $null }
  }
  return $null
}

foreach ($c in $cells) {
  $cid = $c.GetAttribute("id")
  if (-not $cid) { continue }
  $tid = Find-TableAncestor $cid
  if (-not $tid) { continue }

  $v = Clean-Value($c.GetAttribute("value"))
  if (-not $v) { continue }
  if ($keyWords -contains $v) { continue }
  if ($v.Contains("|") -and $v.Length -gt 20) { continue }
  if ($v.Contains("rgb(") -or $v.Contains("font-family")) { continue }
  if (($typeWords -contains $v) -and (-not $v.Contains("_"))) { continue }
  if (-not [regex]::IsMatch($v, "^[A-Za-z_][A-Za-z0-9_]*$")) { continue }

  $tables[$tid].columns.Add($v)
}

# Deduplicate while preserving order
foreach ($key in @($tables.Keys)) {
  $seen = New-Object 'System.Collections.Generic.HashSet[string]'
  $deduped = New-Object System.Collections.Generic.List[string]
  foreach ($col in $tables[$key].columns) {
    if (-not $seen.Contains($col)) {
      $seen.Add($col) | Out-Null
      $deduped.Add($col)
    }
  }
  $tables[$key].columns = $deduped
}

$tableList = $tables.Values | Sort-Object { $_.name.ToLowerInvariant() }
$outObj = [ordered]@{
  table_count = $tableList.Count
  tables = $tableList
}

$outDir = Split-Path -Parent $outPath
if (-not (Test-Path -LiteralPath $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
$json = $outObj | ConvertTo-Json -Depth 10
Set-Content -LiteralPath $outPath -Value $json -Encoding UTF8

Write-Host "Wrote $outPath with $($outObj.table_count) tables"

