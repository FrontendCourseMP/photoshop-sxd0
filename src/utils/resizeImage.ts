import type {
  InterpolationMethod,
  ResizeDimensions,
} from "../types/scale";
import {
  SCALE_PERCENT_DEFAULT,
  SCALE_PERCENT_MAX,
  SCALE_PERCENT_MIN,
} from "../types/scale";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function validateDimension(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer.`);
  }

  if (value < 1 || value > 10000) {
    throw new Error(`${fieldName} must be between 1 and 10000 pixels.`);
  }

  return value;
}

function getSourceCoordinate(
  targetCoordinate: number,
  sourceSize: number,
  targetSize: number
): number {
  if (targetSize <= 1 || sourceSize <= 1) {
    return 0;
  }

  return (targetCoordinate * (sourceSize - 1)) / (targetSize - 1);
}

function getPixelOffset(
  width: number,
  x: number,
  y: number,
  channelOffset: number
): number {
  return (y * width + x) * 4 + channelOffset;
}

function sampleNearest(
  sourceData: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  sourceX: number,
  sourceY: number,
  channelOffset: number
): number {
  const nearestX = clamp(Math.round(sourceX), 0, sourceWidth - 1);
  const nearestY = clamp(Math.round(sourceY), 0, sourceHeight - 1);

  return sourceData[getPixelOffset(sourceWidth, nearestX, nearestY, channelOffset)];
}

function sampleBilinear(
  sourceData: Uint8ClampedArray,
  sourceWidth: number,
  sourceHeight: number,
  sourceX: number,
  sourceY: number,
  channelOffset: number
): number {
  const x0 = clamp(Math.floor(sourceX), 0, sourceWidth - 1);
  const y0 = clamp(Math.floor(sourceY), 0, sourceHeight - 1);
  const x1 = clamp(x0 + 1, 0, sourceWidth - 1);
  const y1 = clamp(y0 + 1, 0, sourceHeight - 1);

  const dx = sourceX - x0;
  const dy = sourceY - y0;

  const topLeft = sourceData[getPixelOffset(sourceWidth, x0, y0, channelOffset)];
  const topRight = sourceData[getPixelOffset(sourceWidth, x1, y0, channelOffset)];
  const bottomLeft = sourceData[getPixelOffset(sourceWidth, x0, y1, channelOffset)];
  const bottomRight = sourceData[getPixelOffset(sourceWidth, x1, y1, channelOffset)];

  const top = topLeft * (1 - dx) + topRight * dx;
  const bottom = bottomLeft * (1 - dx) + bottomRight * dx;

  return Math.round(top * (1 - dy) + bottom * dy);
}

export function resizeImageData(
  sourceImageData: ImageData,
  dimensions: ResizeDimensions,
  interpolationMethod: InterpolationMethod = "bilinear"
): ImageData {
  const targetWidth = validateDimension(dimensions.width, "Width");
  const targetHeight = validateDimension(dimensions.height, "Height");

  const sourceWidth = sourceImageData.width;
  const sourceHeight = sourceImageData.height;
  const sourceData = sourceImageData.data;

  if (sourceWidth === targetWidth && sourceHeight === targetHeight) {
    return new ImageData(
      new Uint8ClampedArray(sourceData),
      sourceWidth,
      sourceHeight
    );
  }

  const output = new Uint8ClampedArray(targetWidth * targetHeight * 4);

  for (let targetY = 0; targetY < targetHeight; targetY += 1) {
    const sourceY = getSourceCoordinate(targetY, sourceHeight, targetHeight);

    for (let targetX = 0; targetX < targetWidth; targetX += 1) {
      const sourceX = getSourceCoordinate(targetX, sourceWidth, targetWidth);
      const targetOffset = (targetY * targetWidth + targetX) * 4;

      for (let channelOffset = 0; channelOffset < 4; channelOffset += 1) {
        output[targetOffset + channelOffset] =
          interpolationMethod === "nearest"
            ? sampleNearest(
                sourceData,
                sourceWidth,
                sourceHeight,
                sourceX,
                sourceY,
                channelOffset
              )
            : sampleBilinear(
                sourceData,
                sourceWidth,
                sourceHeight,
                sourceX,
                sourceY,
                channelOffset
              );
      }
    }
  }

  return new ImageData(output, targetWidth, targetHeight);
}

export function calculateDimensionsFromPercent(
  sourceWidth: number,
  sourceHeight: number,
  scalePercent: number
): ResizeDimensions {
  const safeScalePercent = clamp(
    scalePercent,
    SCALE_PERCENT_MIN,
    SCALE_PERCENT_MAX
  );

  return {
    width: Math.max(1, Math.round((sourceWidth * safeScalePercent) / 100)),
    height: Math.max(1, Math.round((sourceHeight * safeScalePercent) / 100)),
  };
}

export function calculateScalePercentToFit(
  sourceWidth: number,
  sourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding: number
): number {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    viewportWidth <= 0 ||
    viewportHeight <= 0
  ) {
    return SCALE_PERCENT_DEFAULT;
  }

  const availableWidth = Math.max(1, viewportWidth - padding * 2);
  const availableHeight = Math.max(1, viewportHeight - padding * 2);

  const scaleByWidth = availableWidth / sourceWidth;
  const scaleByHeight = availableHeight / sourceHeight;
  const scalePercent = Math.floor(Math.min(scaleByWidth, scaleByHeight) * 100);

  return clamp(scalePercent, SCALE_PERCENT_MIN, SCALE_PERCENT_MAX);
}