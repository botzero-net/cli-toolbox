# Programming Projects Portfolio

A collection of practical, well-crafted programming projects showcasing different skills and technologies.

## Projects Overview

### CLI Tools (Node.js)

| Project | File | Description | Skills |
|---------|------|-------------|--------|
| **JSON Formatter** | `jsonfmt.js` | Pretty-print, validate, and colorize JSON files | CLI, File I/O, Syntax Highlighting |
| **Password Generator** | `passgen.js` | Generate secure passwords with strength checking | Security, Cryptography, CLI |
| **HTTP Status Checker** | `httpcheck.js` | Check website status, response times, redirects | HTTP, Async, Concurrency |
| **File Organizer** | `organize.js` | Sort files by extension with undo support | File System, Transactions |

### Web Applications (HTML/CSS/JS)

| Project | File | Description | Skills |
|---------|------|-------------|--------|
| **QR Code Generator** | `qrgen.html` | Generate and scan QR codes | Canvas, Camera API, QR Codes |
| **Base64 Converter** | `base64.html` | Encode/decode text and files | File API, Drag & Drop, Binary |
| **Color Palette Generator** | `palette.html` | Generate harmonious color schemes | Color Theory, CSS, UI Design |
| **Regex Tester** | `regex.html` | Test and debug regular expressions | Regex, Text Processing, UI |

## Quick Start

### CLI Tools

All CLI tools are standalone Node.js scripts. No dependencies required!

```bash
# Make executable (optional)
chmod +x *.js

# Run any tool
node jsonfmt.js data.json
node passgen.js -l 32
node httpcheck.js https://example.com
node organize.js ./Downloads --dry-run
```

### Web Applications

Simply open the HTML files in any modern browser:

```bash
# Or serve with a simple HTTP server
python3 -m http.server 8000
# Then open http://localhost:8000
```

## Project Details

### 1. JSON Formatter (`jsonfmt.js`)

A powerful JSON formatting tool with syntax highlighting and validation.

**Features:**
- Pretty-print JSON with customizable indentation
- Syntax validation with detailed error reporting
- Colorized terminal output
- Sort object keys
- Read from files or stdin
- Dry-run mode

**Usage:**
```bash
node jsonfmt.js data.json                    # Pretty-print to stdout
node jsonfmt.js data.json -o formatted.json  # Save to file
node jsonfmt.js data.json --indent 4         # 4-space indentation
node jsonfmt.js data.json --check            # Validate only
cat data.json | node jsonfmt.js              # Read from stdin
```

### 2. Password Generator (`passgen.js`)

Generate secure, random passwords with entropy-based strength estimation.

**Features:**
- Cryptographically secure random generation
- Configurable length and character sets
- Password strength estimation (entropy-based)
- Pronounceable password mode
- Passphrase generation (diceware-style)
- Copy to clipboard

**Usage:**
```bash
node passgen.js                    # Generate 16-char password
node passgen.js -l 32              # 32 characters
node passgen.js -c 5               # Generate 5 passwords
node passgen.js --passphrase -w 6  # 6-word passphrase
node passgen.js -l 20 -C           # Copy to clipboard
```

### 3. HTTP Status Checker (`httpcheck.js`)

Monitor website uptime and performance with concurrent checking.

**Features:**
- Check single or multiple URLs
- Measure response times
- Follow redirects (configurable)
- Bulk checking from file
- Export to JSON/CSV
- Concurrent requests
- Custom headers and methods

**Usage:**
```bash
node httpcheck.js https://example.com
node httpcheck.js -f urls.txt
node httpcheck.js https://api.example.com -m POST -H "Authorization: Bearer token"
node httpcheck.js -f urls.txt --format json -o results.json
```

### 4. File Organizer (`organize.js`)

Keep your downloads folder tidy with smart file organization.

**Features:**
- Sort files by extension into categories
- 9 built-in categories (Images, Documents, Code, etc.)
- Dry-run mode to preview changes
- Undo capability with transaction log
- Recursive directory processing
- Size-based filtering
- Date-based sorting

**Usage:**
```bash
node organize.js ./Downloads
node organize.js ./Downloads -d              # Dry run
node organize.js ./Downloads -r              # Recursive
node organize.js ./Downloads --undo          # Undo last operation
node organize.js ./Downloads --min-size 1MB  # Only files > 1MB
```

### 5. QR Code Generator (`qrgen.html`)

Create and scan QR codes right in your browser.

**Features:**
- Generate QR codes from text/URLs
- Customize size, colors, error correction
- Download as PNG or SVG
- Scan from camera
- History of generated codes
- Local storage persistence

**Open in browser and:**
- Enter text to generate QR codes instantly
- Click colors to customize appearance
- Use camera tab to scan existing codes
- Access history of previously generated codes

### 6. Base64 Converter (`base64.html`)

Encode and decode Base64 text and files with an intuitive interface.

**Features:**
- Real-time text encoding/decoding
- File upload with drag & drop
- URL-safe Base64 option
- Statistics (size, ratio)
- Copy/paste integration
- Download encoded files

**Usage:**
- Type or paste text for instant conversion
- Drag files onto the drop zone
- Use options for URL-safe encoding
- Copy results with one click

### 7. Color Palette Generator (`palette.html`)

Create beautiful, harmonious color schemes for your projects.

**Features:**
- 6 harmony types (analogous, triadic, complementary, etc.)
- Live preview on mock UI
- Export to CSS/JSON/SCSS
- Save palettes to local storage
- Color information (hex, RGB)
- One-click copy

**Usage:**
- Click "Generate" for random palettes
- Select harmony type for specific schemes
- Preview how colors work together
- Export for use in your projects

### 8. Regex Tester (`regex.html`)

Test, debug, and learn regular expressions with visual feedback.

**Features:**
- Real-time pattern matching
- Highlighted matches in test text
- Capture group display
- Replace functionality
- 12 common pattern presets
- Flags support (g, i, m, s, u)
- Match statistics

**Usage:**
- Enter regex pattern with optional flags
- Type test text to see matches
- Click pattern library for common regexes
- Use replace field for substitution

## Technical Highlights

### Code Quality
- Clean, commented code
- Consistent error handling
- Modular design where applicable
- No external dependencies for CLI tools

### Browser Apps
- Modern ES6+ JavaScript
- Responsive design
- Local storage for persistence
- Clipboard API integration
- File API for drag & drop

### CLI Tools
- Pure Node.js (no npm packages)
- Proper argument parsing
- Help documentation
- Exit codes for scripting
- stdin/stdout support

## Browser Compatibility

Web applications work in all modern browsers:
- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers (iOS Safari, Chrome Android)

## Node.js Version

CLI tools require Node.js 12 or higher.

## License

MIT License - feel free to use, modify, and distribute!

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on extending these projects.

---

**Happy coding!** 🚀
