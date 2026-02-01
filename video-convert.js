#!/usr/bin/env node

/**
 * Simple Video Converter
 * 
 * A dead-simple wrapper around FFmpeg for common video operations.
 * No complex flags, just common use cases.
 * 
 * Requires: FFmpeg installed (sudo apt install ffmpeg)
 * 
 * Usage:
 *   video-convert input.mp4 output.gif
 *   video-convert input.mp4 output.webm --quality medium
 *   video-convert input.mp4 thumbnail.jpg --time 00:00:05
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function showHelp() {
  console.log(`
${BLUE}Simple Video Converter${RESET}

The easiest way to convert videos. No FFmpeg expertise required.

${YELLOW}Usage:${RESET}
  video-convert <input> <output> [options]

${YELLOW}Examples:${RESET}
  # Convert to GIF (auto-optimized)
  video-convert input.mp4 output.gif

  # Convert to WebM (for web)
  video-convert input.mp4 output.webm --quality medium

  # Extract thumbnail at 5 seconds
  video-convert input.mp4 thumb.jpg --time 00:00:05

  # Convert to MP4 (H.264 for compatibility)
  video-convert input.mov output.mp4

  # Compress video for sharing
  video-convert input.mp4 output-small.mp4 --compress

${YELLOW}Options:${RESET}
  --quality <low|medium|high>   Output quality (default: high)
  --time <HH:MM:SS>            Timestamp for thumbnail extraction
  --compress                   Reduce file size for sharing
  --fps <number>               Frame rate for GIF (default: 15)
  --width <pixels>             Resize width (height auto)
  --help                       Show this help

${YELLOW}Supported Outputs:${RESET}
  .mp4 (H.264) - Best compatibility
  .webm (VP9)  - Best for web
  .gif         - For memes/short clips
  .jpg/.png    - Thumbnail extraction
`);
}

function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function getExtension(filename) {
  return path.extname(filename).toLowerCase();
}

function convertVideo(input, output, options) {
  const ext = getExtension(output);
  const quality = options.quality || 'high';
  
  let command = 'ffmpeg -i "' + input + '" ';
  
  // Common options
  if (options.width) {
    command += `-vf "scale=${options.width}:-1" `;
  }
  
  switch (ext) {
    case '.gif':
      // GIF conversion
      const fps = options.fps || 15;
      const scale = options.width || 480;
      command += `-vf "fps=${fps},scale=${scale}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse" `;
      command += `-loop 0 "${output}"`;
      break;
      
    case '.webm':
      // WebM for web
      const webmQuality = quality === 'low' ? '30' : quality === 'medium' ? '25' : '20';
      command += `-c:v libvpx-vp9 -crf ${webmQuality} -b:v 0 -c:a libopus `;
      if (options.compress) {
        command += `-crf 35 `;
      }
      command += `"${output}"`;
      break;
      
    case '.mp4':
      // MP4 H.264 (most compatible)
      const mp4Quality = quality === 'low' ? '28' : quality === 'medium' ? '23' : '18';
      command += `-c:v libx264 -crf ${mp4Quality} -preset medium -c:a aac -b:a 128k `;
      if (options.compress) {
        command += `-crf 28 -preset slow `;
      }
      command += `-movflags +faststart "${output}"`;
      break;
      
    case '.jpg':
    case '.jpeg':
    case '.png':
      // Thumbnail extraction
      const time = options.time || '00:00:00';
      command += `-ss ${time} -vframes 1 `;
      if (ext === '.png') {
        command += `"${output}"`;
      } else {
        command += `-q:v 2 "${output}"`;
      }
      break;
      
    default:
      // Generic copy
      command += `-c copy "${output}"`;
  }
  
  console.log(`${BLUE}Converting...${RESET}`);
  console.log(`${YELLOW}Command:${RESET} ${command}`);
  console.log('');
  
  try {
    execSync(command, { stdio: 'inherit' });
    
    // Show file sizes
    const inputSize = (fs.statSync(input).size / 1024 / 1024).toFixed(2);
    const outputSize = (fs.statSync(output).size / 1024 / 1024).toFixed(2);
    
    console.log('');
    console.log(`${GREEN}✓ Conversion complete!${RESET}`);
    console.log(`  Input:  ${inputSize} MB`);
    console.log(`  Output: ${outputSize} MB`);
    console.log(`  Saved:  ${(inputSize - outputSize).toFixed(2)} MB`);
    
    return true;
  } catch (error) {
    console.error(`${RED}✗ Conversion failed${RESET}`);
    console.error(error.message);
    return false;
  }
}

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  showHelp();
  process.exit(0);
}

if (!checkFFmpeg()) {
  console.error(`${RED}Error: FFmpeg not found${RESET}`);
  console.error('');
  console.error('Please install FFmpeg:');
  console.error('  Ubuntu/Debian: sudo apt install ffmpeg');
  console.error('  macOS: brew install ffmpeg');
  console.error('  Windows: https://ffmpeg.org/download.html');
  process.exit(1);
}

const input = args[0];
const output = args[1];

if (!input || !output) {
  console.error(`${RED}Error: Input and output files required${RESET}`);
  console.error('Run with --help for usage');
  process.exit(1);
}

if (!fs.existsSync(input)) {
  console.error(`${RED}Error: Input file not found: ${input}${RESET}`);
  process.exit(1);
}

// Parse options
const options = {};
for (let i = 2; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--quality' && args[i + 1]) {
    options.quality = args[++i];
  } else if (arg === '--time' && args[i + 1]) {
    options.time = args[++i];
  } else if (arg === '--fps' && args[i + 1]) {
    options.fps = parseInt(args[++i]);
  } else if (arg === '--width' && args[i + 1]) {
    options.width = parseInt(args[++i]);
  } else if (arg === '--compress') {
    options.compress = true;
  }
}

// Do conversion
convertVideo(input, output, options);
