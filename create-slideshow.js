const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'public', 'screenshots');
const OUTPUT_PATH = path.join(SCREENSHOTS_DIR, 'slideshow.gif');

async function createSlideshow() {
  const screenshots = [
    'dashboard.png',
    'workout.png', 
    'exercise-detail.png',
    'coach.png',
    'settings.png'
  ];

  const gif = GIFEncoder();

  for (const screenshot of screenshots) {
    const imagePath = path.join(SCREENSHOTS_DIR, screenshot);
    if (!fs.existsSync(imagePath)) {
      console.log(`Skipping ${screenshot} - not found`);
      continue;
    }

    const imageData = fs.readFileSync(imagePath);
    const { createCanvas, loadImage } = require('canvas');
    const canvas = createCanvas(1280, 800);
    const ctx = canvas.getContext('2d');
    
    const img = await loadImage(imageData);
    ctx.drawImage(img, 0, 0, 1280, 800);
    
    const { data } = ctx.getImageData(0, 0, 1280, 800);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    
    gif.writeFrame(index, 1280, 800, {
      palette,
      delay: 2500,
      repeat: 0
    });
    console.log(`Added ${screenshot} to slideshow`);
  }

  gif.finish();
  fs.writeFileSync(OUTPUT_PATH, gif.bytes());
  console.log(`\n✅ Slideshow GIF created: ${OUTPUT_PATH}`);
}

createSlideshow().catch(console.error);
