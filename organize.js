#!/usr/bin/env node

/**
 * File Organizer CLI
 * Organizes files by extension into categorized folders.
 * 
 * Usage: node organize.js <directory> [options]
 * 
 * Features:
 * - Sorts files by extension into category folders
 * - Creates organized folder structure
 * - Dry-run mode to preview changes
 * - Undo capability with transaction log
 */

const fs = require('fs');
const path = require('path');

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

// Default file categories
const DEFAULT_CATEGORIES = {
  'Images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff', '.raw', '.psd', '.ai'],
  'Documents': ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.csv', '.ppt', '.pptx'],
  'Archives': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.tgz', '.bz2'],
  'Audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus'],
  'Video': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg'],
  'Code': ['.js', '.ts', '.html', '.css', '.scss', '.json', '.xml', '.py', '.java', '.cpp', '.c', '.h', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.sql'],
  'Executables': ['.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.appimage', '.sh', '.bat'],
  'Fonts': ['.ttf', '.otf', '.woff', '.woff2', '.eot'],
  'Data': ['.db', '.sqlite', '.mdb', '.accdb', '.log']
};

// Transaction log file
const LOG_FILE = '.organize-log.json';

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    directory: null,
    dryRun: false,
    undo: false,
    recursive: false,
    categories: { ...DEFAULT_CATEGORIES },
    includeHidden: false,
    flatten: false,
    customFolder: null,
    exclude: [],
    minSize: 0,
    maxSize: Infinity,
    dateSort: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg === '--version' || arg === '-v') {
      console.log('organize v1.0.0');
      process.exit(0);
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--undo' || arg === '-u') {
      options.undo = true;
    } else if (arg === '--recursive' || arg === '-r') {
      options.recursive = true;
    } else if (arg === '--hidden') {
      options.includeHidden = true;
    } else if (arg === '--flatten') {
      options.flatten = true;
    } else if (arg === '--folder' || arg === '-f') {
      options.customFolder = args[++i];
    } else if (arg === '--exclude' || arg === '-e') {
      options.exclude.push(args[++i]);
    } else if (arg === '--min-size') {
      options.minSize = parseSize(args[++i]);
    } else if (arg === '--max-size') {
      options.maxSize = parseSize(args[++i]);
    } else if (arg === '--date-sort') {
      options.dateSort = true;
    } else if (!arg.startsWith('-')) {
      options.directory = arg;
    }
  }

  return options;
}

/**
 * Parse size string (e.g., "10MB", "1GB")
 */
function parseSize(sizeStr) {
  if (!sizeStr) return 0;
  const units = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  const match = sizeStr.toUpperCase().match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)?$/);
  if (!match) return 0;
  const size = parseFloat(match[1]);
  const unit = match[2] || 'B';
  return size * (units[unit] || 1);
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${COLORS.cyan}File Organizer CLI${COLORS.reset}

Usage: organize <directory> [options]

Options:
  -h, --help              Show this help message
  -v, --version           Show version
  -d, --dry-run           Preview changes without moving files
  -u, --undo              Undo last organization
  -r, --recursive         Process subdirectories
  --hidden                Include hidden files
  --flatten               Flatten directory structure
  -f, --folder <name>     Custom folder name for organized files
  -e, --exclude <ext>     Exclude file extension (can use multiple)
  --min-size <size>       Minimum file size (e.g., 10MB)
  --max-size <size>       Maximum file size (e.g., 1GB)
  --date-sort             Sort by date instead of extension

Categories:
  Images:     jpg, jpeg, png, gif, bmp, svg, webp, etc.
  Documents:  pdf, doc, docx, txt, rtf, xls, xlsx, etc.
  Archives:   zip, rar, 7z, tar, gz, etc.
  Audio:      mp3, wav, flac, aac, ogg, etc.
  Video:      mp4, avi, mkv, mov, wmv, etc.
  Code:       js, html, css, py, java, cpp, etc.
  Executables: exe, msi, dmg, deb, sh, etc.
  Fonts:      ttf, otf, woff, woff2, etc.
  Data:       db, sqlite, log, etc.

Examples:
  organize ./Downloads
  organize ./Downloads -d                    # Dry run
  organize ./Downloads -r                    # Recursive
  organize ./Downloads --undo                # Undo last operation
  organize ./Downloads -e .tmp -e .log       # Exclude extensions
  organize ./Downloads --min-size 1MB        # Only files > 1MB
`);
}

/**
 * Get category for a file extension
 */
function getCategory(ext, categories) {
  const lowerExt = ext.toLowerCase();
  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(lowerExt)) {
      return category;
    }
  }
  return 'Other';
}

/**
 * Format file size
 */
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Scan directory for files
 */
function scanDirectory(dir, options, baseDir = dir) {
  const files = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    // Skip hidden files
    if (!options.includeHidden && item.startsWith('.')) continue;
    
    // Skip the log file
    if (item === LOG_FILE) continue;
    
    if (stat.isDirectory()) {
      // Skip category folders
      if (Object.keys(options.categories).includes(item) || item === 'Other') continue;
      
      if (options.recursive) {
        files.push(...scanDirectory(fullPath, options, baseDir));
      }
    } else {
      // Check size filters
      if (stat.size < options.minSize || stat.size > options.maxSize) continue;
      
      // Check exclude list
      const ext = path.extname(item);
      if (options.exclude.includes(ext)) continue;
      
      files.push({
        name: item,
        path: fullPath,
        relativePath: path.relative(baseDir, fullPath),
        size: stat.size,
        modified: stat.mtime,
        extension: ext,
        category: options.dateSort 
          ? stat.mtime.toISOString().split('T')[0] 
          : getCategory(ext, options.categories)
      });
    }
  }
  
  return files;
}

/**
 * Load transaction log
 */
function loadLog(directory) {
  const logPath = path.join(directory, LOG_FILE);
  if (!fs.existsSync(logPath)) return null;
  
  try {
    return JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  } catch (error) {
    return null;
  }
}

/**
 * Save transaction log
 */
function saveLog(directory, operations) {
  const logPath = path.join(directory, LOG_FILE);
  const log = {
    timestamp: new Date().toISOString(),
    directory,
    operations
  };
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf-8');
}

/**
 * Perform undo operation
 */
async function undo(directory) {
  const log = loadLog(directory);
  
  if (!log) {
    console.log(`${COLORS.yellow}No previous operation to undo${COLORS.reset}`);
    return;
  }
  
  console.log(`${COLORS.cyan}Undoing ${log.operations.length} operations...${COLORS.reset}\n`);
  
  let success = 0;
  let failed = 0;
  
  // Reverse operations
  for (const op of log.operations.reverse()) {
    try {
      if (fs.existsSync(op.to)) {
        // Ensure destination directory exists
        const destDir = path.dirname(op.from);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.renameSync(op.to, op.from);
        console.log(`${COLORS.green}✓${COLORS.reset} Restored: ${path.basename(op.from)}`);
        success++;
      } else {
        console.log(`${COLORS.yellow}~${COLORS.reset} Already moved: ${path.basename(op.from)}`);
      }
    } catch (error) {
      console.log(`${COLORS.red}✗${COLORS.reset} Failed: ${path.basename(op.from)} - ${error.message}`);
      failed++;
    }
  }
  
  // Remove empty category folders
  const categories = [...new Set(log.operations.map(op => path.dirname(op.to)).filter(dir => dir !== directory))];
  for (const categoryDir of categories) {
    try {
      if (fs.existsSync(categoryDir) && fs.readdirSync(categoryDir).length === 0) {
        fs.rmdirSync(categoryDir);
        console.log(`${COLORS.gray}Removed empty folder: ${path.basename(categoryDir)}${COLORS.reset}`);
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  // Delete log file
  const logPath = path.join(directory, LOG_FILE);
  if (fs.existsSync(logPath)) {
    fs.unlinkSync(logPath);
  }
  
  console.log(`\n${COLORS.green}Undo complete: ${success} restored, ${failed} failed${COLORS.reset}`);
}

/**
 * Organize files
 */
async function organize(options) {
  const { directory, dryRun } = options;
  
  // Scan for files
  console.log(`${COLORS.cyan}Scanning ${directory}...${COLORS.reset}\n`);
  const files = scanDirectory(directory, options);
  
  if (files.length === 0) {
    console.log(`${COLORS.yellow}No files to organize${COLORS.reset}`);
    return;
  }
  
  // Group by category
  const byCategory = {};
  for (const file of files) {
    if (!byCategory[file.category]) {
      byCategory[file.category] = [];
    }
    byCategory[file.category].push(file);
  }
  
  // Display plan
  console.log(`${COLORS.cyan}Organization Plan:${COLORS.reset}\n`);
  
  const operations = [];
  let totalSize = 0;
  
  for (const [category, categoryFiles] of Object.entries(byCategory)) {
    const categorySize = categoryFiles.reduce((sum, f) => sum + f.size, 0);
    totalSize += categorySize;
    
    console.log(`${COLORS.bright}${category}/${COLORS.reset} (${categoryFiles.length} files, ${formatSize(categorySize)})`);
    
    for (const file of categoryFiles) {
      const targetFolder = options.customFolder 
        ? path.join(directory, options.customFolder, category)
        : path.join(directory, category);
      
      const targetPath = options.flatten
        ? path.join(targetFolder, file.name)
        : path.join(targetFolder, path.relative(directory, file.path).replace(/^\.\//, ''));
      
      // Handle duplicates
      let finalPath = targetPath;
      let counter = 1;
      while (fs.existsSync(finalPath) && !dryRun) {
        const ext = path.extname(targetPath);
        const base = targetPath.slice(0, -ext.length);
        finalPath = `${base} (${counter})${ext}`;
        counter++;
      }
      
      operations.push({
        from: file.path,
        to: finalPath,
        category,
        size: file.size
      });
      
      const arrow = dryRun ? COLORS.gray + '→' : COLORS.green + '→';
      console.log(`  ${file.relativePath} ${arrow} ${path.relative(directory, finalPath)}${COLORS.reset}`);
    }
    console.log();
  }
  
  console.log(`${COLORS.cyan}Summary:${COLORS.reset} ${files.length} files, ${formatSize(totalSize)}`);
  
  if (dryRun) {
    console.log(`\n${COLORS.yellow}Dry run - no files were moved${COLORS.reset}`);
    return;
  }
  
  // Confirm
  console.log(`\n${COLORS.yellow}Press Enter to proceed or Ctrl+C to cancel...${COLORS.reset}`);
  
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });
  
  // Execute operations
  console.log(`\n${COLORS.cyan}Organizing...${COLORS.reset}\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const op of operations) {
    try {
      // Create target directory
      const targetDir = path.dirname(op.to);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      fs.renameSync(op.from, op.to);
      console.log(`${COLORS.green}✓${COLORS.reset} ${path.basename(op.from)}`);
      success++;
    } catch (error) {
      console.log(`${COLORS.red}✗${COLORS.reset} ${path.basename(op.from)} - ${error.message}`);
      failed++;
    }
  }
  
  // Save transaction log
  if (success > 0) {
    saveLog(directory, operations.filter((_, i) => i < success));
    console.log(`\n${COLORS.green}Complete: ${success} moved, ${failed} failed${COLORS.reset}`);
    console.log(`${COLORS.gray}Run with --undo to revert${COLORS.reset}`);
  } else {
    console.log(`\n${COLORS.red}No files were moved${COLORS.reset}`);
  }
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  try {
    // Handle undo
    if (options.undo) {
      if (!options.directory) {
        console.error(`${COLORS.red}Error: Directory required for undo${COLORS.reset}`);
        process.exit(1);
      }
      await undo(path.resolve(options.directory));
      return;
    }

    // Validate directory
    if (!options.directory) {
      console.error(`${COLORS.red}Error: No directory specified${COLORS.reset}`);
      console.error(`Use --help for usage information`);
      process.exit(1);
    }

    const resolvedDir = path.resolve(options.directory);
    
    if (!fs.existsSync(resolvedDir)) {
      console.error(`${COLORS.red}Error: Directory not found: ${resolvedDir}${COLORS.reset}`);
      process.exit(1);
    }

    if (!fs.statSync(resolvedDir).isDirectory()) {
      console.error(`${COLORS.red}Error: Not a directory: ${resolvedDir}${COLORS.reset}`);
      process.exit(1);
    }

    options.directory = resolvedDir;
    await organize(options);

  } catch (error) {
    console.error(`${COLORS.red}Error: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { organize, scanDirectory, getCategory };
