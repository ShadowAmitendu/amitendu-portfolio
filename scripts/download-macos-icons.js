import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const iconsDir = path.resolve('src/assets/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const downloads = [
  // Official macOS System PNGs (from puruvj/macos-web & zagnut531/macOS-27-Icons)
  {
    name: 'macos-safari.png',
    url: 'https://raw.githubusercontent.com/puruvj/macos-web/main/public/app-icons/safari/256.png'
  },
  {
    name: 'macos-mail.png',
    url: 'https://raw.githubusercontent.com/puruvj/macos-web/main/public/app-icons/mail/256.png'
  },
  {
    name: 'macos-terminal.png',
    url: 'https://raw.githubusercontent.com/puruvj/macos-web/main/public/app-icons/terminal/256.png'
  },
  {
    name: 'macos-finder.png',
    url: 'https://raw.githubusercontent.com/puruvj/macos-web/main/public/app-icons/finder/256.png'
  },
  {
    name: 'macos-notes.png',
    url: 'https://raw.githubusercontent.com/puruvj/macos-web/main/public/app-icons/notes/256.png'
  },
  // Social & Dev macOS PNGs (from Renovamen/playground-macos, Dav-ej, and walkxcode)
  {
    name: 'macos-github.png',
    url: 'https://raw.githubusercontent.com/Renovamen/playground-macos/main/public/img/icons/github.png'
  },
  {
    name: 'macos-twitter.png',
    url: 'https://raw.githubusercontent.com/Dav-ej/Custom-Big-Sur-Icons/master/Icons/png/Twitter.png'
  },
  {
    name: 'macos-discord.png',
    url: 'https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/png/discord.png'
  },
  {
    name: 'macos-linkedin.png',
    url: 'https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/png/linkedin.png'
  },
  {
    name: 'macos-youtube.png',
    url: 'https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/png/youtube.png'
  },

  // Online macOS WhiteSur SVGs (vinceliuice/WhiteSur-icon-theme)
  {
    name: 'macos-safari.svg',
    url: 'https://raw.githubusercontent.com/vinceliuice/WhiteSur-icon-theme/master/src/apps/scalable/safari.svg'
  },
  {
    name: 'macos-mail.svg',
    url: 'https://raw.githubusercontent.com/vinceliuice/WhiteSur-icon-theme/master/src/apps/scalable/internet-mail.svg'
  },
  {
    name: 'macos-terminal.svg',
    url: 'https://raw.githubusercontent.com/vinceliuice/WhiteSur-icon-theme/master/src/apps/scalable/terminal.svg'
  },
  {
    name: 'macos-github.svg',
    url: 'https://raw.githubusercontent.com/vinceliuice/WhiteSur-icon-theme/master/src/apps/scalable/github-desktop.svg'
  },
  {
    name: 'macos-discord.svg',
    url: 'https://raw.githubusercontent.com/vinceliuice/WhiteSur-icon-theme/master/src/apps/scalable/discord.svg'
  },
  {
    name: 'macos-linkedin.svg',
    url: 'https://raw.githubusercontent.com/vinceliuice/WhiteSur-icon-theme/master/src/apps/scalable/linkedin.svg'
  },
  {
    name: 'macos-youtube.svg',
    url: 'https://raw.githubusercontent.com/vinceliuice/WhiteSur-icon-theme/master/src/apps/scalable/youtube.svg'
  },
  {
    name: 'macos-twitter.svg',
    url: 'https://raw.githubusercontent.com/vinceliuice/WhiteSur-icon-theme/master/src/apps/scalable/twitter.svg'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadFile(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status code ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Downloading all macOS icons in one go...');
  for (const item of downloads) {
    const dest = path.join(iconsDir, item.name);
    try {
      await downloadFile(item.url, dest);
      const size = fs.statSync(dest).size;
      console.log(`✓ Downloaded ${item.name} (${size} bytes)`);
    } catch (err) {
      console.error(`✗ Error downloading ${item.name}:`, err.message);
    }
  }
  console.log('Finished downloading all macOS icons.');
}

run();
