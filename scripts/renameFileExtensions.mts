import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import copy from 'copy';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';

const [, , src, dest, destExtension] = process.argv;
if (!src || !dest || !destExtension) {
  console.error(
    "\nMissing arguments.\n\nUsage:\nnode renameFileExtensions.mts './dist/**/*.js' './dest-dir' .new.extension.js",
  );
  process.exit(1);
}

const coveragePath = path.join(import.meta.dirname, '../coverage');

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
    for (const file of files ?? []) {
      if (file.dest) {
        const srcExt = path.parse(file.dest).ext;
        const destinationPath = path.resolve(
          file.dest
            .replace(srcExt, destExtension)
            .replace(tempRenamePath, dest),
        );

        mkdirp.sync(path.dirname(destinationPath));
        fs.renameSync(file.dest, destinationPath);
      }
    }
    rimraf.sync(tempRenamePath);
  });
} else {
  throw new Error(`Could not generate temporary path\n${tempRenamePath}`);
}
