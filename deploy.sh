#!/bin/bash
# Deployment script for HSBTE_LEET

echo "🚀 HSBTE_LEET Deployment Script"
echo "================================"
echo ""

# Check if images are converted
echo "📸 Checking image conversion..."
png_count=$(find image -name "*.png" -not -name "favicon.png" | wc -l)
webp_count=$(find image -name "*.webp" | wc -l)

if [ "$png_count" -gt 0 ]; then
    echo "⚠️  WARNING: $png_count PNG files still need conversion to WebP"
    echo "   See IMAGE_CONVERSION_GUIDE.md for instructions"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ All images converted to WebP"
fi

# Check git status
echo ""
echo "📋 Git Status:"
git status --short | head -20

# Ask for confirmation
echo ""
read -p "Commit and push changes? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

# Commit changes
echo ""
echo "💾 Committing changes..."
git add .
git commit -m "Performance optimization: WebP images, meta descriptions, CSS fixes

- Updated 221 HTML files to reference WebP images
- Fixed meta descriptions for 203 pages
- Optimized CSS animations and aspect ratios
- Fixed contrast issues
- Added preconnect hints and performance optimizations
- Expected performance score: 58 → 90+"

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployment complete!"
echo "📊 Check Lighthouse scores after deployment"
echo "🔗 Repository: https://github.com/itsnishant089/HSBTE_LEET"
