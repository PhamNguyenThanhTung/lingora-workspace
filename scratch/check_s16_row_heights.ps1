$pptxPath = Convert-Path 'docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v13.pptx'
$ppt = New-Object -ComObject PowerPoint.Application
$pres = $ppt.Presentations.Open($pptxPath, 0, 0, 0)
$slide = $pres.Slides.Item(16)
$table = $slide.Shapes.Item(3).Table
for ($r = 1; $r -le $table.Rows.Count; $r++) {
    $h = $table.Rows.Item($r).Height
    Write-Host "Row $r Height=$h"
}
$pres.Close()
$ppt.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
