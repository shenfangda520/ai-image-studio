import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';

// SVG icon - a stylized AI/image generation icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>
  <path d="M152 256 L228 180 L304 256 L380 180" stroke="white" stroke-width="28" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="256" cy="320" r="64" fill="white" opacity="0.9"/>
  <path d="M224 320 L244 340 L288 296" stroke="#6366f1" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

async function generateIcons() {
  // Create icons directory
  mkdirSync('src-tauri/icons', { recursive: true });

  // Generate PNGs at different sizes
  const sizes = [
    { name: '32x32.png', size: 32 },
    { name: '128x128.png', size: 128 },
    { name: '128x128@2x.png', size: 256 },
    { name: 'icon.png', size: 512 },
  ];

  for (const { name, size } of sizes) {
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(`src-tauri/icons/${name}`);
    console.log(`Created ${name} (${size}x${size})`);
  }

  // Create ICO file (32x32 for Windows)
  const ico32 = await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toBuffer();

  // ICO format: header (6 bytes) + dir entry (16 bytes) + image data
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type: icon
  icoHeader.writeUInt16LE(1, 4); // count: 1

  const icoDir = Buffer.alloc(16);
  icoDir[0] = 32; // width
  icoDir[1] = 32; // height
  icoDir[2] = 0; // color count
  icoDir[3] = 0; // reserved
  icoDir.writeUInt16LE(1, 4); // planes
  icoDir.writeUInt16LE(32, 6); // bits per pixel
  icoDir.writeUInt32LE(ico32.length, 8); // size
  icoDir.writeUInt32LE(22, 12); // offset (6 + 16)

  const ico = Buffer.concat([icoHeader, icoDir, ico32]);
  writeFileSync('src-tauri/icons/icon.ico', ico);
  console.log('Created icon.ico');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
