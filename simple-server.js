#!/usr/bin/env node

/**
 * Simple HTTP Server
 * 
 * A dead-simple HTTP server with file upload support.
 * Perfect for quick file sharing, testing, or local development.
 * 
 * Usage:
 *   simple-server                    # Serve current directory on port 8080
 *   simple-server -p 3000            # Custom port
 *   simple-server -d ./public        # Serve specific directory
 *   simple-server --upload           # Enable file uploads
 *   simple-server --cors             # Enable CORS for API testing
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateDirectoryListing(dirPath, urlPath) {
  const files = fs.readdirSync(dirPath);
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>Index of ${urlPath}</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    tr:hover { background: #f5f5f5; }
    a { text-decoration: none; color: #0066cc; }
    a:hover { text-decoration: underline; }
    .size { text-align: right; color: #666; }
    .upload-zone { border: 2px dashed #ccc; padding: 40px; text-align: center; margin: 20px 0; border-radius: 8px; }
    .upload-zone.dragover { background: #f0f8ff; border-color: #0066cc; }
  </style>
</head>
<body>
  <h1>Index of ${urlPath}</h1>
  <table>
    <tr><th>Name</th><th class="size">Size</th><th>Modified</th></tr>
    <tr><td><a href="..">📁 ..</a></td><td class="size">-</td><td>-</td></tr>`;
  
  for (const file of files.sort()) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    const isDir = stat.isDirectory();
    const icon = isDir ? '📁' : '📄';
    const size = isDir ? '-' : formatSize(stat.size);
    const mtime = stat.mtime.toLocaleString();
    
    html += `<tr><td><a href="${encodeURIComponent(file)}${isDir ? '/' : ''}">${icon} ${file}</a></td><td class="size">${size}</td><td>${mtime}</td></tr>`;
  }
  
  html += `</table>`;
  
  // Upload form
  html += `
  <div class="upload-zone" id="dropzone">
    <h3>📤 Upload Files</h3>
    <p>Drag & drop files here or click to select</p>
    <input type="file" id="fileInput" multiple style="display: none;">
    <button onclick="document.getElementById('fileInput').click()">Select Files</button>
    <div id="status"></div>
  </div>
  <script>
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const status = document.getElementById('status');
    
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      uploadFiles(e.dataTransfer.files);
    });
    
    fileInput.addEventListener('change', (e) => {
      uploadFiles(e.target.files);
    });
    
    async function uploadFiles(files) {
      status.innerHTML = '<p>Uploading...</p>';
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const response = await fetch('/', { method: 'POST', body: formData });
          if (response.ok) {
            status.innerHTML += '<p style="color: green;">✓ ' + file.name + '</p>';
          } else {
            status.innerHTML += '<p style="color: red;">✗ ' + file.name + '</p>';
          }
        } catch (err) {
          status.innerHTML += '<p style="color: red;">✗ ' + file.name + ': ' + err.message + '</p>';
        }
      }
      
      setTimeout(() => location.reload(), 1000);
    }
  </script>
</body>
</html>`;
  
  return html;
}

function showHelp() {
  console.log(`
Simple HTTP Server

A dead-simple HTTP server with file upload support.

Usage:
  simple-server [options]

Options:
  -p, --port <number>     Port to listen on (default: 8080)
  -d, --directory <path>  Directory to serve (default: current)
  --upload                Enable file uploads
  --cors                  Enable CORS headers
  -h, --help              Show this help

Examples:
  simple-server                    # Serve current directory
  simple-server -p 3000            # Use port 3000
  simple-server -d ./public        # Serve public folder
  simple-server --upload           # Allow file uploads

Features:
  ✓ Directory listing with file sizes
  ✓ Drag & drop file upload
  ✓ Mobile-friendly interface
  ✓ CORS support for API testing
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    return;
  }
  
  let port = 8080;
  let directory = process.cwd();
  let uploadEnabled = false;
  let corsEnabled = false;
  
  // Parse args
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if ((arg === '-p' || arg === '--port') && args[i + 1]) {
      port = parseInt(args[++i]);
    } else if ((arg === '-d' || arg === '--directory') && args[i + 1]) {
      directory = path.resolve(args[++i]);
    } else if (arg === '--upload') {
      uploadEnabled = true;
    } else if (arg === '--cors') {
      corsEnabled = true;
    }
  }
  
  // Validate directory
  if (!fs.existsSync(directory)) {
    console.error(`Error: Directory not found: ${directory}`);
    process.exit(1);
  }
  
  if (!fs.statSync(directory).isDirectory()) {
    console.error(`Error: Not a directory: ${directory}`);
    process.exit(1);
  }
  
  const server = http.createServer((req, res) => {
    // CORS headers
    if (corsEnabled) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    const urlPath = decodeURIComponent(req.url);
    const filePath = path.join(directory, urlPath);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(directory)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    
    // Handle file upload
    if (req.method === 'POST' && uploadEnabled) {
      let body = Buffer.alloc(0);
      
      req.on('data', chunk => {
        body = Buffer.concat([body, chunk]);
      });
      
      req.on('end', () => {
        // Parse multipart form data (simplified)
        const contentType = req.headers['content-type'];
        if (contentType && contentType.includes('multipart/form-data')) {
          const boundary = contentType.split('boundary=')[1];
          const parts = body.toString().split(`--${boundary}`);
          
          for (const part of parts) {
            if (part.includes('filename=')) {
              const filenameMatch = part.match(/filename="([^"]+)"/);
              if (filenameMatch) {
                const filename = filenameMatch[1];
                const dataStart = part.indexOf('\r\n\r\n') + 4;
                const dataEnd = part.lastIndexOf('\r\n');
                const fileData = body.slice(
                  body.indexOf(Buffer.from(part.slice(0, dataStart))) + dataStart,
                  body.indexOf(Buffer.from(part.slice(0, dataEnd))) + dataEnd
                );
                
                fs.writeFileSync(path.join(directory, filename), fileData);
                console.log(`${COLORS.green}Uploaded: ${filename}${COLORS.reset}`);
              }
            }
          }
        }
        
        res.writeHead(200);
        res.end('OK');
      });
      
      return;
    }
    
    // Serve file or directory
    try {
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Try index.html first
        const indexPath = path.join(filePath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.setHeader('Content-Type', 'text/html');
          res.writeHead(200);
          res.end(fs.readFileSync(indexPath));
        } else {
          // Generate directory listing
          res.setHeader('Content-Type', 'text/html');
          res.writeHead(200);
          res.end(generateDirectoryListing(filePath, urlPath));
        }
      } else {
        // Serve file
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.pdf': 'application/pdf'
        };
        
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.writeHead(200);
        res.end(fs.readFileSync(filePath));
      }
    } catch (err) {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  
  server.listen(port, () => {
    const localIP = getLocalIP();
    
    console.log('');
    console.log(`${COLORS.green}🚀 Server running!${COLORS.reset}`);
    console.log('');
    console.log(`  Local:   http://localhost:${port}`);
    console.log(`  Network: http://${localIP}:${port}`);
    console.log('');
    console.log(`  Serving: ${directory}`);
    console.log(`  Uploads: ${uploadEnabled ? 'enabled' : 'disabled'}`);
    console.log(`  CORS:    ${corsEnabled ? 'enabled' : 'disabled'}`);
    console.log('');
    console.log(`${COLORS.yellow}Press Ctrl+C to stop${COLORS.reset}`);
    console.log('');
  });
}

main();
