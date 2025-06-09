import { AnimationOptions, DrawOptions } from '../core/types';

export interface GameConfiguration {
  readonly gridWidth: number;
  readonly gridHeight: number;
  readonly maxGenerations: number;
  readonly survivalRate: number;
  readonly defaultDensity: number;
}

export interface RenderConfiguration {
  readonly animation: AnimationOptions;
  readonly drawing: DrawOptions;
}

/**
 * Configuration manager for Seeds cellular automata settings
 */
export class ConfigManager {
  // Standard GitHub contribution graph dimensions
  static readonly GITHUB_GRID = {
    width: 53,
    height: 7
  } as const;

  // Default animation settings
  static readonly DEFAULT_ANIMATION: AnimationOptions = {
    frameDuration: 800,
    generations: 60,
    initialDisplayDuration: 3000,
    showProgressBar: false
  } as const;

  // Preset configurations for different use cases
  static readonly PRESETS = {
    // Quick demo animation
    demo: {
      grid: { width: 30, height: 15 },
      animation: { frameDuration: 400, generations: 30, initialDisplayDuration: 2000, showProgressBar: true },
      maxGenerations: 30,
      survivalRate: 1.0,
      defaultDensity: 0.3
    },
    
    // GitHub profile animation
    profile: {
      grid: ConfigManager.GITHUB_GRID,
      animation: { frameDuration: 800, generations: 60, initialDisplayDuration: 3000, showProgressBar: false },
      maxGenerations: 60,
      survivalRate: 1.0,
      defaultDensity: 0.25
    },
    
    // Fast-paced showcase
    showcase: {
      grid: ConfigManager.GITHUB_GRID,
      animation: { frameDuration: 200, generations: 100, initialDisplayDuration: 4000, showProgressBar: true },
      maxGenerations: 100,
      survivalRate: 1.0,
      defaultDensity: 0.35
    },
    
    // Large canvas for complex patterns
    canvas: {
      grid: { width: 100, height: 50 },
      animation: { frameDuration: 150, generations: 200, initialDisplayDuration: 2000, showProgressBar: true },
      maxGenerations: 200,
      survivalRate: 0.98,
      defaultDensity: 0.4
    }
  } as const;

  /**
   * Get configuration for a specific preset
   */
  static getPreset(presetName: keyof typeof ConfigManager.PRESETS): GameConfiguration {
    const preset = ConfigManager.PRESETS[presetName];
    return {
      gridWidth: preset.grid.width,
      gridHeight: preset.grid.height,
      maxGenerations: preset.maxGenerations,
      survivalRate: preset.survivalRate,
      defaultDensity: preset.defaultDensity
    };
  }

  /**
   * Get animation options for a specific preset
   */
  static getAnimationOptions(presetName: keyof typeof ConfigManager.PRESETS): AnimationOptions {
    return { ...ConfigManager.PRESETS[presetName].animation };
  }

  /**
   * Create custom configuration with validation
   */
  static createCustomConfig(options: Partial<GameConfiguration>): GameConfiguration {
    return {
      gridWidth: Math.max(3, options.gridWidth || ConfigManager.GITHUB_GRID.width),
      gridHeight: Math.max(3, options.gridHeight || ConfigManager.GITHUB_GRID.height),
      maxGenerations: Math.max(1, options.maxGenerations || 60),
      survivalRate: Math.max(0, Math.min(1, options.survivalRate || 1.0)),
      defaultDensity: Math.max(0, Math.min(1, options.defaultDensity || 0.3))
    };
  }

  /**
   * Create custom animation options with validation
   */
  static createAnimationOptions(options: Partial<AnimationOptions>): AnimationOptions {
    return {
      frameDuration: Math.max(50, options.frameDuration || ConfigManager.DEFAULT_ANIMATION.frameDuration),
      generations: Math.max(1, options.generations || ConfigManager.DEFAULT_ANIMATION.generations),
      initialDisplayDuration: Math.max(0, options.initialDisplayDuration || ConfigManager.DEFAULT_ANIMATION.initialDisplayDuration || 0),
      showProgressBar: options.showProgressBar || ConfigManager.DEFAULT_ANIMATION.showProgressBar || false
    };
  }

  /**
   * Validate and normalize grid dimensions
   */
  static validateGridDimensions(width: number, height: number): { width: number; height: number } {
    return {
      width: Math.max(3, Math.min(200, Math.floor(width))),
      height: Math.max(3, Math.min(100, Math.floor(height)))
    };
  }

  /**
   * Get optimal generation count based on grid size
   */
  static getOptimalGenerations(gridWidth: number, gridHeight: number): number {
    const cellCount = gridWidth * gridHeight;
    
    // Smaller grids evolve faster, larger grids need more time
    if (cellCount < 100) return 30;
    if (cellCount < 500) return 60;
    if (cellCount < 1000) return 100;
    return 150;
  }

  /**
   * Get optimal frame duration based on generation count
   */
  static getOptimalFrameDuration(generations: number): number {
    // Longer animations need faster frames
    if (generations > 100) return 150;
    if (generations > 50) return 300;
    return 800;
  }
}
