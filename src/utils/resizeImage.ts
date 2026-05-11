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

function resizeNearest(
  sourceImageData: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const sourceWidth = sourceImageData.width;
  const sourceHeight = sourceImageData.height;
  const sourceData = sourceImageData.data;
  const output = new Uint8ClampedArray(targetWidth * targetHeight * 4);

  const sourceXByTargetX = new Int32Array(targetWidth);

  for (let targetX = 0; targetX < targetWidth; targetX += 1) {
    const sourceX = getSourceCoordinate(targetX, sourceWidth, targetWidth);

    sourceXByTargetX[targetX] = clamp(
      Math.round(sourceX),
      0,
      sourceWidth - 1
    );
  }

  for (let targetY = 0; targetY < targetHeight; targetY += 1) {
    const sourceY = getSourceCoordinate(targetY, sourceHeight, targetHeight);
    const nearestY = clamp(Math.round(sourceY), 0, sourceHeight - 1);
    const sourceRowOffset = nearestY * sourceWidth * 4;
    const targetRowOffset = targetY * targetWidth * 4;

    for (let targetX = 0; targetX < targetWidth; targetX += 1) {
      const sourceOffset = sourceRowOffset + sourceXByTargetX[targetX] * 4;
      const targetOffset = targetRowOffset + targetX * 4;

      output[targetOffset] = sourceData[sourceOffset];
      output[targetOffset + 1] = sourceData[sourceOffset + 1];
      output[targetOffset + 2] = sourceData[sourceOffset + 2];
      output[targetOffset + 3] = sourceData[sourceOffset + 3];
    }
  }

  return new ImageData(output, targetWidth, targetHeight);
}

function resizeBilinear(
  sourceImageData: ImageData,
  targetWidth: number,
  targetHeight: number
): ImageData {
  const sourceWidth = sourceImageData.width;
  const sourceHeight = sourceImageData.height;
  const sourceData = sourceImageData.data;
  const output = new Uint8ClampedArray(targetWidth * targetHeight * 4);

  const x0ByTargetX = new Int32Array(targetWidth);
  const x1ByTargetX = new Int32Array(targetWidth);
  const dxByTargetX = new Float32Array(targetWidth);

  for (let targetX = 0; targetX < targetWidth; targetX += 1) {
    const sourceX = getSourceCoordinate(targetX, sourceWidth, targetWidth);
    const x0 = clamp(Math.floor(sourceX), 0, sourceWidth - 1);
    const x1 = clamp(x0 + 1, 0, sourceWidth - 1);

    x0ByTargetX[targetX] = x0;
    x1ByTargetX[targetX] = x1;
    dxByTargetX[targetX] = sourceX - x0;
  }

  for (let targetY = 0; targetY < targetHeight; targetY += 1) {
    const sourceY = getSourceCoordinate(targetY, sourceHeight, targetHeight);
    const y0 = clamp(Math.floor(sourceY), 0, sourceHeight - 1);
    const y1 = clamp(y0 + 1, 0, sourceHeight - 1);
    const dy = sourceY - y0;

    const sourceTopRowOffset = y0 * sourceWidth * 4;
    const sourceBottomRowOffset = y1 * sourceWidth * 4;
    const targetRowOffset = targetY * targetWidth * 4;

    for (let targetX = 0; targetX < targetWidth; targetX += 1) {
      const x0 = x0ByTargetX[targetX];
      const x1 = x1ByTargetX[targetX];
      const dx = dxByTargetX[targetX];

      const topLeftOffset = sourceTopRowOffset + x0 * 4;
      const topRightOffset = sourceTopRowOffset + x1 * 4;
      const bottomLeftOffset = sourceBottomRowOffset + x0 * 4;
      const bottomRightOffset = sourceBottomRowOffset + x1 * 4;
      const targetOffset = targetRowOffset + targetX * 4;

      for (let channelOffset = 0; channelOffset < 4; channelOffset += 1) {
        const topLeft = sourceData[topLeftOffset + channelOffset];
        const topRight = sourceData[topRightOffset + channelOffset];
        const bottomLeft = sourceData[bottomLeftOffset + channelOffset];
        const bottomRight = sourceData[bottomRightOffset + channelOffset];

        const top = topLeft * (1 - dx) + topRight * dx;
        const bottom = bottomLeft * (1 - dx) + bottomRight * dx;

        output[targetOffset + channelOffset] = Math.round(
          top * (1 - dy) + bottom * dy
        );
      }
    }
  }

  return new ImageData(output, targetWidth, targetHeight);
}

export function resizeImageData(
  sourceImageData: ImageData,
  dimensions: ResizeDimensions,
  interpolationMethod: InterpolationMethod = "bilinear"
): ImageData {
  const targetWidth = validateDimension(dimensions.width, "Width");
  const targetHeight = validateDimension(dimensions.height, "Height");

  if (
    sourceImageData.width === targetWidth &&
    sourceImageData.height === targetHeight
  ) {
    return sourceImageData;
  }

  if (interpolationMethod === "nearest") {
    return resizeNearest(sourceImageData, targetWidth, targetHeight);
  }

  return resizeBilinear(sourceImageData, targetWidth, targetHeight);
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

export function calculateMaxScalePercentForPixelLimit(
  sourceWidth: number,
  sourceHeight: number,
  maxPixels: number
): number {
  const sourcePixels = sourceWidth * sourceHeight;

  if (sourcePixels <= 0 || maxPixels <= 0) {
    return SCALE_PERCENT_MAX;
  }

  const maxScale = Math.floor(Math.sqrt(maxPixels / sourcePixels) * 100);

  return clamp(maxScale, SCALE_PERCENT_MIN, SCALE_PERCENT_MAX);
}