# 🧰 CLI Toolbox

> A curated collection of handy CLI tools and web utilities for developers. No bloat, no dependencies (where possible), just tools that solve real problems.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0-brightgreen.svg)

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/botzero-net/cli-toolbox.git
cd cli-toolbox

# Make CLI tools executable
chmod +x *.js

# Use any tool
./jsonfmt.js data.json
./passgen.js --length 20
```

## 🛠️ Tools Included

### CLI Tools (Node.js)

#### 📋 JSON Formatter (`jsonfmt.js`)
Pretty-print and validate JSON files. Makes ugly JSON readable.

```bash
# Format a file
./jsonfmt.js messy.json > pretty.json

# Validate from stdin
cat data.json | ./jsonfmt.js

# Check if valid (exit code 0 = valid, 1 = invalid)
./jsonfmt.js --check data.json && echo "Valid JSON" || echo "Invalid JSON"
```

**Why use it:**
- Pipe-friendly (works with stdin/stdout)
- Validates syntax (catches errors)
- Colorized output (when TTY detected)
- Preserves large numbers (no floating point issues)

**Screenshot:**
```bash
$ ./jsonfmt.js config.json
{
  "server": {
    "host": "localhost",
    "port": 8080,
    "ssl": true
  },
  "database": {
    "url": "postgres://localhost/myapp",
    "pool": 10
  }
}
```

---

#### 🔐 Password Generator (`passgen.js`)
Generate secure passwords with strength analysis.

```bash
# Generate password (default 16 chars)
./passgen.js

# Specify length
./passgen.js --length 32

# Include only specific character types
./passgen.js --length 20 --no-symbols

# Generate multiple passwords
./passgen.js --count 5
```

**Features:**
- Entropy calculation (bits of randomness)
- Crack time estimation
- Character type requirements
- Copy to clipboard (with `xclip` or `pbcopy`)

**Screenshot:**
```bash
$ ./passgen.js --length 20

Generated Passwords:

k9#mP2$vLq8@nX5&bJ7!
   Strength: Very Strong (entropy: ~131 bits, crack time: centuries)
   ✓ length  ✓ lowercase  ✓ uppercase  ✓ numbers  ✓ symbols  ✓ unique
```

---

#### 🌐 HTTP Status Checker (`httpcheck.js`)
Check if websites are up, measure response times, follow redirects.

```bash
# Check single URL
./httpcheck.js https://example.com

# Multiple URLs
./httpcheck.js https://google.com https://github.com https://stackoverflow.com

# From file
./httpcheck.js --file urls.txt

# With timeout (default 10s)
./httpcheck.js https://slow-site.com --timeout 30000

# Export to JSON
./httpcheck.js --file urls.txt --format json -o results.json
```

**Features:**
- Concurrent checking (default 5 at a time)
- Follows redirects (configurable)
- Response time measurement
- Custom headers support
- Retry on failure
- Multiple output formats (table, JSON, CSV)

**Screenshot:**
```bash
$ ./httpcheck.js https://httpbin.org/status/200 https://httpbin.org/status/404

URL                           Status  Time    Size   
─────────────────────────────────────────────────────
https://httpbin.org/status/200  200 OK    245ms   0 B   
https://httpbin.org/status/404  404 Not Found  189ms   0 B   

2 URLs checked in 0.5s
```

---

#### 📁 File Organizer (`organize.js`)
Sort files by extension into folders. Clean up your Downloads folder!

```bash
# Organize current directory
./organize.js

# Organize specific directory
./organize.js ~/Downloads

# Dry run (see what would happen)
./organize.js ~/Downloads --dry-run

# Include pattern (only these files)
./organize.js ~/Downloads --include "*.pdf,*.doc"

# Exclude pattern (skip these files)
./organize.js ~/Downloads --exclude "*.tmp,*.log"
```

**Organization scheme:**
- `Images/` - jpg, png, gif, webp, svg
- `Documents/` - pdf, doc, docx, txt, md
- `Archives/` - zip, tar, gz, rar, 7z
- `Videos/` - mp4, avi, mkv, mov
- `Audio/` - mp3, wav, flac, ogg
- `Code/` - js, py, html, css, json
- `Other/` - everything else

**Screenshot:**
```bash
$ ./organize.js ~/Downloads --dry-run

[DRY RUN] Would organize:
  vacation.jpg → Images/
  report.pdf → Documents/
  project.zip → Archives/
  song.mp3 → Audio/

5 files would be moved into 4 folders
```

---

### Web Tools (Browser)

#### 📱 QR Code Generator (`qrgen.html`)
Generate QR codes from text or URLs. Download as PNG or SVG.

**Features:**
- Instant generation as you type
- Size customization (100px - 1000px)
- Error correction levels (L, M, Q, H)
- Download PNG or SVG
- Scan from camera (mobile)

**Use cases:**
- WiFi password sharing
- URL shortening alternative
- Business cards
- Event tickets

**Screenshot:** *(Open qrgen.html in browser)*

---

#### 🔤 Base64 Converter (`base64.html`)
Encode/decode Base64. Handle text and binary files.

**Features:**
- Real-time encoding/decoding
- File upload support (drag & drop)
- URL-safe Base64 option
- Character set detection
- Copy to clipboard

**Use cases:**
- Embed images in CSS/HTML
- Encode binary data for JSON
- Decode API responses
- Data URI generation

---

#### 🎨 Color Palette Generator (`palette.html`)
Generate harmonious color schemes for your projects.

**Features:**
- Multiple harmony types (complementary, triadic, analogous, etc.)
- HEX, RGB, HSL output
- Export to CSS/JSON/SCSS
- Preview on mock UI elements
- Accessibility contrast checking

**Use cases:**
- Website/app color schemes
- Brand identity design
- Data visualization palettes
- Terminal color themes

---

#### 🔍 Regex Tester (`regex.html`)
Test regular expressions with real-time matching.

**Features:**
- Real-time match highlighting
- Capture group extraction
- Replace functionality
- Common patterns library (email, phone, URL, etc.)
- Explanation of regex components
- Flags support (g, i, m, s, u)

**Use cases:**
- Debug complex regexes
- Learn regex patterns
- Test before deploying to production
- Extract data from text

---

## 📦 Installation

### Prerequisites
- Node.js 14+ (for CLI tools)
- Modern web browser (for HTML tools)

### Setup
```bash
# Clone repository
git clone https://github.com/botzero-net/cli-toolbox.git

# Enter directory
cd cli-toolbox

# Make CLI tools executable
chmod +x *.js

# (Optional) Add to PATH
export PATH="$PATH:$(pwd)"
```

## 🎯 Why These Tools?

### Philosophy
- **Single purpose:** Each tool does one thing well
- **Zero dependencies:** No `npm install` hell (except dev dependencies)
- **Unix philosophy:** Pipe-friendly, composable
- **Self-documenting:** `--help` on every tool

### For Developers
- **Daily workflow:** Tools you'll actually use every day
- **Scriptable:** Easy to integrate into CI/CD
- **Portable:** Works on macOS, Linux, Windows (WSL)

### For DevOps
- **Monitoring:** HTTP checker for uptime monitoring
- **Security:** Password generation for secrets
- **Automation:** File organizer for log management

## 🔮 Future Plans

### Short Term
- [ ] Add `--clipboard` flag to all CLI tools
- [ ] JSON diff tool (`jsondiff.js`)
- [ ] CSV to JSON converter (`csv2json.js`)
- [ ] JWT decoder (`jwtdecode.js`)
- [ ] Hash generator (`hash.js` - md5, sha256, etc.)

### Long Term
- [ ] Web UI for all CLI tools
- [ ] npm package (`npm install -g cli-toolbox`)
- [ ] Homebrew formula (`brew install cli-toolbox`)
- [ ] VS Code extension

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-tool`)
3. Add your tool (follow existing structure)
4. Update README with documentation
5. Commit and push
6. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Color palette algorithms from [color theory](https://en.wikipedia.org/wiki/Color_theory)
- QR code generation via [qrcode.js](https://github.com/soldair/node-qrcode)
- Regex testing inspired by [regex101](https://regex101.com/)

---

**Made with ⚡ by developers, for developers.**

*Star ⭐ this repo if these tools save you time!*
