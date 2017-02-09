var execSync = require('child_process').execSync;
var fs = require('fs');

var isWindows = /^win/.test(process.platform)

var out = function (command) {
  execSync(command, {stdio:'inherit'});
};

out("echo \"Running node ./resources/build.js\"");

if (!isWindows) {
  out("set -e");
} // put windows equivalent here if you know it

if (!fs.existsSync('node_modules/.bin')) {
  out("echo \"Be sure to run \`npm install\` before building GraphiQL.");
}

if (isWindows) {
  out("rd /s /q dist\\ && mkdir dist\\");
} else {
  out("rm -rf dist/ && mkdir -p dist/");
}
out("babel src --ignore __tests__ --out-dir dist/");
out("echo \"Bundling graphiql.js...\"");
out("browserify -g browserify-shim -s GraphiQL dist/index.js > graphiql.js");
out("echo \"Bundling graphiql.min.js...\"");
if (isWindows) {
  out("browserify -g browserify-shim -g uglifyify -s GraphiQL dist/index.js | uglifyjs -c --screw-ie8 > graphiql.min.js");
} else {
  out("browserify -g browserify-shim -g uglifyify -s GraphiQL dist/index.js 2> /dev/null | uglifyjs -c --screw-ie8 > graphiql.min.js 2> /dev/null");
}
out("echo \"Bundling graphiql.css...\"");
out("postcss --use autoprefixer css/*.css -d dist/");

if (isWindows) {
  out("type dist\\*.css > graphiql.css");
} else {
  out("cat dist/*.css > graphiql.css");
}
out("echo \"Done\"");
