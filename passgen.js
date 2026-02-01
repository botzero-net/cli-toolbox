#!/usr/bin/env node

/**
 * Password Generator CLI
 * A secure password generator with strength checking and clipboard support.
 * 
 * Usage: node passgen.js [options]
 * 
 * Features:
 * - Generates cryptographically secure passwords
 * - Configurable length and character sets
 * - Password strength estimation (zxcvbn-style)
 * - Copy to clipboard functionality
 * - Generate multiple passwords at once
 */

const crypto = require('crypto');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Character sets
const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ambiguous: '0O1lI',  // Characters to exclude if no-ambiguous flag is set
  extended: '¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿'
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    length: 16,
    count: 1,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
    extended: false,
    noAmbiguous: false,
    exclude: '',
    copy: false,
    pronounceable: false,
    passphrase: false,
    words: 4,
    separator: '-'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg === '--version' || arg === '-v') {
      console.log('passgen v1.0.0');
      process.exit(0);
    } else if (arg === '--length' || arg === '-l') {
      options.length = parseInt(args[++i]) || 16;
    } else if (arg === '--count' || arg === '-c') {
      options.count = parseInt(args[++i]) || 1;
    } else if (arg === '--no-lowercase') {
      options.lowercase = false;
    } else if (arg === '--no-uppercase') {
      options.uppercase = false;
    } else if (arg === '--no-numbers') {
      options.numbers = false;
    } else if (arg === '--no-symbols') {
      options.symbols = false;
    } else if (arg === '--extended') {
      options.extended = true;
    } else if (arg === '--no-ambiguous') {
      options.noAmbiguous = true;
    } else if (arg === '--exclude' || arg === '-e') {
      options.exclude = args[++i] || '';
    } else if (arg === '--copy' || arg === '-C') {
      options.copy = true;
    } else if (arg === '--pronounceable' || arg === '-p') {
      options.pronounceable = true;
    } else if (arg === '--passphrase') {
      options.passphrase = true;
    } else if (arg === '--words' || arg === '-w') {
      options.words = parseInt(args[++i]) || 4;
    } else if (arg === '--separator' || arg === '-s') {
      options.separator = args[++i] || '-';
    }
  }

  return options;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${COLORS.cyan}Password Generator CLI${COLORS.reset}

Usage: passgen [options]

Options:
  -h, --help              Show this help message
  -v, --version           Show version
  -l, --length <n>        Password length (default: 16)
  -c, --count <n>         Number of passwords to generate (default: 1)
  --no-lowercase          Exclude lowercase letters
  --no-uppercase          Exclude uppercase letters
  --no-numbers            Exclude numbers
  --no-symbols            Exclude symbols
  --extended              Include extended ASCII characters
  --no-ambiguous          Exclude ambiguous characters (0, O, 1, l, I)
  -e, --exclude <chars>   Exclude specific characters
  -C, --copy              Copy first password to clipboard
  -p, --pronounceable     Generate pronounceable password
  --passphrase            Generate passphrase (diceware-style)
  -w, --words <n>         Number of words for passphrase (default: 4)
  -s, --separator <char>  Word separator for passphrase (default: -)

Examples:
  passgen                           # Generate 16-char password
  passgen -l 32                     # Generate 32-char password
  passgen -c 5                      # Generate 5 passwords
  passgen --no-symbols              # No special characters
  passgen --passphrase -w 6         # 6-word passphrase
  passgen -l 20 -C                  # Copy to clipboard
`);
}

/**
 * Generate cryptographically secure random bytes
 */
function secureRandom(max) {
  return crypto.randomInt(0, max);
}

/**
 * Build character pool based on options
 */
function buildCharPool(options) {
  let pool = '';
  
  if (options.lowercase) pool += CHAR_SETS.lowercase;
  if (options.uppercase) pool += CHAR_SETS.uppercase;
  if (options.numbers) pool += CHAR_SETS.numbers;
  if (options.symbols) pool += CHAR_SETS.symbols;
  if (options.extended) pool += CHAR_SETS.extended;

  // Remove ambiguous characters
  if (options.noAmbiguous) {
    for (const char of CHAR_SETS.ambiguous) {
      pool = pool.replace(new RegExp(char, 'g'), '');
    }
  }

  // Remove excluded characters
  for (const char of options.exclude) {
    pool = pool.replace(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
  }

  return pool;
}

/**
 * Generate random password
 */
function generatePassword(options) {
  const pool = buildCharPool(options);
  
  if (pool.length === 0) {
    throw new Error('No character sets selected. Use at least one character type.');
  }

  let password = '';
  const poolLength = pool.length;

  // Ensure at least one character from each selected set
  const required = [];
  if (options.lowercase) required.push(getRandomChar(CHAR_SETS.lowercase, options));
  if (options.uppercase) required.push(getRandomChar(CHAR_SETS.uppercase, options));
  if (options.numbers) required.push(getRandomChar(CHAR_SETS.numbers, options));
  if (options.symbols) required.push(getRandomChar(CHAR_SETS.symbols, options));

  // Fill the rest randomly
  for (let i = required.length; i < options.length; i++) {
    required.push(pool[secureRandom(poolLength)]);
  }

  // Shuffle
  for (let i = required.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [required[i], required[j]] = [required[j], required[i]];
  }

  return required.join('');
}

/**
 * Get random character from set, respecting exclusions
 */
function getRandomChar(set, options) {
  let filtered = set;
  if (options.noAmbiguous) {
    for (const char of CHAR_SETS.ambiguous) {
      filtered = filtered.replace(char, '');
    }
  }
  for (const char of options.exclude) {
    filtered = filtered.replace(char, '');
  }
  return filtered[secureRandom(filtered.length)];
}

/**
 * Generate pronounceable password
 */
function generatePronounceable(length) {
  const vowels = 'aeiou';
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  let password = '';
  let useVowel = secureRandom(2) === 0;

  while (password.length < length) {
    const set = useVowel ? vowels : consonants;
    const char = set[secureRandom(set.length)];
    
    // Randomly capitalize
    password += secureRandom(3) === 0 ? char.toUpperCase() : char;
    useVowel = !useVowel;
  }

  // Add a number and symbol
  if (length > 6) {
    const pos = secureRandom(password.length);
    password = password.slice(0, pos) + 
               CHAR_SETS.numbers[secureRandom(CHAR_SETS.numbers.length)] +
               password.slice(pos);
  }

  return password.slice(0, length);
}

/**
 * Common words for passphrase generation
 */
const COMMON_WORDS = [
  'apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew',
  'kiwi', 'lemon', 'mango', 'nectarine', 'orange', 'papaya', 'quince', 'raspberry',
  'strawberry', 'tangerine', 'watermelon', 'apricot', 'blueberry', 'coconut',
  'avocado', 'almond', 'beach', 'cloud', 'dawn', 'earth', 'forest', 'garden',
  'harbor', 'island', 'jungle', 'lake', 'meadow', 'ocean', 'prairie', 'river',
  'sunset', 'thunder', 'valley', 'waterfall', 'autumn', 'breeze', 'crystal',
  'diamond', 'emerald', 'feather', 'galaxy', 'horizon', 'iceberg', 'journey',
  'kinetic', 'lantern', 'mountain', 'nebula', 'obsidian', 'pebble', 'quantum',
  'rainbow', 'silence', 'twilight', 'universe', 'velocity', 'whisper', 'zenith'
];

/**
 * Generate passphrase
 */
function generatePassphrase(options) {
  const words = [];
  for (let i = 0; i < options.words; i++) {
    words.push(COMMON_WORDS[secureRandom(COMMON_WORDS.length)]);
  }
  return words.join(options.separator);
}

/**
 * Calculate password entropy
 */
function calculateEntropy(password, options) {
  let poolSize = 0;
  if (options.lowercase) poolSize += 26;
  if (options.uppercase) poolSize += 26;
  if (options.numbers) poolSize += 10;
  if (options.symbols) poolSize += CHAR_SETS.symbols.length;
  if (options.extended) poolSize += CHAR_SETS.extended.length;

  const entropy = Math.log2(Math.pow(poolSize, password.length));
  return Math.floor(entropy);
}

/**
 * Estimate password strength (zxcvbn-style simplified)
 */
function estimateStrength(password, options) {
  let score = 0;
  const checks = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[^a-zA-Z0-9]/.test(password),
    unique: new Set(password).size >= password.length * 0.7
  };

  const passed = Object.values(checks).filter(Boolean).length;
  
  // Base score from checks
  score = passed;

  // Bonus for length
  if (password.length >= 20) score += 2;
  else if (password.length >= 16) score += 1;

  // Penalty for common patterns
  if (/^[a-zA-Z]+$/.test(password)) score -= 1;  // Only letters
  if (/^[0-9]+$/.test(password)) score -= 2;     // Only numbers
  if (/(.)\1{2,}/.test(password)) score -= 1;   // Repeating patterns

  // Calculate entropy
  const entropy = options.passphrase 
    ? Math.log2(Math.pow(COMMON_WORDS.length, options.words))
    : calculateEntropy(password, options);

  // Determine strength label
  let strength, color;
  if (score <= 2 || entropy < 40) {
    strength = 'Weak';
    color = COLORS.red;
  } else if (score <= 4 || entropy < 60) {
    strength = 'Fair';
    color = COLORS.yellow;
  } else if (score <= 6 || entropy < 80) {
    strength = 'Good';
    color = COLORS.blue;
  } else {
    strength = 'Strong';
    color = COLORS.green;
  }

  return {
    score,
    entropy,
    strength,
    color,
    checks,
    crackTime: estimateCrackTime(entropy)
  };
}

/**
 * Estimate time to crack
 */
function estimateCrackTime(entropy) {
  const guessesPerSecond = 10000000000; // 10 billion guesses/second (GPU cluster)
  const seconds = Math.pow(2, entropy) / guessesPerSecond;

  if (seconds < 60) return 'instantly';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.floor(seconds / 86400)} days`;
  if (seconds < 3153600000) return `${Math.floor(seconds / 31536000)} years`;
  return 'centuries';
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  const platform = process.platform;
  
  try {
    if (platform === 'darwin') {
      await execPromise(`echo "${text.replace(/"/g, '\\"')}" | pbcopy`);
    } else if (platform === 'linux') {
      await execPromise(`echo "${text.replace(/"/g, '\\"')}" | xclip -selection clipboard`);
    } else if (platform === 'win32') {
      await execPromise(`echo ${text.replace(/"/g, '\\"')} | clip`);
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  try {
    const passwords = [];

    for (let i = 0; i < options.count; i++) {
      let password;
      
      if (options.passphrase) {
        password = generatePassphrase(options);
      } else if (options.pronounceable) {
        password = generatePronounceable(options.length);
      } else {
        password = generatePassword(options);
      }
      
      passwords.push(password);
    }

    // Display passwords
    console.log(`\n${COLORS.cyan}Generated Passwords:${COLORS.reset}\n`);

    passwords.forEach((password, index) => {
      const strength = estimateStrength(password, options);
      const num = options.count > 1 ? `${index + 1}. ` : '';
      
      console.log(`${num}${COLORS.bright}${password}${COLORS.reset}`);
      
      if (options.count === 1 || index === 0) {
        console.log(`   ${strength.color}Strength: ${strength.strength}${COLORS.reset} ` +
                    `(entropy: ~${strength.entropy} bits, crack time: ${strength.crackTime})`);
        
        // Show check breakdown
        const checkMarks = Object.entries(strength.checks)
          .map(([name, passed]) => `${passed ? COLORS.green : COLORS.red}✓${COLORS.reset} ${name}`)
          .join('  ');
        console.log(`   ${checkMarks}`);
      }
      console.log();
    });

    // Copy to clipboard
    if (options.copy) {
      const success = await copyToClipboard(passwords[0]);
      if (success) {
        console.log(`${COLORS.green}✓ Copied to clipboard${COLORS.reset}`);
      } else {
        console.log(`${COLORS.yellow}Warning: Could not copy to clipboard${COLORS.reset}`);
      }
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

module.exports = { generatePassword, estimateStrength, calculateEntropy };
