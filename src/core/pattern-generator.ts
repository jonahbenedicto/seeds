import { SeedsAutomaton } from './game-engine';
import { createSvg, createStaticSvg, createShowcaseSvg } from '../renderers/svg-renderer';
import { createGif } from '../renderers/gif-renderer';
import { getPalette } from '../renderers/color-palettes';
import { getGitHubUserContribution, contributionToInitialPattern } from '../github/api-client';
import { SeedsOptions, DrawOptions, AnimationOptions, Grid } from './types';

export interface GenerateOptions {
  githubToken: string;
  palette?: string;
  colorAlive?: string;
  colorDead?: string;
  colorBorder?: string;
  generations?: number;
  survivalRate?: number;
  frameDuration?: number;
  pattern?: 'random' | 'two-cluster' | 'seeds-explosion' | 'contribution-based' | 'glider';
  initialDisplayDuration?: number;  // How long to show initial pattern
  showProgressBar?: boolean;        // Show progress bar during animation
}

export interface OutputConfig {
  filename: string;
  format: 'svg' | 'gif';
  options: GenerateOptions;
}

export interface SeedsResult {
  initialGrid: Grid;
  animationGrids: Grid[];
}

export async function generateSingleSeedsAutomaton(
  username: string,
  options: GenerateOptions,
  width: number,
  height: number,
  contributionCells: any[]
): Promise<SeedsResult> {
  // Configure Seeds Automaton for this specific output
  const gameOptions: SeedsOptions = {
    width,
    height,
    generations: options.generations || 50,
    survivalRate: 1.0, // Seeds rule: no survival (all living cells die)
    initialPattern: options.pattern || (contributionCells.length > 0 ? 'contribution-based' : 'random'),
    initialDensity: 0.3
  };
   // Create Seeds Automaton instance
  const game = new SeedsAutomaton(gameOptions);

  // If we have contribution data and this output wants contribution-based pattern, use it
  if (contributionCells.length > 0 && options.pattern === 'contribution-based') {
    const initialPattern = contributionToInitialPattern(contributionCells);
    game.initializeFromContribution(initialPattern);
  }
  
  // Get initial grid state
  const initialGrid = JSON.parse(JSON.stringify(game.getGrid()));
  
  // Simulate Seeds Automaton
  const animationGrids = game.simulate();
  
  return {
    initialGrid,
    animationGrids
  };
}

export async function generateSeedsAutomaton(
  username: string,
  outputs: (OutputConfig | null)[],
  baseOptions: GenerateOptions
): Promise<(string | Buffer | undefined)[]> {
  console.log('🌱 Generating Seeds animation...');
  
  let contributionCells: any[] = [];
  let width = 53; // Standard GitHub contribution graph width
  let height = 7;  // Standard GitHub contribution graph height
  
  // Try to get GitHub contribution data if token is provided
  const needsContributionData = outputs.some(output => 
    output && (output.options.pattern === 'contribution-based' || 
               (!output.options.pattern && baseOptions.pattern === 'contribution-based'))
  );
  
  if (baseOptions.githubToken && needsContributionData) {
    try {
      console.log('📊 Fetching GitHub contribution data...');
      console.log(`📊 Token length: ${baseOptions.githubToken.length}, Username: ${username}`);
      contributionCells = await getGitHubUserContribution(username, {
        githubToken: baseOptions.githubToken
      });
      
      console.log(`📊 Successfully fetched ${contributionCells.length} contribution cells`);
      
      // Calculate actual dimensions from contribution data
      if (contributionCells.length > 0) {
        width = Math.max(...contributionCells.map(c => c.x)) + 1;
        height = Math.max(...contributionCells.map(c => c.y)) + 1;
        console.log(`📊 Grid dimensions from contribution data: ${width}x${height}`);
      }
    } catch (error) {
      console.error('❌ Could not fetch GitHub data, using random pattern:', error instanceof Error ? error.message : String(error));
      console.error('❌ Full error:', error);
    }
  } else if (needsContributionData) {
    console.warn('⚠️ Contribution data needed but no GitHub token provided');
  }
  
  // Generate outputs
  const results: (string | Buffer | undefined)[] = [];
  
  for (let i = 0; i < outputs.length; i++) {
    const output = outputs[i];
    if (!output) {
      results.push(undefined);
      continue;
    }
    
    const options = { ...baseOptions, ...output.options };
    
    // Generate Seeds simulation for this specific output
    console.log(`🧬 Running Seeds simulation for output ${i + 1} (pattern: ${options.pattern || 'contribution-based'})...`);
    const result = await generateSingleSeedsAutomaton(username, options, width, height, contributionCells);
    const grids = result.animationGrids;
    console.log(`✨ Generated ${grids.length} generations for output ${i + 1}`);
    
    // Get draw options
    let drawOptions = getPalette(options.palette || 'github-dark');
    
    // Override colors if specified
    if (options.colorAlive) drawOptions.colorAlive = options.colorAlive;
    if (options.colorDead) drawOptions.colorDead = options.colorDead;
    if (options.colorBorder) drawOptions.colorBorder = options.colorBorder;
    
    const animationOptions: AnimationOptions = {
      frameDuration: options.frameDuration || 100,
      generations: grids.length,
      initialDisplayDuration: options.initialDisplayDuration,
      showProgressBar: options.showProgressBar
    };
    
    try {
      switch (output.format) {
        case 'svg':
          console.log(`🎨 Creating SVG (output ${i + 1})...`);
          // Use enhanced SVG with initial display timing if specified
          const useEnhancedTiming = options.initialDisplayDuration;
          const svg = useEnhancedTiming 
            ? createShowcaseSvg(grids, drawOptions, animationOptions)
            : createSvg(grids, drawOptions, animationOptions);
          results.push(svg);
          break;
          
        case 'gif':
          console.log(`🎬 Creating GIF (output ${i + 1})...`);
          const gif = await createGif(grids, drawOptions, animationOptions);
          results.push(gif);
          break;
          
        default:
          console.warn(`⚠️ Unknown format: ${output.format}`);
          results.push(undefined);
      }
    } catch (error) {
      console.error(`❌ Error creating ${output.format}:`, error);
      results.push(undefined);
    }
  }
  
  return results;
}
