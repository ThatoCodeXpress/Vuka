#!/bin/bash
# Push the Vuka React Native CLI project to GitHub
# Run this from the ROOT of the workspace: bash artifacts/vuka-cli/push-to-github.sh

set -e
echo "Pushing Vuka React Native CLI to GitHub..."

git remote get-url github 2>/dev/null || \
  git remote add github https://github.com/ThatoCodeXpress/Vuka-.git

git subtree split --prefix=artifacts/vuka-cli -b vuka-cli-final
git push github vuka-cli-final:main --force

git branch -D vuka-cli-final
echo "Done! Check https://github.com/ThatoCodeXpress/Vuka-"
