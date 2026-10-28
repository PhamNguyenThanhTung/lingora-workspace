$pptxPath = Convert-Path 'docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v13.pptx'
$ppt = New-Object -ComObject PowerPoint.Application
$pres = $ppt.Presentations.Open($pptxPath, 0, 0, 0)
$slide = $pres.Slides.Item(16)
Write-Host "Slide 16 Shapes count: $($slide.Shapes.Count)"
for ($i = 1; $i -le $slide.Shapes.Count; $i++) {
    $s = $slide.Shapes.Item($i)
    $bottom = $s.Top + $s.Height
    Write-Host "Shape $i ($($s.Name)): Top=$($s.Top), Height=$($s.Height), Bottom=$bottom"
}
$pres.Close()
$ppt.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
