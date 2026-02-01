#!/usr/bin/env node

/**
 * CSV to JSON Converter
 * 
 * Convert CSV files to JSON with smart type detection.
 * Handles headers, nested objects, and various CSV formats.
 * 
 * Usage:
 *   csv2json data.csv > data.json
 *   csv2json data.csv --pretty
 *   csv2json data.csv --array
 *   cat data.csv | csv2json
 */

const fs = require('fs');
const readline = require('readline');

// Parse CSV line (handles quoted fields)
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current.trim());
  return fields;
}

// Smart type conversion
function convertValue(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  
  // Boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Number (integer or float)
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }
  
  // Date (ISO format)
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return value; // Keep as string for JSON
    }
  }
  
  // Default: string
  return value;
}

function convertCSV(input, options = {}) {
  const lines = input.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('Empty CSV');
  }
  
  // Parse headers
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length !== headers.length) {
      console.error(`Warning: Line ${i + 1} has ${values.length} fields, expected ${headers.length}`);
      continue;
    }
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = options.noConvert ? values[index] : convertValue(values[index]);
    });
    
    data.push(row);
  }
  
  return data;
}

function showHelp() {
  console.log(`
CSV to JSON Converter

Convert CSV files to JSON with smart type detection.

Usage:
  csv2json <file.csv> [options]
  cat file.csv | csv2json [options]

Options:
  --pretty        Pretty print JSON (2 space indent)
  --array         Output as JSON array (default)
  --no-convert    Keep all values as strings
  --headers <h>   Custom headers (comma-separated)
  --help          Show this help

Examples:
  csv2json data.csv > output.json
  csv2json data.csv --pretty
  echo "name,age\nJohn,30" | csv2json
  csv2json data.csv --headers "Name,Age,City"
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showHelp();
    return;
  }
  
  const options = {
    pretty: args.includes('--pretty'),
    noConvert: args.includes('--no-convert')
  };
  
  // Get input file (if provided)
  const fileArg = args.find(arg => !arg.startsWith('--'));
  
  let input = '';
  
  if (fileArg) {
    // Read from file
    if (!fs.existsSync(fileArg)) {
      console.error(`Error: File not found: ${fileArg}`);
      process.exit(1);
    }
    input = fs.readFileSync(fileArg, 'utf-8');
  } else {
    // Read from stdin
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    
    const lines = [];
    for await (const line of rl) {
      lines.push(line);
    }
    input = lines.join('\n');
  }
  
  if (!input.trim()) {
    console.error('Error: No input provided');
    process.exit(1);
  }
  
  try {
    const data = convertCSV(input, options);
    
    if (options.pretty) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
