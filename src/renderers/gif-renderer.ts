import * as fs from 'fs';
import * as path from 'path';
import { createCanvas } from 'canvas';
import { Grid, DrawOptions, AnimationOptions, Cell } from '../core/types';
// @ts-ignore
import GIFEncoder from 'gif-encoder-2';
import tmp from 'tmp';

// Helper function to get cell color based on contribution level
function getCellColor(cell: Cell, drawOptions: DrawOptions): string {
  if (!cell.alive) {
    return drawOptions.contributionColors?.[0] || drawOptions.colorDead;
  }
  
  const contributionLevel = cell.contributionLevel || 1;
  const colors = drawOptions.contributionColors;
    
  if (colors && contributionLevel >= 0 && contributionLevel < colors.length) {
    return colors[contributionLevel];
  }
  
  // Fallback to old behavior
  return drawOptions.colorAlive;
}

export async function createGif(
  grids: Grid[],
  drawOptions: DrawOptions,
  animationOptions: AnimationOptions
): Promise<Buffer> {
  const { width, height } = grids[0];
  const { sizeCell, sizeDot, colorAlive, colorDead, colorBorder } = drawOptions;
  
  const canvasWidth = width * sizeCell;
  const canvasHeight = height * sizeCell;
  
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  
  // Create GIF encoder
  const encoder = new GIFEncoder(canvasWidth, canvasHeight, 'neuquant');
  encoder.setDelay(animationOptions.frameDuration);
  encoder.setRepeat(0); // Infinite loop
  encoder.setQuality(10);
  encoder.start();
  
  // Generate frames
  for (const grid of grids) {
    // Clear canvas
    ctx.fillStyle = colorDead;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw cells
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const cell = grid.cells[x][y];
        const cellX = x * sizeCell + (sizeCell - sizeDot) / 2;
        const cellY = y * sizeCell + (sizeCell - sizeDot) / 2;
        
        // Draw border
        ctx.fillStyle = colorBorder;
        ctx.fillRect(cellX - 1, cellY - 1, sizeDot + 2, sizeDot + 2);
        
        // Draw cell with contribution color
        ctx.fillStyle = getCellColor(cell, drawOptions);
        ctx.fillRect(cellX, cellY, sizeDot, sizeDot);
      }
    }
    
    // Add frame to encoder
    encoder.addFrame(ctx);
  }
  
  encoder.finish();
  
  // Get raw GIF data
  const rawGifData = encoder.out.getData();
  
  // Return raw GIF data (optimization removed for simplicity)
  return rawGifData;
}
