import { ContributionCell } from '../core/types';

export interface GitHubUserContributionOptions {
  githubToken: string;
}

export async function getGitHubUserContribution(
  userName: string,
  options: GitHubUserContributionOptions
): Promise<ContributionCell[]> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                contributionLevel
                weekday
                date
              }
            }
          }
        }
      }
    }
  `;
  
  const variables = { login: userName };
  
  const response = await fetch('https://api.github.com/graphql', {
    headers: {
      'Authorization': `bearer ${options.githubToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'gol'
    },
    method: 'POST',
    body: JSON.stringify({ variables, query })
  });
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
  
  const responseData = await response.json() as { data?: any; errors?: any[] };
  const { data, errors } = responseData;
  
  if (errors?.[0]) {
    throw new Error(`GraphQL error: ${errors[0].message}`);
  }
  
  const weeks = data.user.contributionsCollection.contributionCalendar.weeks;
  
  return weeks.flatMap((week: any, x: number) =>
    week.contributionDays.map((day: any) => ({
      x,
      y: day.weekday,
      date: day.date,
      count: day.contributionCount,
      level: day.contributionLevel
    }))
  );
}

export function contributionToInitialPattern(cells: ContributionCell[]): Array<{ x: number; y: number; level: number }>  {
  // Convert contribution data to initial Seeds pattern
  console.log(`🔍 Processing ${cells.length} contribution cells...`);
  
  const pattern: Array<{ x: number; y: number; level: number }> = [];
  
  // Helper function to convert GitHub's string levels to numbers
  function getNumericLevel(level: any): number {
    if (typeof level === 'number') return level;
    
    // GitHub uses string-based contribution levels
    switch (level) {
      case 'NONE': return 0;
      case 'FIRST_QUARTILE': return 1;
      case 'SECOND_QUARTILE': return 2;
      case 'THIRD_QUARTILE': return 3;
      case 'FOURTH_QUARTILE': return 4;
      default: 
        // Fallback for any numeric values or unknown strings
        const num = parseInt(String(level));
        return isNaN(num) ? 0 : num;
    }
  }
  
  // Count contributions by level for debugging (convert to numeric first)
  const levelCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  const stringLevelCounts: Record<string, number> = {};
  
  cells.forEach(cell => {
    const numericLevel = getNumericLevel(cell.level);
    levelCounts[numericLevel] = (levelCounts[numericLevel] || 0) + 1;
    
    // Also track string levels for debugging
    const stringLevel = String(cell.level);
    stringLevelCounts[stringLevel] = (stringLevelCounts[stringLevel] || 0) + 1;
  });
  
  console.log(`📊 Contribution levels (numeric): Level 0: ${levelCounts[0]}, Level 1: ${levelCounts[1]}, Level 2: ${levelCounts[2]}, Level 3: ${levelCounts[3]}, Level 4: ${levelCounts[4]}`);
  console.log(`📊 Original GitHub levels:`, stringLevelCounts);
  
  // Strategy 1: Use ALL cells with contributions (level > 0) directly with their actual levels
  // This faithfully represents your actual GitHub contribution pattern with proper colors
  cells.forEach(cell => {
    const numericLevel = getNumericLevel(cell.level);
    if (numericLevel > 0) {
      pattern.push({ x: cell.x, y: cell.y, level: numericLevel });
    }
  });
  
  console.log(`✨ Found ${pattern.length} cells with contributions (level > 0)`);
  
  // Strategy 2: If we have very few contributions, add some strategic cells to ensure evolution
  const totalCells = cells.length;
  const contributionDensity = pattern.length / totalCells;
  const minDesiredDensity = 0.03; // At least 3% density for interesting evolution
  
  if (contributionDensity < minDesiredDensity && pattern.length > 0) {
    console.log(`📈 Low contribution density (${(contributionDensity * 100).toFixed(1)}%), adding strategic cells...`);
    
    // Add strategic cells around existing contributions to create clusters
    const existingCells = new Set(pattern.map(p => `${p.x},${p.y}`));
    const additionalCells: Array<{ x: number; y: number; level: number }> = [];
    
    pattern.forEach(cell => {
      // Add neighbors to create clusters (Seeds thrives on clusters that create expanding patterns)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          
          const nx = cell.x + dx;
          const ny = cell.y + dy;
          const key = `${nx},${ny}`;
          
          // Check if it's a valid cell in our grid and not already included
          if (nx >= 0 && ny >= 0 && !existingCells.has(key)) {
            const originalCell = cells.find(c => c.x === nx && c.y === ny);
            if (originalCell && Math.random() < 0.3) { // 30% chance to add neighbors
              const neighborLevel = getNumericLevel(originalCell.level);
              // Use a slightly lower level for strategic additions, but at least 1
              const strategicLevel = Math.max(1, neighborLevel > 0 ? neighborLevel : 1);
              additionalCells.push({ x: nx, y: ny, level: strategicLevel });
              existingCells.add(key);
            }
          }
        }
      }
    });
    
    pattern.push(...additionalCells);
    console.log(`🎯 Added ${additionalCells.length} strategic cells around contributions`);
  }
  
  // Strategy 3: If still empty (user has no contributions at all), create a seed pattern
  if (pattern.length === 0) {
    console.log(`⚠️ No contributions found, using fallback seed pattern`);
    
    // Create a simple but interesting seed pattern in the center-ish area with varied levels
    const seedPatterns = [
      // Glider gun-like pattern with varied contribution levels
      { x: 10, y: 2, level: 2 }, { x: 11, y: 2, level: 3 }, { x: 10, y: 3, level: 1 }, { x: 11, y: 3, level: 4 },
      { x: 20, y: 2, level: 3 }, { x: 21, y: 1, level: 2 }, { x: 21, y: 3, level: 4 }, { x: 22, y: 1, level: 1 }, { x: 22, y: 3, level: 2 }, { x: 23, y: 2, level: 3 },
      // Some random scattered cells with varied levels
      { x: 5, y: 1, level: 1 }, { x: 6, y: 2, level: 3 }, { x: 7, y: 1, level: 2 },
      { x: 35, y: 3, level: 4 }, { x: 36, y: 4, level: 2 }, { x: 37, y: 3, level: 1 },
      { x: 45, y: 1, level: 2 }, { x: 46, y: 2, level: 4 }, { x: 47, y: 3, level: 3 }
    ];
    
    // Determine bounds - use default GitHub contribution grid size if no cells provided
    let maxX = 52; // Default GitHub contribution grid width (53 weeks - 1 for 0-indexing)
    let maxY = 6;  // Default GitHub contribution grid height (7 days - 1 for 0-indexing)
    
    if (cells.length > 0) {
      maxX = Math.max(...cells.map(c => c.x));
      maxY = Math.max(...cells.map(c => c.y));
    }
    
    seedPatterns.forEach(seed => {
      if (seed.x <= maxX && seed.y <= maxY) {
        pattern.push(seed);
      }
    });
    
    console.log(`🌱 Added ${pattern.length} seed pattern cells with varied contribution levels`);
  }
  
  console.log(`🎯 Final pattern: ${pattern.length} living cells (${(pattern.length / (cells.length || 371) * 100).toFixed(1)}% density)`);
  
  return pattern;
}
