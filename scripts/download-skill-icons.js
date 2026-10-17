import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const iconsDir = path.resolve('src/assets/icons/skills');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const icons = [
  { name: 'html.svg', url: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_html.svg' },
  { name: 'css.svg', url: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_css.svg' },
  { name: 'javascript.svg', url: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_js_official.svg' },
  { name: 'angular.svg', url: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_angular.svg' },
  { name: 'react.svg', url: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_reactjs.svg' },
  { name: 'markdown.svg', url: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_markdown.svg' },
  { name: 'java.svg', url: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_java.svg' },
  { name: 'python.svg', url: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_python.svg' },
  { name: 'c.svg', url: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_c.svg' },
  { name: 'php.svg', url: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_php.svg' },
  { name: 'mysql.svg', url: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_mysql.svg' },
  { name: 'oracle.svg', url: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/oracle/oracle-original.svg' },
  { name: 'typescript.svg', url: 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/file_type_typescript_official.svg' }
];

function downloadFile(name, url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(name, res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        fs.writeFileSync(path.join(iconsDir, name), data);
        console.log(`Downloaded ${name} (${data.length} bytes)`);
        resolve();
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading VS Code skill icons...');
  for (const icon of icons) {
    await downloadFile(icon.name, icon.url);
  }
  console.log('All VS Code skill icons downloaded successfully!');
}

main().catch(err => {
  console.error('Error downloading skill icons:', err);
  process.exit(1);
});
