import fs from 'fs';
import path from 'path';

const controllersDir = './src/controllers';

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('new ApiResponse')) {
          // Print filename, line number, and a few surrounding lines
          console.log(`--- ${fullPath}:${i+1} ---`);
          console.log(lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 5)).join('\n'));
        }
      }
    }
  }
}

scan(controllersDir);
