import { DrawOptions } from '../core/types';

export const palettes: Record<string, DrawOptions> = {
  'github-dark': {
    colorAlive: '#00c647',
    colorDead: '#161b22',
    colorBorder: '#1b1f230a',
    sizeCell: 16,
    sizeDot: 12,
    sizeDotBorderRadius: 2,
    // GitHub contribution level colors (light to dark green)
    contributionColors: [
      '#161b22',  // Level 0 - no contributions (same as dead)
      '#0e4429',  // Level 1 - light green
      '#006d32',  // Level 2 - medium-light green
      '#26a641',  // Level 3 - medium green
      '#39d353'   // Level 4 - bright green
    ],
    dark: {
      colorAlive: '#00c647',
      colorDead: '#161b22',
      colorBorder: '#1b1f230a',
      contributionColors: [
        '#161b22',  // Level 0 - no contributions
        '#0e4429',  // Level 1 - light green
        '#006d32',  // Level 2 - medium-light green  
        '#26a641',  // Level 3 - medium green
        '#39d353'   // Level 4 - bright green
      ]
    }
  }
};

// Set github-dark as the default
palettes['github'] = palettes['github-dark'];
palettes['default'] = palettes['github-dark'];

export function getPalette(name: string): DrawOptions {
  return palettes[name] || palettes['default'];
}
