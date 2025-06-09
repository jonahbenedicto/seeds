import { Grid, Cell, SeedsOptions, Point } from './types';

export class SeedsAutomaton {
  private grid: Grid;
  private options: SeedsOptions;
  private generation: number = 0;

  constructor(options: SeedsOptions) {
    this.options = options;
    this.grid = this.createEmptyGrid();
    this.initializePattern();
  }

  private createEmptyGrid(): Grid {
    const cells: Cell[][] = [];
    for (let x = 0; x < this.options.width; x++) {
      cells[x] = [];
      for (let y = 0; y < this.options.height; y++) {
        cells[x][y] = {
          x,
          y,
          alive: false,
          age: 0,
          contributionLevel: 0
        };
      }
    }
    return {
      width: this.options.width,
      height: this.options.height,
      cells
    };
  }

  private initializePattern(): void {
    switch (this.options.initialPattern) {
      case 'random':
        this.initializeRandom();
        break;
      case 'two-cluster':
        this.initializeTwoCluster();
        break;
      case 'seeds-explosion':
        this.initializeSeedsExplosion();
        break;
      default:
        this.initializeRandom();
    }
  }

  private initializeRandom(): void {
    const density = this.options.initialDensity || 0.15; // Lower density for Seeds
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        if (Math.random() < density) {
          // Assign random contribution level for visual variety
          const randomLevel = Math.floor(Math.random() * 4) + 1; // 1-4
          this.setCellAlive(x, y, randomLevel);
        }
      }
    }
  }

  private initializeTwoCluster(): void {
    // Simple two-cell pattern at the center for beautiful symmetric expansion
    const centerX = Math.floor(this.grid.width / 2);
    const centerY = Math.floor(this.grid.height / 2);
    
    // Place exactly two adjacent cells horizontally at the center
    this.setCellAlive(centerX, centerY, 2);
    this.setCellAlive(centerX + 1, centerY, 2);
  }

  private initializeSeedsExplosion(): void {
    // Create a small central cluster that will explode in Seeds
    const centerX = Math.floor(this.grid.width / 2);
    const centerY = Math.floor(this.grid.height / 2);
    
    // Three-cell line (creates interesting explosion in Seeds)
    const pattern = [
      [0, 0], [1, 0], [2, 0],
      [0, 1], [2, 1]
    ];
    
    pattern.forEach(([dx, dy]) => {
      const x = centerX + dx - 1;
      const y = centerY + dy;
      if (x >= 0 && x < this.grid.width && y >= 0 && y < this.grid.height) {
        const randomLevel = Math.floor(Math.random() * 4) + 1; // 1-4
        this.setCellAlive(x, y, randomLevel);
      }
    });
  }

  public initializeFromContribution(contributionPattern: Array<{ x: number; y: number; level?: number }>): void {
    // Reset grid first
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        this.grid.cells[x][y].alive = false;
        this.grid.cells[x][y].age = 0;
        this.grid.cells[x][y].contributionLevel = 0;
      }
    }
    
    // Apply contribution pattern
    contributionPattern.forEach(({ x, y, level }) => {
      if (x >= 0 && x < this.grid.width && y >= 0 && y < this.grid.height) {
        this.setCellAlive(x, y, level || 1);
      }
    });
  }

  private setCellAlive(x: number, y: number, contributionLevel: number = 1): void {
    if (x >= 0 && x < this.grid.width && y >= 0 && y < this.grid.height) {
      this.grid.cells[x][y].alive = true;
      this.grid.cells[x][y].age = 0;
      this.grid.cells[x][y].contributionLevel = contributionLevel;
    }
  }

  private countLivingNeighbors(x: number, y: number): number {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        
        // Implement toroidal (wrap-around) topology
        const nx = ((x + dx) + this.grid.width) % this.grid.width;
        const ny = ((y + dy) + this.grid.height) % this.grid.height;
        
        if (this.grid.cells[nx][ny].alive) {
          count++;
        }
      }
    }
    return count;
  }

  public nextGeneration(): void {
    const newGrid = this.createEmptyGrid();
    
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        const neighbors = this.countLivingNeighbors(x, y);
        const currentCell = this.grid.cells[x][y];
        const newCell = newGrid.cells[x][y];
        
        // Seeds rule (B2/S): 
        // - All living cells die (no survival rule)
        // - Dead cells with exactly 2 neighbors become alive (birth rule)
        if (!currentCell.alive && neighbors === 2) {
          newCell.alive = true;
          newCell.age = 0;
          // For new cells, use the average contribution level of living neighbors
          const neighborLevels: number[] = [];
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (dx === 0 && dy === 0) continue;
              const nx = ((x + dx) + this.grid.width) % this.grid.width;
              const ny = ((y + dy) + this.grid.height) % this.grid.height;
              if (this.grid.cells[nx][ny].alive && this.grid.cells[nx][ny].contributionLevel) {
                neighborLevels.push(this.grid.cells[nx][ny].contributionLevel!);
              }
            }
          }
          // Use average of neighbor levels, or 1 if no levels available
          const avgLevel = neighborLevels.length > 0 
            ? Math.round(neighborLevels.reduce((a, b) => a + b, 0) / neighborLevels.length)
            : 1;
          newCell.contributionLevel = Math.max(1, Math.min(4, avgLevel));
        }
        // All other cells remain dead (Seeds rule: no survival)
      }
    }
    
    this.grid = newGrid;
    this.generation++;
  }

  public getGrid(): Grid {
    return this.grid;
  }

  public getGeneration(): number {
    return this.generation;
  }

  public isExtinct(): boolean {
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        if (this.grid.cells[x][y].alive) {
          return false;
        }
      }
    }
    return true;
  }

  public getCellsAsPoints(): Point[] {
    const points: Point[] = [];
    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        if (this.grid.cells[x][y].alive) {
          points.push({ x, y });
        }
      }
    }
    return points;
  }

  public simulate(generations?: number): Grid[] {
    const maxGens = generations || this.options.generations;
    const history: Grid[] = [];
    
    // Store initial state
    history.push(JSON.parse(JSON.stringify(this.grid)));
    
    for (let i = 0; i < maxGens && !this.isExtinct(); i++) {
      this.nextGeneration();
      history.push(JSON.parse(JSON.stringify(this.grid)));
    }
    
    return history;
  }
}
