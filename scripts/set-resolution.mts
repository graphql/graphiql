import { readFile, writeFile } from 'node:fs/promises';

const workspaceFile = new URL('../pnpm-workspace.yaml', import.meta.url);

function parsePackageSpecifier(specifier: string): [string, string] {
  const separatorIndex = specifier.lastIndexOf('@');
  const packageName = specifier.slice(0, separatorIndex);
  const version = specifier.slice(separatorIndex + 1);
  if (separatorIndex <= 0 || !packageName || !version) {
    throw new Error(`Invalid package specifier ${specifier}`);
  }
  return [packageName, version];
}

function quoteYaml(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function setOverride(
  workspaceConfig: string,
  packageName: string,
  version: string,
): string {
  const overridesHeader = 'overrides:\n';
  const overridesIndex = workspaceConfig.indexOf(overridesHeader);
  if (overridesIndex === -1) {
    throw new Error('pnpm-workspace.yaml has no overrides section');
  }

  const sectionStart = overridesIndex + overridesHeader.length;
  const sectionEnd = workspaceConfig.indexOf('\n\n', sectionStart);
  const overrideLine = `  ${quoteYaml(packageName)}: ${quoteYaml(version)}`;
  const overrideSection = workspaceConfig.slice(sectionStart, sectionEnd);
  const packageKeys = [
    `  ${packageName}: `,
    `  ${quoteYaml(packageName)}: `,
    `  ${JSON.stringify(packageName)}: `,
  ];
  const existingLine = overrideSection
    .split('\n')
    .find(line => packageKeys.some(packageKey => line.startsWith(packageKey)));

  if (existingLine) {
    return workspaceConfig.replace(existingLine, overrideLine);
  }

  return `${workspaceConfig.slice(0, sectionStart)}${overrideLine}\n${workspaceConfig.slice(sectionStart)}`;
}

async function setResolution(): Promise<void> {
  const specifier = process.argv[2];
  if (!specifier) {
    throw new Error('no package specifier provided');
  }

  const [packageName, version] = parsePackageSpecifier(specifier);
  const workspaceConfig = await readFile(workspaceFile, 'utf8');
  await writeFile(
    workspaceFile,
    setOverride(workspaceConfig, packageName, version),
    'utf8',
  );
}

setResolution().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
