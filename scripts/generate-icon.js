const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [16, 24, 32, 48, 64, 128, 256];
const svgPath = path.join(__dirname, '../build/icon.svg');
const outputDir = path.join(__dirname, '../build');

async function generateIcons() {
  // 生成不同尺寸的 PNG
  const pngBuffers = await Promise.all(
    sizes.map(size => 
      sharp(svgPath)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  // 保存 PNG 文件用于预览
  for (let i = 0; i < sizes.length; i++) {
    const pngPath = path.join(outputDir, `icon-${sizes[i]}.png`);
    fs.writeFileSync(pngPath, pngBuffers[i]);
    console.log(`Generated: icon-${sizes[i]}.png`);
  }

  // 生成 ICO 文件 (使用 PNG 数据)
  // ICO 文件格式
  const iconCount = sizes.length;
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset = headerSize + iconCount * entrySize;

  // 计算每个 PNG 的偏移量
  const offsets = [];
  let currentOffset = dataOffset;
  for (const buf of pngBuffers) {
    offsets.push(currentOffset);
    currentOffset += buf.length;
  }

  // 构建 ICO 文件
  const parts = [];

  // ICONDIR header
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type (1 = ICO)
  header.writeUInt16LE(iconCount, 4); // Number of images
  parts.push(header);

  // ICONDIRENTRY for each image
  for (let i = 0; i < iconCount; i++) {
    const entry = Buffer.alloc(entrySize);
    const size = sizes[i];
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(pngBuffers[i].length, 8); // Size of image data
    entry.writeUInt32LE(offsets[i], 12); // Offset to image data
    parts.push(entry);
  }

  // Add PNG data
  for (const buf of pngBuffers) {
    parts.push(buf);
  }

  // Write ICO file
  const ico = Buffer.concat(parts);
  const icoPath = path.join(outputDir, 'icon.ico');
  fs.writeFileSync(icoPath, ico);
  console.log(`Generated: icon.ico (${ico.length} bytes)`);
}

generateIcons().catch(console.error);