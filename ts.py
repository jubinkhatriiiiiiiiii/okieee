#!/bin/bash
echo "🚀 Starting safe cleanup..."

# 1. Clear npm & yarn cache
echo "🧩 Cleaning npm & yarn cache..."
npm cache clean --force >/dev/null 2>&1
yarn cache clean >/dev/null 2>&1

# 2. Clear Gradle cache
echo "⚙️ Cleaning Gradle cache..."
rm -rf ~/.gradle/caches/
rm -rf ~/.gradle/daemon/
rm -rf ~/.gradle/native/

# 3. Clear Expo & Metro cache
echo "📱 Cleaning Expo & Metro cache..."
rm -rf ~/.expo
rm -rf ~/.cache/expo
rm -rf ~/.cache/metro

# 4. Clear general user cache (~/.cache)
echo "🗑️ Cleaning user cache..."
rm -rf ~/.cache/*

# 5. Remove node_modules from old projects
echo "📦 Finding and deleting large node_modules (this may take a while)..."
find ~/ -name "node_modules" -type d -prune -exec du -sh {} + 2>/dev/null
echo "👉 Above are node_modules folders."
read -p "Do you want to delete ALL node_modules found in your home folder? (y/n): " confirm
if [ "$confirm" = "y" ]; then
  find ~/ -name "node_modules" -type d -prune -exec rm -rf '{}' +
  echo "✅ Deleted all node_modules."
else
  echo "⏩ Skipped deleting node_modules."
fi

# 6. Clean apt package cache
echo "📦 Cleaning apt cache..."
sudo apt-get clean
sudo apt-get autoremove -y

# 7. Vacuum old system logs (keep last 7 days)
echo "📝 Cleaning old logs..."
sudo journalctl --vacuum-time=7d

# 8. Remove old Snap revisions
echo "📦 Removing old Snap revisions..."
sudo snap list --all | awk '/disabled/{print $1, $3}' | \
while read snapname revision; do
  sudo snap remove "$snapname" --revision="$revision"
done

echo "🎉 Cleanup complete!"
df -h | grep '/dev/nvme0n1p2'

