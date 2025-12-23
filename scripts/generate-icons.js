const fs = require('fs');
const path = require('path');

// Simple icon generator for PWA
// This creates basic placeholder icons

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons for different sizes
sizes.forEach(size => {
  const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#000000"/>
  <circle cx="${size/2}" cy="${size/2}" r="${Math.round(size * 0.28)}" stroke="white" stroke-width="${Math.round(size * 0.028)}" fill="none"/>
  <path d="M${Math.round(size * 0.25)} ${size/2}L${Math.round(size * 0.42)} ${Math.round(size * 0.67)}L${Math.round(size * 0.75)} ${Math.round(size * 0.33)}" stroke="white" stroke-width="${Math.round(size * 0.042)}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Generated: icon-${size}x${size}.svg`);
});

// Create a simple HTML file to convert SVG to PNG manually
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Icon Converter</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .icon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .icon-item { text-align: center; border: 1px solid #ddd; padding: 10px; }
    svg { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>PWA Icons</h1>
  <p>Right-click on each icon and save as PNG with the corresponding filename.</p>
  <div class="icon-grid">
    ${sizes.map(size => `
    <div class="icon-item">
      <h3>icon-${size}x${size}.png</h3>
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#000000"/>
        <circle cx="${size/2}" cy="${size/2}" r="${Math.round(size * 0.28)}" stroke="white" stroke-width="${Math.round(size * 0.028)}" fill="none"/>
        <path d="M${Math.round(size * 0.25)} ${size/2}L${Math.round(size * 0.42)} ${Math.round(size * 0.67)}L${Math.round(size * 0.75)} ${Math.round(size * 0.33)}" stroke="white" stroke-width="${Math.round(size * 0.042)}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>`).join('')}
  </div>
</body>
</html>`;

const htmlPath = path.join(iconsDir, 'icon-converter.html');
fs.writeFileSync(htmlPath, htmlContent);
console.log('Generated: icon-converter.html');
console.log('\nTo generate PNG icons:');
console.log('1. Open public/icons/icon-converter.html in a browser');
console.log('2. Right-click each icon and save as PNG with the corresponding filename');
console.log('3. Or use a tool like Inkscape or online SVG to PNG converter');

console.log('\nIcon generation complete!');