#!/bin/bash
# ==========================================================
# Double-click this file on macOS to copy all project files
# ==========================================================
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "=========================================================="
echo " 🚀 TERA (Emergency Resource Platform) - Quick Copy Tool"
echo "=========================================================="
echo ""
echo "Source folder: $DIR"
echo ""

DEFAULT_DEST="$HOME/Desktop/tera_project"
echo "Where would you like to copy all the project files?"
echo "Press Enter to copy to Default: $DEFAULT_DEST"
read -p "Target folder: " USER_DEST

DEST="${USER_DEST:-$DEFAULT_DEST}"

echo ""
echo "📁 Preparing target: $DEST ..."
mkdir -p "$DEST"

echo "📦 Copying all files..."
rsync -av \
  --exclude="node_modules" \
  --exclude="venv" \
  --exclude=".pytest_cache" \
  --exclude="__pycache__" \
  --exclude=".git" \
  --exclude="*.zip" \
  --exclude=".DS_Store" \
  "$DIR/" "$DEST/"

echo ""
echo "=========================================================="
echo "✅ SUCCESS: All project files have been copied to:"
echo "   $DEST"
echo "=========================================================="
echo ""
open "$DEST"
echo "Opened $DEST in Finder."
echo "Press [Enter] to exit..."
read
