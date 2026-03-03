const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'node_modules/react-native-reanimated-skeleton/src/ShiverBone.tsx',
    from: 'import LinearGradient from "react-native-linear-gradient";',
    to: 'import { LinearGradient } from "expo-linear-gradient";',
  },
  {
    file: 'node_modules/react-native-reanimated-skeleton/lib/module/ShiverBone.js',
    from: 'import LinearGradient from "react-native-linear-gradient";',
    to: 'import { LinearGradient } from "expo-linear-gradient";',
  },
];

let changed = 0;

for (const { file, from, to } of replacements) {
  const fullPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(fullPath)) continue;

  const current = fs.readFileSync(fullPath, 'utf8');
  if (current.includes(to)) continue;
  if (!current.includes(from)) continue;

  fs.writeFileSync(fullPath, current.replace(from, to), 'utf8');
  changed += 1;
}

console.log(`[patch-reanimated-skeleton-expo] patched ${changed} file(s)`);
