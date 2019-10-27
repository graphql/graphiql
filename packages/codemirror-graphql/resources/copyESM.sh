for f in esm/*.js; do
    mv -- "$f" "${f%.js}.esm.js"
done
for f in esm/**/*.js; do
    mv -- "$f" "${f%.js}.esm.js"
done
cp -rv esm/* .
