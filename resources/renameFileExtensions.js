const copy = require('copy');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const crypto = require('crypto');
const rimraf = require('rimraf');

const [, , src, dest, destExtension] = process.argv;
if (!src || !dest || !destExtension) {
  console.error(
    `\nMissing arguments.\n\nUsage:\nnode renameFileExtensions.js './dist/**/*.js' './dest-dir' .new.extension.js`,
  );
  process.exit(1);
}

const coveragePath = path.join(__dirname, `../coverage`);

const tempRenamePath = path.join(
  coveragePath,
  '.temp',
  crypto.randomBytes(20).toString('hex'),
);

if (fs.existsSync(tempRenamePath)) {
  rimraf.sync(tempRenamePath);
}

const tempPath = mkdirp.sync(tempRenamePath);

if (tempPath) {
  copy(src, tempRenamePath, (error, files) => {
    if (error) {
      throw error;
    }
    files.forEach(file => {
      if (file.dest) {
        const srcExt = path.parse(file.dest).ext;
        const destinationPath = file.dest
          .replace(srcExt, destExtension) // rewrite extension
          .replace(tempRenamePath, dest); // and destination path
        // move the files and rename them... by renaming them :)
        fs.renameSync(file.dest, path.resolve(destinationPath));
      }
    });
    // should cleanup temp directory after renaming
    // every file to the destination path
    rimraf.sync(tempRenamePath);
  });
} else {
  throw Error(`Could not generate temporary path\n${tempRenamePath}`);
}
