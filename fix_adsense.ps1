# Fix AdSense script formatting issue
$htmlFiles = Get-ChildItem -Path . -Include *.html -Recurse

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Fix the backtick-n issue
    $content = $content -replace '`n\s+crossorigin', "`n     crossorigin"
    $content = $content -replace '`n\s+', "`n     "
    
    # Better fix: replace the entire problematic line
    $content = $content -replace '<script async src="https://pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js\?client=ca-pub-3142279668395491"`n\s+crossorigin="anonymous"></script>', '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3142279668395491"`n     crossorigin="anonymous"></script>'
    
    # Even better: replace with proper single-line format
    $content = $content -replace '<script async src="https://pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js\?client=ca-pub-3142279668395491"[^>]*crossorigin="anonymous"></script>', '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3142279668395491" crossorigin="anonymous"></script>'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}

Write-Host "Fix complete!"
