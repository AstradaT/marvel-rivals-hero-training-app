const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Target the main assets folder where your heavy webp files are
const inputDir = './assets';
const outputDir = './assets_optimized';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

async function processAnimations() {
    const files = fs.readdirSync(inputDir);

    for (const file of files) {
        if (path.extname(file).toLowerCase() === '.webp') {
            const inputPath = path.join(inputDir, file);
            const outputPath = path.join(outputDir, file);

            console.log(`Processing animation: ${file}...`);

            try {
                // 1. Read metadata to analyze the frames
                const metadata = await sharp(inputPath).metadata();
                
                // 30 FPS means each frame lasts roughly 33ms (1000ms / 30)
                // We map an array of delays to force a stable frame pacing
                const totalFrames = metadata.pages || 1;
                const fps30Delays = Array(totalFrames).fill(33); 

                // 2. Run the compression with clamped dimensions and 30 FPS timing
                await sharp(inputPath, { animated: true })
                    .resize(350, 350) 
                    .webp({ 
                        quality: 80,
                        effort: 4,
                        smartSubsample: true,
                        delay: fps30Delays // Forces the frame playback rate to 30 FPS
                    })
                    .toFile(outputPath);

                console.log(`✅ Successfully crushed to 30 FPS: ${file} (Saved in ${outputDir})`);

            } catch (err) {
                console.error(`❌ Error compressing ${file}:`, err.message);
            }
        }
    }
    console.log("\n🎉 All files processed! Check the 'assets_optimized' folder.");
}

processAnimations();