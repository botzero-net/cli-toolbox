#!/usr/bin/env node

/**
 * JSON Formatter CLI
 * A command-line tool to pretty-print, validate, and colorize JSON files.
 * 
 * Usage: node jsonfmt.js <file.json> [options]
 * 
 * Features:
 * - Pretty-prints JSON with customizable indentation
 * - Validates JSON syntax and reports errors
 * - Colorizes output for better readability
 * - Supports reading from stdin
 * - Can output to file or stdout
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// JSON token types for syntax highlighting
const TOKEN_COLORS = {
  string: COLORS.green,
  number: COLORS.yellow,
  boolean: COLORS.magenta,
  null: COLORS.magenta,
  key: COLORS.cyan,
  punctuation: COLORS.white,
  default: COLORS.reset
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    indent: 2,
    color: true,
    compact: false,
    output: null,
    sort: false,
    check: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg === '--version' || arg === '-v') {
      console.log('jsonfmt v1.0.0');
      process.exit(0);
    } else if (arg === '--no-color') {
      options.color = false;
    } else if (arg === '--compact' || arg === '-c') {
      options.compact = true;
    } else if (arg === '--sort' || arg === '-s') {
      options.sort = true;
    } else if (arg === '--check') {
      options.check = true;
    } else if (arg === '--indent' || arg === '-i') {
      options.indent = parseInt(args[++i]) || 2;
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (!arg.startsWith('-')) {
      options.file = arg;
    }
  }

  return options;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${COLORS.cyan}JSON Formatter CLI${COLORS.reset}

Usage: jsonfmt <file.json> [options]
       cat file.json | jsonfmt [options]

Options:
  -h, --help          Show this help message
  -v, --version       Show version
  -i, --indent <n>    Indentation spaces (default: 2)
  -c, --compact       Output compact JSON (no whitespace)
  -s, --sort          Sort object keys alphabetically
  --no-color          Disable colorized output
  --check             Only validate, don't format
  -o, --output <file> Write output to file

Examples:
  jsonfmt data.json                    # Pretty-print to stdout
  jsonfmt data.json -o formatted.json  # Save to file
  jsonfmt data.json --indent 4         # Use 4-space indentation
  jsonfmt data.json -c                 # Compact output
  cat data.json | jsonfmt              # Read from stdin
  jsonfmt data.json --check            # Validate only
`);
}

/**
 * Read input from file or stdin
 */
async function readInput(file) {
  if (file) {
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }
    return fs.readFileSync(file, 'utf-8');
  }

  // Read from stdin
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

/**
 * Validate and parse JSON
 */
function parseJSON(input, filename = 'input') {
  try {
    return JSON.parse(input);
  } catch (error) {
    // Enhanced error reporting
    const match = error.message.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1]);
      const lines = input.substring(0, pos).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      // Show context
      const lines_arr = input.split('\n');
      const contextStart = Math.max(0, line - 2);
      const contextEnd = Math.min(lines_arr.length, line + 1);
      
      let context = '';
      for (let i = contextStart; i < contextEnd; i++) {
        const lineNum = i + 1;
        const marker = lineNum === line ? '>' : ' ';
        context += `${marker} ${lineNum.toString().padStart(3)}: ${lines_arr[i]}\n`;
        if (lineNum === line) {
          context += `      ${' '.repeat(column - 1)}${COLORS.red}^${COLORS.reset}\n`;
        }
      }
      
      throw new Error(
        `Invalid JSON in ${filename}\n` +
        `${COLORS.red}Error: ${error.message}${COLORS.reset}\n` +
        ` at line ${line}, column ${column}\n\n` +
        `Context:\n${context}`
      );
    }
    throw error;
  }
}

/**
 * Colorize JSON string
 */
function colorizeJSON(jsonStr) {
  // Simple tokenizer for colorization
  let result = '';
  let i = 0;
  let inString = false;
  let stringChar = '';
  let escaped = false;
  let isKey = false;

  while (i < jsonStr.length) {
    const char = jsonStr[i];

    if (inString) {
      if (escaped) {
        result += char;
        escaped = false;
      } else if (char === '\\') {
        result += char;
        escaped = true;
      } else if (char === stringChar) {
        result += char;
        inString = false;
        // Check if this string was a key
        const nextNonSpace = jsonStr.slice(i + 1).match(/^\s*/)[0].length;
        const nextChar = jsonStr[i + 1 + nextNonSpace];
        if (nextChar === ':') {
          isKey = true;
        }
        result += isKey ? TOKEN_COLORS.key : TOKEN_COLORS.string;
        result += COLORS.reset;
        isKey = false;
      } else {
        result += char;
      }
    } else {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        result += TOKEN_COLORS.string + char;
      } else if (/[0-9-]/.test(char)) {
        // Number
        let num = char;
        i++;
        while (i < jsonStr.length && /[0-9.eE+-]/.test(jsonStr[i])) {
          num += jsonStr[i];
          i++;
        }
        result += TOKEN_COLORS.number + num + COLORS.reset;
        continue;
      } else if (/[a-z]/.test(char)) {
        // true, false, null
        let word = char;
        i++;
        while (i < jsonStr.length && /[a-z]/.test(jsonStr[i])) {
          word += jsonStr[i];
          i++;
        }
        if (['true', 'false'].includes(word)) {
          result += TOKEN_COLORS.boolean + word + COLORS.reset;
        } else if (word === 'null') {
          result += TOKEN_COLORS.null + word + COLORS.reset;
        } else {
          result += word;
        }
        continue;
      } else if ('[]{},:'.includes(char)) {
        result += TOKEN_COLORS.punctuation + char + COLORS.reset;
      } else {
        result += char;
      }
    }
    i++;
  }

  return result;
}

/**
 * Sort object keys recursively
 */
function sortKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  } else if (obj !== null && typeof obj === 'object') {
    const sorted = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortKeys(obj[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  try {
    // Read input
    const input = await readInput(options.file);
    
    if (!input.trim()) {
      throw new Error('No input provided');
    }

    // Parse JSON
    let data = parseJSON(input, options.file || 'stdin');

    // Check mode - only validate
    if (options.check) {
      const filename = options.file || 'stdin';
      console.log(`${COLORS.green}✓ Valid JSON${COLORS.reset} (${filename})`);
      
      // Print stats
      const stats = {
        arrays: JSON.stringify(data).match(/\[/g)?.length || 0,
        objects: JSON.stringify(data).match(/{/g)?.length || 0,
        strings: JSON.stringify(data).match(/"[^"]*"/g)?.length || 0,
        numbers: JSON.stringify(data).match(/-?\d+\.?\d*/g)?.length || 0
      };
      
      console.log(`  Objects: ${stats.objects}, Arrays: ${stats.arrays}`);
      console.log(`  Strings: ${stats.strings}, Numbers: ${stats.numbers}`);
      process.exit(0);
    }

    // Sort keys if requested
    if (options.sort) {
      data = sortKeys(data);
    }

    // Format JSON
    const indent = options.compact ? 0 : options.indent;
    let output = JSON.stringify(data, null, indent);

    // Colorize if enabled and outputting to terminal
    if (options.color && process.stdout.isTTY && !options.output) {
      output = colorizeJSON(output);
    }

    // Output result
    if (options.output) {
      fs.writeFileSync(options.output, JSON.stringify(data, null, indent), 'utf-8');
      console.log(`${COLORS.green}✓ Formatted JSON saved to ${options.output}${COLORS.reset}`);
    } else {
      console.log(output);
    }

  } catch (error) {
    console.error(`${COLORS.red}Error: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseJSON, colorizeJSON, sortKeys };
