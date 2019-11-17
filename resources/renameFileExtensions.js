const copy = require('copy');
const path = require('path');
const fs = require('fs');
const os = require('os');

const tmpDir = os.tmpdir();
const [, , src, dest, destExtension] = process.argv;
if (!src || !dest || !destExtension) {
  console.error(
    `\nMissing arguments.\n\nUsage:\nnode renameFileExtensions.js './dist/**/*.js' './dest-dir' .new.extension.js`,
  );
  process.exit(1);
}

const tempDirectory = fs.mkdtempSync(`${tmpDir}${path.sep}`);

copy(src, tempDirectory, (error, files) => {
  if (error) {
    throw error;
  }
  files.forEach(file => {
    if (file.dest) {
      const srcExt = path.parse(file.dest).ext;
      const destinationPath = file.dest
        .replace(srcExt, destExtension)
        .replace(tempDirectory, dest);
      fs.renameSync(file.dest, path.resolve(destinationPath));
    }
  });
});
