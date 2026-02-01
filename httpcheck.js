#!/usr/bin/env node

/**
 * HTTP Status Checker CLI
 * Check if websites are up, measure response times, and follow redirects.
 * 
 * Usage: node httpcheck.js <url> [options]
 *        node httpcheck.js --file urls.txt
 * 
 * Features:
 * - Check single or multiple URLs
 * - Measure response time
 * - Follow redirects
 * - Bulk checking from file
 * - Export results to JSON/CSV
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

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
  gray: '\x1b[90m'
};

// HTTP status code descriptions
const STATUS_CODES = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    urls: [],
    file: null,
    timeout: 10000,
    retries: 1,
    followRedirects: true,
    maxRedirects: 10,
    method: 'GET',
    headers: {},
    output: null,
    format: 'table', // table, json, csv
    concurrent: 5,
    verbose: false,
    quiet: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg === '--version' || arg === '-v') {
      console.log('httpcheck v1.0.0');
      process.exit(0);
    } else if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--timeout' || arg === '-t') {
      options.timeout = parseInt(args[++i]) || 10000;
    } else if (arg === '--retries' || arg === '-r') {
      options.retries = parseInt(args[++i]) || 1;
    } else if (arg === '--no-redirect') {
      options.followRedirects = false;
    } else if (arg === '--max-redirects') {
      options.maxRedirects = parseInt(args[++i]) || 10;
    } else if (arg === '--method' || arg === '-m') {
      options.method = (args[++i] || 'GET').toUpperCase();
    } else if (arg === '--header' || arg === '-H') {
      const header = args[++i];
      if (header && header.includes(':')) {
        const [key, ...valueParts] = header.split(':');
        options.headers[key.trim()] = valueParts.join(':').trim();
      }
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--format') {
      options.format = args[++i] || 'table';
    } else if (arg === '--concurrent' || arg === '-c') {
      options.concurrent = parseInt(args[++i]) || 5;
    } else if (arg === '--verbose' || arg === '-V') {
      options.verbose = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    } else if (!arg.startsWith('-') && isValidURL(arg)) {
      options.urls.push(arg);
    }
  }

  return options;
}

/**
 * Check if string is a valid URL
 */
function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${COLORS.cyan}HTTP Status Checker CLI${COLORS.reset}

Usage: httpcheck <url> [options]
       httpcheck --file urls.txt [options]

Options:
  -h, --help              Show this help message
  -v, --version           Show version
  -f, --file <path>       Read URLs from file (one per line)
  -t, --timeout <ms>      Request timeout in milliseconds (default: 10000)
  -r, --retries <n>       Number of retries on failure (default: 1)
  --no-redirect           Don't follow redirects
  --max-redirects <n>     Maximum redirects to follow (default: 10)
  -m, --method <method>   HTTP method (default: GET)
  -H, --header <header>   Add custom header (format: "Key: Value")
  -o, --output <file>     Save results to file
  --format <format>       Output format: table, json, csv (default: table)
  -c, --concurrent <n>    Max concurrent requests (default: 5)
  -V, --verbose           Show detailed output
  -q, --quiet             Only show errors

Examples:
  httpcheck https://example.com
  httpcheck https://example.com --no-redirect
  httpcheck -f urls.txt -t 5000
  httpcheck https://api.example.com -m POST -H "Authorization: Bearer token"
  httpcheck -f urls.txt --format json -o results.json
`);
}

/**
 * Read URLs from file
 */
function readURLsFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      // Add protocol if missing
      if (!line.match(/^https?:\/\//)) {
        return `https://${line}`;
      }
      return line;
    });
}

/**
 * Check a single URL
 */
async function checkURL(url, options, attempt = 1) {
  const startTime = Date.now();
  const parsedURL = new URL(url);
  const protocol = parsedURL.protocol === 'https:' ? https : http;

  const requestOptions = {
    hostname: parsedURL.hostname,
    port: parsedURL.port || (parsedURL.protocol === 'https:' ? 443 : 80),
    path: parsedURL.pathname + parsedURL.search,
    method: options.method,
    headers: {
      'User-Agent': 'httpcheck/1.0.0',
      'Accept': '*/*',
      'Connection': 'close',
      ...options.headers
    },
    timeout: options.timeout
  };

  return new Promise((resolve) => {
    const req = protocol.request(requestOptions, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let body = '';
      res.on('data', chunk => body += chunk);
      
      res.on('end', () => {
        const result = {
          url,
          status: res.statusCode,
          statusText: STATUS_CODES[res.statusCode] || 'Unknown',
          responseTime,
          size: body.length,
          headers: res.headers,
          redirects: [],
          error: null
        };

        // Handle redirects
        if (options.followRedirects && 
            [301, 302, 307, 308].includes(res.statusCode) && 
            res.headers.location) {
          const redirectCount = (res.req?._redirectCount || 0) + 1;
          
          if (redirectCount <= options.maxRedirects) {
            const redirectURL = new URL(res.headers.location, url).toString();
            result.redirects.push({
              from: url,
              to: redirectURL,
              status: res.statusCode
            });
            
            // Follow redirect
            checkURL(redirectURL, options).then(redirectResult => {
              result.status = redirectResult.status;
              result.statusText = redirectResult.statusText;
              result.responseTime += redirectResult.responseTime;
              result.size = redirectResult.size;
              result.headers = redirectResult.headers;
              result.redirects.push(...redirectResult.redirects);
              resolve(result);
            });
            return;
          }
        }

        resolve(result);
      });
    });

    req.on('error', (error) => {
      if (attempt < options.retries) {
        setTimeout(() => {
          checkURL(url, options, attempt + 1).then(resolve);
        }, 1000 * attempt);
      } else {
        resolve({
          url,
          status: 0,
          statusText: 'Error',
          responseTime: Date.now() - startTime,
          size: 0,
          headers: {},
          redirects: [],
          error: error.message
        });
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (attempt < options.retries) {
        setTimeout(() => {
          checkURL(url, options, attempt + 1).then(resolve);
        }, 1000 * attempt);
      } else {
        resolve({
          url,
          status: 0,
          statusText: 'Timeout',
          responseTime: options.timeout,
          size: 0,
          headers: {},
          redirects: [],
          error: 'Request timeout'
        });
      }
    });

    req.end();
  });
}

/**
 * Run checks with concurrency limit
 */
async function runChecks(urls, options) {
  const results = [];
  const queue = [...urls];
  const running = [];

  while (queue.length > 0 || running.length > 0) {
    // Start new checks up to concurrent limit
    while (running.length < options.concurrent && queue.length > 0) {
      const url = queue.shift();
      const promise = checkURL(url, options).then(result => {
        results.push(result);
        if (!options.quiet) {
          printResult(result, options);
        }
        return result;
      });
      running.push(promise);
    }

    // Wait for at least one to complete
    if (running.length > 0) {
      await Promise.race(running);
      // Remove completed promises
      for (let i = running.length - 1; i >= 0; i--) {
        if (running[i].isFulfilled) {
          running.splice(i, 1);
        }
      }
    }
  }

  return results;
}

/**
 * Print single result
 */
function printResult(result, options) {
  const statusColor = result.status >= 200 && result.status < 300 
    ? COLORS.green 
    : result.status >= 300 && result.status < 400
    ? COLORS.yellow
    : result.status >= 400
    ? COLORS.red
    : COLORS.gray;

  const timeColor = result.responseTime < 500 
    ? COLORS.green 
    : result.responseTime < 2000 
    ? COLORS.yellow 
    : COLORS.red;

  let line = `${statusColor}[${result.status}]${COLORS.reset} ${result.url}`;
  line += ` ${timeColor}(${result.responseTime}ms)${COLORS.reset}`;
  
  if (result.error) {
    line += ` ${COLORS.red}✗ ${result.error}${COLORS.reset}`;
  } else if (result.redirects.length > 0) {
    line += ` ${COLORS.yellow}→ ${result.redirects.length} redirect(s)${COLORS.reset}`;
  }

  console.log(line);

  if (options.verbose && result.redirects.length > 0) {
    result.redirects.forEach(redirect => {
      console.log(`    ${COLORS.gray}→ ${redirect.from} → ${redirect.to} (${redirect.status})${COLORS.reset}`);
    });
  }
}

/**
 * Print summary table
 */
function printSummary(results) {
  const total = results.length;
  const successful = results.filter(r => r.status >= 200 && r.status < 300).length;
  const redirects = results.filter(r => r.status >= 300 && r.status < 400).length;
  const clientErrors = results.filter(r => r.status >= 400 && r.status < 500).length;
  const serverErrors = results.filter(r => r.status >= 500).length;
  const failed = results.filter(r => r.status === 0).length;
  
  const avgTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / total
  );

  console.log(`\n${COLORS.cyan}Summary:${COLORS.reset}`);
  console.log(`  Total: ${total} | ${COLORS.green}OK: ${successful}${COLORS.reset} | ` +
              `${COLORS.yellow}Redirects: ${redirects}${COLORS.reset} | ` +
              `${COLORS.red}Client Errors: ${clientErrors}${COLORS.reset} | ` +
              `${COLORS.magenta}Server Errors: ${serverErrors}${COLORS.reset} | ` +
              `${COLORS.gray}Failed: ${failed}${COLORS.reset}`);
  console.log(`  Average response time: ${avgTime}ms`);
}

/**
 * Export results to file
 */
function exportResults(results, format, outputPath) {
  let content;

  switch (format) {
    case 'json':
      content = JSON.stringify(results, null, 2);
      break;
    case 'csv':
      content = 'URL,Status,Status Text,Response Time (ms),Size (bytes),Error\n';
      results.forEach(r => {
        content += `"${r.url}",${r.status},"${r.statusText}",${r.responseTime},${r.size},"${r.error || ''}"\n`;
      });
      break;
    default:
      throw new Error(`Unknown format: ${format}`);
  }

  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`\n${COLORS.green}✓ Results saved to ${outputPath}${COLORS.reset}`);
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  try {
    // Collect URLs
    let urls = [...options.urls];
    
    if (options.file) {
      const fileURLs = readURLsFromFile(options.file);
      urls.push(...fileURLs);
    }

    if (urls.length === 0) {
      console.error(`${COLORS.red}Error: No URLs provided${COLORS.reset}`);
      console.error(`Use --help for usage information`);
      process.exit(1);
    }

    if (!options.quiet) {
      console.log(`${COLORS.cyan}Checking ${urls.length} URL(s)...${COLORS.reset}\n`);
    }

    // Run checks
    const results = await runChecks(urls, options);

    // Print summary
    if (!options.quiet) {
      printSummary(results);
    }

    // Export if requested
    if (options.output) {
      exportResults(results, options.format, options.output);
    }

    // Exit with error code if any checks failed
    const failed = results.filter(r => r.status === 0 || r.status >= 400).length;
    if (failed > 0) {
      process.exit(1);
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

module.exports = { checkURL, runChecks };
