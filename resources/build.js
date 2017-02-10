var execSync = require('child_process').execSync;
var fs = require('fs');
var rimraf = require('rimraf');
var isWindows = /^win/.test(process.platform)

var out = function (command) {
  execSync(command, {stdio:'inherit'});
};

console.log('"Running node ./resources/build.js"');

if (!isWindows) {
  out('set -e'); // exit on console error
} // put windows equivalent here if you know it

if (!fs.existsSync('node_modules/.bin')) {
  console.log('"Be sure to run \`npm install\` before building GraphiQL."');
}

var distDir = './dist';
rimraf.sync(distDir);
fs.mkdirSync(distDir);

out('babel src --ignore __tests__ --out-dir dist/');
console.log('"Bundling graphiql.js..."');
out('browserify -g browserify-shim -s GraphiQL dist/index.js > graphiql.js');
console.log('"Bundling graphiql.min.js..."');
if (isWindows) {
  out('browserify -g browserify-shim -g uglifyify -s GraphiQL dist/index.js | uglifyjs -c --screw-ie8 > graphiql.min.js');
} else {
  out('browserify -g browserify-shim -g uglifyify -s GraphiQL dist/index.js 2> /dev/null | uglifyjs -c --screw-ie8 > graphiql.min.js 2> /dev/null');
}
console.log('"Bundling graphiql.css..."');
out('postcss --use autoprefixer css/*.css -d dist/');

var cssFiles = fs.readdirSync('./dist').filter(function (x) {
  return /\.css$/.test(x);
});
var cssContent = '';
for (var i = 0; i < cssFiles.length; i++) {
  cssContent += fs.readFileSync('./dist/' + cssFiles[i]);
}
fs.writeFileSync('./graphiql.css', cssContent);

console.log('"Done"');
