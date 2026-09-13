import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import copy from 'copy';
import { rimrafSync } from 'rimraf';

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
  rimrafSync(tempRenamePath);
}

const tempPath = fs.mkdirSync(tempRenamePath, { recursive: true });

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

        fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
        fs.renameSync(file.dest, destinationPath);
      }
    }
    rimrafSync(tempRenamePath);
  });
} else {
  throw new Error(`Could not generate temporary path\n${tempRenamePath}`);
}
