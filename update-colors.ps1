# Script pour remplacer toutes les occurrences de l'ancienne couleur BF1 par la nouvelle
# Ancienne couleur: #DC143C -> Nouvelle couleur: #E23E3E

$oldColor = '#DC143C'
$newColor = '#E23E3E'

$files = Get-ChildItem -Path "src" -Filter "*.js" -Recurse

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Remplacer toutes les occurrences (case sensitive)
    $content = $content -replace [regex]::Escape($oldColor), $newColor
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $replacements = ([regex]::Matches($originalContent,[regex]::Escape($oldColor))).Count
        $totalReplacements += $replacements
        $totalFiles++
        Write-Host "OK $($file.Name) - $replacements remplacement(s)"
    }
}

Write-Host ""
Write-Host "Migration terminee !"
Write-Host "Fichiers modifies: $totalFiles"
Write-Host "Total remplacements: $totalReplacements"
Write-Host "$oldColor => $newColor"
Write-Host ""
