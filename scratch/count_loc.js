import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excludeDirs = ['node_modules', 'dist', '.git', '.agents', '.gemini'];
const includeExts = ['.js', '.jsx', '.css', '.json', '.md', '.html'];

let totalLines = 0;
let fileCount = 0;

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        walk(fullPath);
      }
    } else {
      const ext = path.extname(file);
      if (includeExts.includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n').length;
        totalLines += lines;
        fileCount++;
      }
    }
  });
}

walk(path.join(__dirname, '..'));
console.log(`TOTAL_LINES:${totalLines}`);
console.log(`TOTAL_FILES:${fileCount}`);
