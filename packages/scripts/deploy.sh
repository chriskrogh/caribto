#!/bin/bash

set -e # Exit on error

git fetch origin # Update remote branches

git checkout prod           # Switch to prod branch
git pull origin prod        # Ensure up-to-date
git merge --ff-only main # Fast-forward only (ensures strict subset)
git push origin prod
git checkout -
