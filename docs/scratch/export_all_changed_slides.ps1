$pptxPath = Convert-Path 'docs/diagrams/lingora-modeling/deck/Lingora-System-Modeling-Presentation-v13.pptx'
$outDir = [System.IO.Path]::GetFullPath('docs/scratch/slides_export')
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$ppt = New-Object -ComObject PowerPoint.Application
$pres = $ppt.Presentations.Open($pptxPath, 0, 0, 0)

$slideNumbers = @(1, 6, 9, 10, 11, 12, 13, 14, 15, 16)
foreach ($sn in $slideNumbers) {
    $slide = $pres.Slides.Item($sn)
    $exportPath = Join-Path $outDir ("Slide_" + $sn + ".png")
    $slide.Export($exportPath, "PNG", 1920, 1080)
    Write-Host "Exported Slide $sn to $exportPath"
}

$pres.Close()
$ppt.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
Write-Host "Done exporting all changed slides!"
