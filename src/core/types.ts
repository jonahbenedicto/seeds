export interface Point {
  x: number;
  y: number;
}

export interface Cell extends Point {
  alive: boolean;
  age: number;
  contributionLevel?: number; // 0-4 for GitHub contribution levels, or random value
}

export interface Grid {
  width: number;
  height: number;
  cells: Cell[][];
}

export interface SeedsOptions {
  width: number;
  height: number;
  generations: number;
  survivalRate: number;
  initialPattern?: 'random' | 'two-cluster' | 'seeds-explosion' | 'contribution-based';
  initialDensity?: number;
}

export interface AnimationOptions {
  frameDuration: number;
  generations: number;
  initialDisplayDuration?: number;  // How long to show initial pattern
  showProgressBar?: boolean;        // Show progress bar during animation
}

export interface DrawOptions {
  colorAlive: string;
  colorDead: string;
  colorBorder: string;
  sizeCell: number;
  sizeDot: number;
  sizeDotBorderRadius: number;
  // GitHub contribution level colors (level 0-4)
  contributionColors?: string[];
  dark?: {
    colorAlive: string;
    colorDead: string;
    colorBorder?: string;
    contributionColors?: string[];
  };
}

export interface ContributionCell {
  x: number;
  y: number;
  date: string;
  count: number;
  level: number;
}
