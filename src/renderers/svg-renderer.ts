import { Grid, DrawOptions, AnimationOptions, Cell } from '../core/types';

// Helper function to get cell color based on contribution level
function getCellColor(cell: Cell, drawOptions: DrawOptions, isDarkMode: boolean = false): string {
  if (!cell.alive) {
    return isDarkMode && drawOptions.dark 
      ? (drawOptions.dark.contributionColors?.[0] || drawOptions.dark.colorDead)
      : (drawOptions.contributionColors?.[0] || drawOptions.colorDead);
  }
  
  const contributionLevel = cell.contributionLevel || 1;
  const colors = isDarkMode && drawOptions.dark?.contributionColors 
    ? drawOptions.dark.contributionColors 
    : drawOptions.contributionColors;
    
  if (colors && contributionLevel >= 0 && contributionLevel < colors.length) {
    return colors[contributionLevel];
  }
  
  // Fallback to old behavior
  return isDarkMode && drawOptions.dark 
    ? drawOptions.dark.colorAlive 
    : drawOptions.colorAlive;
}

export function createSvg(
  grids: Grid[],
  drawOptions: DrawOptions,
  animationOptions: AnimationOptions
): string {
  const { width, height } = grids[0];
  const { sizeCell, sizeDot, sizeDotBorderRadius, colorAlive, colorDead, colorBorder } = drawOptions;
  
  const svgWidth = width * sizeCell;
  const svgHeight = height * sizeCell;
  
  // Add space for progress bar if requested
  const progressBarHeight = animationOptions.showProgressBar ? 20 : 0;
  const progressBarPadding = animationOptions.showProgressBar ? 10 : 0;
  const totalSvgHeight = svgHeight + progressBarHeight + progressBarPadding;
  
  const totalDuration = grids.length * animationOptions.frameDuration;
  
  let svgElements: string[] = [];
  let styles: string[] = [];
  
  // Generate CSS for animations with step-timing for discrete frames
  styles.push(`
    .cell {
      shape-rendering: geometricPrecision;
      fill: var(--color-dead);
      stroke-width: 1px;
      stroke: var(--color-border);
      width: ${sizeDot}px;
      height: ${sizeDot}px;
      rx: ${sizeDotBorderRadius}px;
      animation: cell-animation ${totalDuration}ms steps(${grids.length}) infinite;
    }
  `);

  // Add progress bar styles if requested
  if (animationOptions.showProgressBar) {
    styles.push(`
      .progress-bar-bg {
        fill: var(--color-dead);
        stroke: var(--color-border);
        stroke-width: 1px;
      }
      .progress-bar-fill {
        fill: var(--color-alive);
        animation: progress-animation ${totalDuration}ms linear infinite;
      }
      @keyframes progress-animation {
        0% { width: 0; }
        100% { width: ${svgWidth - 2}px; }
      }
    `);
  }
  
  // Create keyframes for each cell
  const cellAnimations = new Map<string, string[]>();
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const cellId = `cell-${x}-${y}`;
      const keyframes: string[] = [];
      
      grids.forEach((grid, frameIndex) => {
        const cell = grid.cells[x][y];
        const timePercent = (frameIndex / grids.length) * 100;
        
        // Get color based on contribution level
        const fillColor = getCellColor(cell, drawOptions);
        
        keyframes.push(`${timePercent.toFixed(2)}% { fill: ${fillColor}; }`);
      });
      
      // Add final keyframe to complete the loop
      const finalCell = grids[0].cells[x][y];
      const finalColor = getCellColor(finalCell, drawOptions);
      keyframes.push(`100% { fill: ${finalColor}; }`);
      
      if (keyframes.length > 0) {
        const animationName = `anim-${cellId}`;
        styles.push(`
          @keyframes ${animationName} {
            ${keyframes.join('\n            ')}
          }
          .${cellId} {
            animation-name: ${animationName};
          }
        `);
        
        // Create the cell element
        const cellX = x * sizeCell + (sizeCell - sizeDot) / 2;
        const cellY = y * sizeCell + (sizeCell - sizeDot) / 2;
        
        svgElements.push(`
          <rect
            class="cell ${cellId}"
            x="${cellX}"
            y="${cellY}"
          />
        `);
      }
    }
  }

  // Add progress bar elements if requested
  if (animationOptions.showProgressBar) {
    const progressY = svgHeight + progressBarPadding;
    svgElements.push(`
      <rect
        class="progress-bar-bg"
        x="1"
        y="${progressY}"
        width="${svgWidth - 2}"
        height="${progressBarHeight - 2}"
        rx="3"
      />
      <rect
        class="progress-bar-fill"
        x="1"
        y="${progressY}"
        width="0"
        height="${progressBarHeight - 2}"
        rx="3"
      />
    `);
  }
  
  // Build the complete SVG
  const cssVars = `
    :root {
      --color-alive: ${colorAlive};
      --color-dead: ${colorDead};
      --color-border: ${colorBorder};
    }
  `;
  
  const darkModeCSS = drawOptions.dark ? `
    @media (prefers-color-scheme: dark) {
      :root {
        --color-alive: ${drawOptions.dark.colorAlive};
        --color-dead: ${drawOptions.dark.colorDead};
        --color-border: ${drawOptions.dark.colorBorder || colorBorder};
      }
    }
  ` : '';
  
  return `
    <svg
      width="${svgWidth}"
      height="${totalSvgHeight}"
      viewBox="0 0 ${svgWidth} ${totalSvgHeight}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <style>
          ${cssVars}
          ${darkModeCSS}
          ${styles.join('\n          ')}
        </style>
      </defs>
      ${svgElements.join('\n      ')}
    </svg>
  `.trim();
}

export function createStaticSvg(
  grid: Grid,
  drawOptions: DrawOptions
): string {
  const { width, height } = grid;
  const { sizeCell, sizeDot, sizeDotBorderRadius, colorAlive, colorDead, colorBorder } = drawOptions;
  
  const svgWidth = width * sizeCell;
  const svgHeight = height * sizeCell;
  
  let svgElements: string[] = [];
  
  // Create static cells without animation
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const cell = grid.cells[x][y];
      const cellX = x * sizeCell + (sizeCell - sizeDot) / 2;
      const cellY = y * sizeCell + (sizeCell - sizeDot) / 2;
      
      const fillColor = getCellColor(cell, drawOptions);
      
      svgElements.push(`
        <rect
          x="${cellX}"
          y="${cellY}"
          width="${sizeDot}"
          height="${sizeDot}"
          rx="${sizeDotBorderRadius}"
          fill="${fillColor}"
          stroke="${colorBorder}"
          stroke-width="1"
          shape-rendering="geometricPrecision"
        />
      `);
    }
  }
  
  return `
    <svg
      width="${svgWidth}"
      height="${svgHeight}"
      viewBox="0 0 ${svgWidth} ${svgHeight}"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${svgElements.join('\n      ')}
    </svg>
  `.trim();
}

// Enhanced SVG creator with initial display timing and progress bar
export function createShowcaseSvg(
  grids: Grid[],
  drawOptions: DrawOptions,
  animationOptions: AnimationOptions
): string {
  // Create enhanced frame sequence with extended initial display only
  const enhancedGrids = createSimpleFrameSequence(grids, animationOptions);
  
  // Use the regular SVG creator with the enhanced frame sequence and progress bar
  return createSvg(enhancedGrids, drawOptions, {
    ...animationOptions,
    generations: enhancedGrids.length
  });
}

function createSimpleFrameSequence(
  originalGrids: Grid[],
  options: AnimationOptions
): Grid[] {
  if (originalGrids.length === 0) return originalGrids;
  
  const enhancedFrames: Grid[] = [];
  const initialGrid = originalGrids[0];
  
  // Extended initial display (show original contribution pattern longer)
  const initialDisplayFrames = Math.ceil((options.initialDisplayDuration || 3000) / options.frameDuration);
  for (let i = 0; i < initialDisplayFrames; i++) {
    enhancedFrames.push(JSON.parse(JSON.stringify(initialGrid)));
  }
  
  // Add evolution frames without any pauses
  for (let i = 1; i < originalGrids.length; i++) {
    enhancedFrames.push(JSON.parse(JSON.stringify(originalGrids[i])));
  }
  
  return enhancedFrames;
}
