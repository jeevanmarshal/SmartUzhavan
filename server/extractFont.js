const fs = require('fs');
const path = require('path');

// Extract Base64 from the frontend asset
// Note: Since I don't have a direct 'require' for frontend ESM, I'll read it as text
const assetPath = path.join(__dirname, '..', 'src', 'assets', 'fonts', 'vfs_fonts.js');
const targetPath = path.join(__dirname, 'fonts', 'NotoSansTamil.ttf');

try {
    const content = fs.readFileSync(assetPath, 'utf8');
    // Extract the string between double quotes after the key
    const match = content.match(/"NotoSansTamil-Regular\.ttf":\s*"([^"]+)"/);
    
    if (match && match[1]) {
        const base64 = match[1];
        const buffer = Buffer.from(base64, 'base64');
        fs.writeFileSync(targetPath, buffer);
        console.log('Successfully extracted Tamil font to', targetPath);
        console.log('Font size:', buffer.length, 'bytes');
    } else {
        console.error('Could not find font Base64 in', assetPath);
    }
} catch (error) {
    console.error('Error extracting font:', error.message);
}
