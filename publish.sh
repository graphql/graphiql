#!/bin/bash

if [ -f ".envrc" ]; then
    echo "Loading .envrc"
    source .envrc
else
    echo "No .envrc"
fi

echo "============================"
echo "PAT: $PAT"
echo "PRODUCTION: $PRODUCTION"
echo "============================"

if [ "$PRODUCTION" = "1" ]; then
    git config --global user.email "prismabots@gmail.com"
    git config --global user.name "Prismo"
    git remote add github "https://$GITHUB_ACTOR:$GH_TOKEN@github.com/$GITHUB_REPOSITORY.git" || true
else
    echo "Not setting up repo because PRODUCTION is not set"
fi

if [ -z "$PAT" ]; then
    echo "\$PAT is empty. Please set the value of $PAT"
elif [ -n "$PAT" ]; then
    if [ "$PRODUCTION" = "1" ]; then
        ./node_modules/.bin/vsce publish patch --pat $PAT
    else
        echo "Printing the command because PRODUCTION is not set"
        echo "./node_modules/.bin/vsce publish patch --pat $PAT"
    fi
fi

if [ "$PRODUCTION" = "1" ]; then
    git pull github "${GITHUB_REF}" --ff-only
    git push github HEAD:"${GITHUB_REF}"
else
    echo "Not pushing because PRODUCTION is not set"
fi
