echo "Importing in dev..."
npx convex run games:importVocabulary "$(jq -c '{entries: .}' data/vocabulary.json)"
echo "Importing in prod..."
npx convex run games:importVocabulary --prod "$(jq -c '{entries: .}' data/vocabulary.json)"

