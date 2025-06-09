#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

import * as fs from 'fs';
import * as path from 'path';
import { generateSeedsAutomaton, generateSingleSeedsAutomaton, OutputConfig, GenerateOptions } from '../core/pattern-generator';
import { createStaticSvg } from '../renderers/svg-renderer';
import { getPalette } from '../renderers/color-palettes';
import { getGitHubUserContribution } from '../github/api-client';

interface CliOptions {
  username: string;
  output: string;
  githubToken?: string;
  palette?: string;
  colorAlive?: string;
  colorDead?: string;
  colorBorder?: string;
  generations?: number;
  survivalRate?: number;
  frameDuration?: number;
  pattern?: string;
  initialState?: boolean;
  initialDisplayDuration?: number;  // Time to show initial pattern before animation starts
  showProgressBar?: boolean;        // Show progress bar during animation
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: Partial<CliOptions> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--username':
      case '-u':
        options.username = nextArg;
        i++;
        break;
      case '--output':
      case '-o':
        options.output = nextArg;
        i++;
        break;
      case '--github-token':
        options.githubToken = nextArg;
        i++;
        break;
      case '--palette':
        options.palette = nextArg;
        i++;
        break;
      case '--color-alive':
        options.colorAlive = nextArg;
        i++;
        break;
      case '--color-dead':
        options.colorDead = nextArg;
        i++;
        break;
      case '--color-border':
        options.colorBorder = nextArg;
        i++;
        break;
      case '--generations':
        options.generations = parseInt(nextArg);
        i++;
        break;
      case '--survival-rate':
        options.survivalRate = parseFloat(nextArg);
        i++;
        break;
      case '--frame-duration':
        options.frameDuration = parseInt(nextArg);
        i++;
        break;
      case '--pattern':
        options.pattern = nextArg;
        i++;
        break;
      case '--initial-state':
        options.initialState = true;
        break;
      case '--initial-display-duration':
        options.initialDisplayDuration = parseInt(nextArg);
        i++;
        break;
      case '--show-progress-bar':
        options.showProgressBar = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  if (!options.username || !options.output) {
    console.error('❌ Username and output file are required');
    printHelp();
    process.exit(1);
  }
  
  return options as CliOptions;
}

function printHelp(): void {
  console.log(`
Seeds Cellular Automata Generator

Usage: seeds [options]

Required:
  -u, --username <name>        GitHub username
  -o, --output <file>          Output file (supports .svg and .gif)

Optional:
  --github-token <token>       GitHub token for contribution data
  --palette <name>             Color palette (github-dark)
  --color-alive <color>        Color for living cells
  --color-dead <color>         Color for dead cells
  --color-border <color>       Border color
  --generations <number>       Number of generations (default: 50)
  --frame-duration <ms>        Frame duration in milliseconds (default: 100)
  --pattern <type>             Initial pattern (random, two-cluster, seeds-explosion, contribution-based)
  --initial-state              Generate only the initial state image (no animation)
  --initial-display-duration <ms>  Show initial pattern longer (default: 3000ms)
  --show-progress-bar          Add progress bar below animation
  -h, --help                   Show this help

Examples:
  seeds -u octocat -o seeds.svg
  seeds -u octocat -o seeds.gif --palette github-dark --generations 100
  seeds -u octocat -o seeds.svg --github-token ghp_xxx --pattern contribution-based
  seeds -u octocat -o initial-state.svg --initial-state --pattern two-cluster
  seeds -u octocat -o showcase.svg --initial-display-duration 4000 --show-progress-bar
`);
}

function cleanAssetsFolder(outputPath: string): void {
  const assetsDir = path.join(process.cwd(), 'assets');
  const outputDir = path.dirname(path.resolve(outputPath));
  const resolvedAssetsDir = path.resolve(assetsDir);
  
  // Only clean assets folder if output is going to assets directory
  if (outputDir !== resolvedAssetsDir) {
    console.log('🔄 Output not going to assets folder, skipping cleanup...');
    return;
  }
  
  // Check if assets directory exists
  if (!fs.existsSync(assetsDir)) {
    console.log('📁 Creating assets directory...');
    fs.mkdirSync(assetsDir, { recursive: true });
    return;
  }
  
  try {
    // Read all files in assets directory
    const files = fs.readdirSync(assetsDir);
    const svgFiles = files.filter(file => file.endsWith('.svg'));
    
    if (svgFiles.length === 0) {
      console.log('🧹 Assets folder is already clean (no SVG files found)');
      return;
    }
    
    console.log(`🧹 Cleaning assets folder (removing ${svgFiles.length} previous SVG files)...`);
    
    // Remove all SVG files
    svgFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      fs.unlinkSync(filePath);
      console.log(`   🗑️ Removed ${file}`);
    });
    
    console.log('✨ Assets folder cleaned successfully!');
  } catch (error) {
    console.warn(`⚠️ Warning: Could not clean assets folder: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main(): Promise<void> {
  try {
    const options = parseArgs();
    
    // Clean previous SVG files from assets folder only if output is going there
    cleanAssetsFolder(options.output);
    
    // Determine output format from file extension
    const ext = path.extname(options.output).toLowerCase();
    const format = ext === '.gif' ? 'gif' : 'svg';
    
    // Get GitHub token from environment if not provided
    const githubToken = options.githubToken || process.env.GITHUB_TOKEN || '';
    
    if (!githubToken) {
      console.warn('⚠️ No GitHub token provided. Using random pattern instead of contribution data.');
      console.warn('   Set GITHUB_TOKEN environment variable or use --github-token flag.');
    }
    
    const generateOptions: GenerateOptions = {
      githubToken,
      palette: options.palette,
      colorAlive: options.colorAlive,
      colorDead: options.colorDead,
      colorBorder: options.colorBorder,
      generations: options.generations,
      survivalRate: options.survivalRate,
      frameDuration: options.frameDuration,
      pattern: options.pattern as any,
      initialDisplayDuration: options.initialDisplayDuration,
      showProgressBar: options.showProgressBar
    };
    
    const outputConfig: OutputConfig = {
      filename: options.output,
      format,
      options: generateOptions
    };
    
    console.log(`🚀 Generating ${options.initialState ? 'initial state' : format.toUpperCase()} for user: ${options.username}`);
    
    if (options.initialState) {
      // Generate initial state image only
      let contributionCells: any[] = [];
      let width = 53; // Standard GitHub contribution graph width
      let height = 7;  // Standard GitHub contribution graph height
      
      // Try to get GitHub contribution data if token is provided
      if (githubToken && generateOptions.pattern === 'contribution-based') {
        try {
          console.log('📊 Fetching GitHub contribution data...');
          contributionCells = await getGitHubUserContribution(options.username, {
            githubToken
          });
          
          if (contributionCells.length > 0) {
            width = Math.max(...contributionCells.map(c => c.x)) + 1;
            height = Math.max(...contributionCells.map(c => c.y)) + 1;
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch GitHub data, using random pattern:', error instanceof Error ? error.message : String(error));
        }
      }
      
      const result = await generateSingleSeedsAutomaton(options.username, generateOptions, width, height, contributionCells);
      const initialGrid = result.initialGrid;
      
      // Get draw options
      let drawOptions = getPalette(generateOptions.palette || 'github-dark');
      if (generateOptions.colorAlive) drawOptions.colorAlive = generateOptions.colorAlive;
      if (generateOptions.colorDead) drawOptions.colorDead = generateOptions.colorDead;
      if (generateOptions.colorBorder) drawOptions.colorBorder = generateOptions.colorBorder;
      
      // Create initial state SVG
      const initialStateSvg = createStaticSvg(initialGrid, drawOptions);
      
      // Ensure output directory exists
      const outputDir = path.dirname(options.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Write initial state file
      fs.writeFileSync(options.output, initialStateSvg, 'utf8');
      console.log(`✅ Generated initial state: ${options.output}`);
    } else {
      // Generate animation
      const results = await generateSeedsAutomaton(options.username, [outputConfig], generateOptions);
      const result = results[0];
      
      if (result) {
        // Ensure output directory exists
        const outputDir = path.dirname(options.output);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write file
        if (typeof result === 'string') {
          fs.writeFileSync(options.output, result, 'utf8');
        } else {
          fs.writeFileSync(options.output, result);
        }
        
        console.log(`✅ Generated ${options.output}`);
      } else {
        console.error('❌ Failed to generate output');
        process.exit(1);
      }
    }    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
}

if (require.main === module) {
  main();
}
