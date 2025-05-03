#!/bin/bash
set -e

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
parent_dir=$(dirname "$script_dir")
svg_icon="$parent_dir/resources/icon.svg"
png_icon="$parent_dir/resources/icon.png"

if [ ! -f "$png_icon" ]; then
    convert $svg_icon -resize 128x128 $png_icon
fi

echo "Compiling extension..."
npm run compile

echo "Packaging extension with vsce..."
vsce package

echo "Package complete. Find your .vsix file in the current directory."