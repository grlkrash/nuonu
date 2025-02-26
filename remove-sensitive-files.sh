#!/bin/bash

# This script removes sensitive files from Git history

echo "Removing sensitive files from Git history..."

# Create a backup branch
git checkout -b backup-before-filter

# Use git filter-branch to remove the files from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env* */.env*" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote repository (CAUTION: This rewrites history)
echo "To push these changes to the remote repository, run:"
echo "git push origin --force --all"

echo "Done! Remember to revoke and regenerate any leaked credentials." 