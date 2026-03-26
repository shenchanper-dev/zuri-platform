const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const nextStaticRoot = path.join(projectRoot, '.next', 'static');

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const copyFile = (from, to) => {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
};

const findFirst = (dir, predicate) => {
  if (!fs.existsSync(dir)) return null;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (!stat.isFile()) continue;
    if (predicate(item)) return full;
  }
  return null;
};

const findAll = (dir, predicate) => {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => {
      const full = path.join(dir, name);
      try {
        return fs.statSync(full).isFile() && predicate(name);
      } catch {
        return false;
      }
    })
    .map((name) => path.join(dir, name));
};

const writeTextFile = (filePath, content) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
};

const main = () => {
  if (!fs.existsSync(nextStaticRoot)) {
    console.warn('[postbuild-static-aliases] .next/static no existe. ¿Se ejecutó next build?');
    return;
  }

  const chunksDir = path.join(nextStaticRoot, 'chunks');
  const appChunksDir = path.join(chunksDir, 'app');

  const layoutHashed = findFirst(appChunksDir, (name) => name.startsWith('layout-') && name.endsWith('.js'));
  if (layoutHashed) {
    copyFile(layoutHashed, path.join(appChunksDir, 'layout.js'));
  }

  const conductoresDir = path.join(appChunksDir, 'dashboard', 'conductores');
  const conductoresPageHashed = findFirst(conductoresDir, (name) => name.startsWith('page-') && name.endsWith('.js'));
  if (conductoresPageHashed) {
    copyFile(conductoresPageHashed, path.join(conductoresDir, 'page.js'));
  }

  const mainAppHashed = findFirst(chunksDir, (name) => name.startsWith('main-app-') && name.endsWith('.js'));
  if (mainAppHashed) {
    copyFile(mainAppHashed, path.join(chunksDir, 'main-app.js'));
  }

  const webpackHashed = findFirst(chunksDir, (name) => name.startsWith('webpack-') && name.endsWith('.js'));
  const webpackPlain = fs.existsSync(path.join(chunksDir, 'webpack.js')) ? path.join(chunksDir, 'webpack.js') : null;
  const appPagesInternalsTarget = path.join(chunksDir, 'app-pages-internals.js');
  if (webpackPlain) {
    copyFile(webpackPlain, appPagesInternalsTarget);
  } else if (webpackHashed) {
    copyFile(webpackHashed, appPagesInternalsTarget);
  }

  const cssDir = path.join(nextStaticRoot, 'css');
  const cssFiles = findAll(cssDir, (name) => name.endsWith('.css') && !name.includes(path.sep));
  const cssAppLayout = path.join(cssDir, 'app', 'layout.css');
  if (cssFiles.length > 0) {
    const imports = cssFiles
      .map((absPath) => path.basename(absPath))
      .map((file) => `@import url("/_next/static/css/${file}");`)
      .join('\n');
    writeTextFile(cssAppLayout, `${imports}\n`);
  }

  console.log('[postbuild-static-aliases] alias OK');
};

try {
  main();
} catch (e) {
  console.error('[postbuild-static-aliases] falló:', e && e.message ? e.message : e);
  process.exitCode = 0;
}

