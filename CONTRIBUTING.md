# Contributing Guide

Thank you for your interest in extending these projects! This guide will help you understand the codebase and how to add new features.

## Project Structure

```
projects/
├── jsonfmt.js      # JSON Formatter CLI
├── passgen.js      # Password Generator CLI
├── httpcheck.js    # HTTP Status Checker CLI
├── organize.js     # File Organizer CLI
├── qrgen.html      # QR Code Generator (Web)
├── base64.html     # Base64 Converter (Web)
├── palette.html    # Color Palette Generator (Web)
├── regex.html      # Regex Tester (Web)
├── README.md       # Project documentation
└── CONTRIBUTING.md # This file
```

## Code Style Guidelines

### CLI Tools (Node.js)

**Structure:**
```javascript
#!/usr/bin/env node

/**
 * File Header Comment
 * Brief description of what the tool does
 */

const fs = require('fs');
// Built-in modules only - no external dependencies

// Constants
const COLORS = { /* ... */ };

// Helper functions
function helper1() { }
function helper2() { }

// Main functionality
function main() { }

// Export for testing (optional)
module.exports = { helper1, helper2 };

// Run if called directly
if (require.main === module) {
  main();
}
```

**Key Principles:**
1. **No external dependencies** - Use only Node.js built-in modules
2. **Color constants** - Use the COLORS object for terminal colors
3. **Help text** - Include comprehensive --help documentation
4. **Error handling** - Always catch and display user-friendly errors
5. **Exit codes** - Use process.exit(0) for success, process.exit(1) for errors

### Web Applications (HTML/CSS/JS)

**Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <!-- Single file - no external CSS/JS files -->
  <style>
    /* All styles inline */
  </style>
</head>
<body>
  <!-- HTML structure -->
  
  <script>
    // All JavaScript inline
    // Organized into sections:
    // 1. State variables
    // 2. Utility functions
    // 3. Feature functions
    // 4. Event handlers
    // 5. Initialization
  </script>
</body>
</html>
```

**Key Principles:**
1. **Single file** - Each app is self-contained in one HTML file
2. **CDN libraries** - External libraries via CDN (qrcode.js, jsQR, etc.)
3. **Modern CSS** - Use flexbox/grid, CSS variables, transitions
4. **Responsive** - Mobile-friendly with media queries
5. **Accessibility** - Proper labels, focus states, ARIA where needed

## How to Extend

### Adding a Feature to CLI Tools

1. **Parse arguments** - Add to `parseArgs()` function
2. **Add help text** - Update `showHelp()` with new option
3. **Implement logic** - Create new function for the feature
4. **Integrate** - Call from `main()` or appropriate place
5. **Test** - Run with various inputs and edge cases

Example - adding a new flag to jsonfmt.js:
```javascript
// In parseArgs()
} else if (arg === '--minify' || arg === '-m') {
  options.minify = true;
}

// In main()
if (options.minify) {
  output = JSON.stringify(data); // No whitespace
}
```

### Adding a Feature to Web Apps

1. **HTML** - Add new elements to the markup
2. **CSS** - Style with existing design system (colors, spacing)
3. **JavaScript** - Add event listeners and handler functions
4. **Test** - Check in multiple browsers

Example - adding a new button to qrgen.html:
```javascript
// Add button to HTML
<button class="btn" onclick="newFeature()">New Feature</button>

// Add handler function
function newFeature() {
  // Implementation
  showToast('Feature activated!');
}
```

## Common Patterns

### CLI Tools

**Argument Parsing:**
```javascript
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { /* defaults */ };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--option') {
      options.option = args[++i];
    }
  }
  return options;
}
```

**Reading Files:**
```javascript
async function readInput(file) {
  if (file) {
    return fs.readFileSync(file, 'utf-8');
  }
  // Read from stdin
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}
```

**Color Output:**
```javascript
const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  reset: '\x1b[0m'
};

console.log(`${COLORS.green}Success!${COLORS.reset}`);
```

### Web Apps

**State Management:**
```javascript
let state = {
  currentValue: null,
  history: []
};

function updateState(newValue) {
  state.currentValue = newValue;
  state.history.push(newValue);
  localStorage.setItem('appState', JSON.stringify(state));
}
```

**Toast Notifications:**
```javascript
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
```

**Copy to Clipboard:**
```javascript
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied!');
  } catch (err) {
    showToast('Failed to copy');
  }
}
```

## Testing

### CLI Testing

Test manually with various inputs:
```bash
# Test with valid input
node jsonfmt.js test.json

# Test with invalid input
node jsonfmt.js invalid.json

# Test edge cases
node jsonfmt.js empty.json
node jsonfmt.js --help
node jsonfmt.js --version
```

### Web App Testing

1. Open in Chrome, Firefox, Safari
2. Test responsive design (resize window)
3. Test on mobile (or mobile emulator)
4. Check console for errors
5. Test all interactive features

## Adding a New Project

Want to add a 9th project? Follow these steps:

1. **Choose type** - CLI or Web
2. **Name it** - Descriptive, lowercase, no spaces
3. **Create file** - `projectname.js` or `projectname.html`
4. **Follow template** - Use existing projects as reference
5. **Add to README** - Update the projects table
6. **Document** - Add usage examples

### New CLI Project Template

```javascript
#!/usr/bin/env node

/**
 * Project Name
 * Brief description
 */

const fs = require('fs');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m'
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  // Parse arguments
  return options;
}

function showHelp() {
  console.log(`
Usage: projectname [options]

Options:
  -h, --help    Show help
`);
}

async function main() {
  const options = parseArgs();
  // Implementation
}

if (require.main === module) {
  main();
}

module.exports = { main };
```

### New Web Project Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Name</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f7;
      min-height: 100vh;
      padding: 20px;
    }
    /* Add styles */
  </style>
</head>
<body>
  <!-- HTML content -->
  
  <script>
    // JavaScript functionality
    function init() {
      // Initialize
    }
    init();
  </script>
</body>
</html>
```

## Design Guidelines

### Color Scheme

Use consistent colors across projects:
- Primary: `#667eea` (purple-blue)
- Secondary: `#764ba2` (purple)
- Success: `#28a745` (green)
- Error: `#dc3545` (red)
- Warning: `#ffc107` (yellow)

### Typography

- Font family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Monospace: `'Monaco', 'Menlo', 'Ubuntu Mono', monospace`

### Spacing

- Base unit: 8px
- Small: 8px
- Medium: 16px
- Large: 24px
- XLarge: 32px

## Questions?

If you're unsure about anything:
1. Look at existing projects for examples
2. Follow the existing code style
3. Keep it simple and focused
4. Test thoroughly

## Pull Request Checklist

Before submitting changes:
- [ ] Code follows style guidelines
- [ ] All features tested manually
- [ ] Help text updated (for CLI)
- [ ] README updated with new features
- [ ] No external dependencies added (for CLI)
- [ ] Works in major browsers (for Web)

---

**Thank you for contributing!** 🎉
