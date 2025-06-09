import { Point } from '../core/types';

export interface PatternDefinition {
  name: string;
  description: string;
  cells: Point[];
  width: number;
  height: number;
}

/**
 * Library of Seeds cellular automata patterns optimized for different grid sizes
 * Seeds follows B2/S rule: birth on 2 neighbors, no survival (all living cells die)
 */
export class PatternLibrary {
  /**
   * Get a two-cluster pattern suitable for the given grid dimensions
   * Creates two clusters that will generate expanding phoenix-like patterns
   */
  static getTwoClusterPattern(gridWidth: number, gridHeight: number): Point[] {
    const pattern: Point[] = [];
    
    // Simple two-cell pattern at the center for beautiful symmetric expansion
    const centerX = Math.floor(gridWidth / 2);
    const centerY = Math.floor(gridHeight / 2);
    
    // Place two adjacent cells horizontally at the center
    pattern.push({ x: centerX, y: centerY });
    pattern.push({ x: centerX + 1, y: centerY });
    
    return pattern;
  }

  /**
   * Get a seeds explosion pattern suitable for the given grid dimensions
   * Creates scattered seeds that will create explosive expanding patterns
   */
  static getSeedsExplosionPattern(gridWidth: number, gridHeight: number): Point[] {
    const pattern: Point[] = [];
    
    // Create scattered L-shaped tetromino patterns that create nice explosions
    const explosionSeeds: [number, number][] = [
      [0, 0], [0, 1], [1, 0]
    ];
    
    // Place multiple seeds across the grid with spacing
    const numSeeds = Math.min(8, Math.floor((gridWidth * gridHeight) / 50));
    
    for (let i = 0; i < numSeeds; i++) {
      const centerX = Math.floor((gridWidth / (numSeeds + 1)) * (i + 1));
      const centerY = Math.floor(gridHeight / 2) + (i % 2 === 0 ? -5 : 5);
      
      explosionSeeds.forEach(([dx, dy]) => {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
          pattern.push({ x, y });
        }
      });
    }
    
    return pattern;
  }

  /**
   * Get a symmetric phoenix pattern that creates beautiful expanding rings
   */
  static getPhoenixPattern(gridWidth: number, gridHeight: number): Point[] {
    const pattern: Point[] = [];
    
    if (gridWidth < 10 || gridHeight < 10) {
      // Simple cross pattern for small grids
      const centerX = Math.floor(gridWidth / 2);
      const centerY = Math.floor(gridHeight / 2);
      
      const crossPattern: [number, number][] = [
        [-1, 0], [0, 0], [1, 0],
        [0, -1], [0, 1]
      ];
      
      crossPattern.forEach(([dx, dy]) => {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
          pattern.push({ x, y });
        }
      });
    } else {
      // Diamond pattern that creates expanding rings
      const centerX = Math.floor(gridWidth / 2);
      const centerY = Math.floor(gridHeight / 2);
      
      const diamondPattern: [number, number][] = [
        [0, -2], [-1, -1], [0, -1], [1, -1],
        [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0],
        [-1, 1], [0, 1], [1, 1], [0, 2]
      ];
      
      diamondPattern.forEach(([dx, dy]) => {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
          pattern.push({ x, y });
        }
      });
    }
    
    return pattern;
  }

  /**
   * Generate a random sparse pattern optimized for Seeds (lower density)
   */
  static getRandomPattern(gridWidth: number, gridHeight: number, density: number = 0.15): Point[] {
    const pattern: Point[] = [];
    
    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        if (Math.random() < density) {
          pattern.push({ x, y });
        }
      }
    }
    
    return pattern;
  }

  /**
   * Get all available patterns for the given grid size
   */
  static getAvailablePatterns(gridWidth: number, gridHeight: number): PatternDefinition[] {
    return [
      {
        name: 'two-cluster',
        description: 'Two cluster seeds creating phoenix patterns',
        cells: this.getTwoClusterPattern(gridWidth, gridHeight),
        width: gridWidth,
        height: gridHeight
      },
      {
        name: 'seeds-explosion',
        description: 'Scattered seeds creating explosive expanding patterns',
        cells: this.getSeedsExplosionPattern(gridWidth, gridHeight),
        width: gridWidth,
        height: gridHeight
      },
      {
        name: 'phoenix',
        description: 'Symmetric pattern creating expanding rings',
        cells: this.getPhoenixPattern(gridWidth, gridHeight),
        width: gridWidth,
        height: gridHeight
      },
      {
        name: 'random',
        description: 'Random sparse seed distribution',
        cells: this.getRandomPattern(gridWidth, gridHeight),
        width: gridWidth,
        height: gridHeight
      }
    ];
  }
}
