#!/bin/bash

echo "Concatenating CSS..."
cat ./public/css/bootstrap.css > ./public/css/all.css
cat ./public/css/bootstrap-responsive.css >> ./public/css/all.css
cat ./public/css/outfitly.css >> ./public/css/all.css

echo "Concatenating JS..."
cat ./public/js/bootstrap.js > ./public/js/all.js
cat ./public/js/underscore.js >> ./public/js/all.js
cat ./public/js/backbone.js >> ./public/js/all.js
cat ./public/js/torso.js >> ./public/js/all.js
cat ./public/js/moment.js >> ./public/js/all.js
cat ./public/js/outfitly.js >> ./public/js/all.js

echo "Minifying CSS..."
java -jar ./tools/yuicompressor*.jar -o ./public/css/all.min.css ./public/css/all.css

echo "Minifying JS..."
java -jar ./tools/yuicompressor*.jar -o ./public/js/all.min.js ./public/js/all.js

echo "Build complete."