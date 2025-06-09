export * from './core/types';
export * from './core/game-engine';
export * from './renderers/svg-renderer';
export * from './renderers/gif-renderer';
export * from './github/api-client';
export * from './core/pattern-generator';
export * from './renderers/color-palettes';

// Main exports for convenience
export { SeedsAutomaton } from './core/game-engine';
export { createSvg, createStaticSvg, createShowcaseSvg } from './renderers/svg-renderer';
export { createGif } from './renderers/gif-renderer';
export { generateSeedsAutomaton, generateSingleSeedsAutomaton } from './core/pattern-generator';
export { getPalette, palettes } from './renderers/color-palettes';
