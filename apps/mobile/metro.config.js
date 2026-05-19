const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo so Metro sees all packages
config.watchFolders = [monorepoRoot];

// 2. Resolution order: local first, then root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force ALL singleton packages to resolve from ONE location (root).
//    This prevents the "two React copies" hook crash.
//    Every package listed here — no matter where it's imported from —
//    will always resolve to the root node_modules copy.
const rootModules = path.resolve(monorepoRoot, 'node_modules');

config.resolver.extraNodeModules = new Proxy(
  {
    // Explicit aliases
    '@longevity/shared': path.resolve(monorepoRoot, 'packages/shared/src/index.ts'),
  },
  {
    get: (target, name) => {
      // For any package not explicitly aliased, check if it exists in root
      // and return that path — ensuring single-copy resolution
      if (name in target) return target[name];
      const rootPath = path.resolve(rootModules, name);
      try {
        require.resolve(rootPath);
        return rootPath;
      } catch {
        return path.resolve(projectRoot, 'node_modules', name);
      }
    },
  }
);

module.exports = config;
