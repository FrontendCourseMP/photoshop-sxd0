import type {
  EdgeHandlingStrategy,
  FilterChannels,
  Kernel3x3,
} from "../types/filters";

export interface ConvolutionFilterOptions {
  kernel: Kernel3x3;
  channels: FilterChannels;
  edgeHandling: EdgeHandlingStrategy;
}

function clampByte(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(Math.max(Math.round(value), 0), 255);
}

function clampCoordinate(value: number, maxValue: number): number {
  return Math.min(Math.max(value, 0), maxValue);
}

function getChannelOffset(channelIndex: number): keyof FilterChannels {
  if (channelIndex === 0) {
    return "red";
  }

  if (channelIndex === 1) {
    return "green";
  }

  if (channelIndex === 2) {
    return "blue";
  }

  return "alpha";
}

function getPaddingValue(
  sourceData: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channelOffset: number,
  edgeHandling: EdgeHandlingStrategy
): number {
  if (x >= 0 && x < width && y >= 0 && y < height) {
    return sourceData[(y * width + x) * 4 + channelOffset];
  }

  if (edgeHandling === "black") {
    return 0;
  }

  if (edgeHandling === "white") {
    return 255;
  }

  const copiedX = clampCoordinate(x, width - 1);
  const copiedY = clampCoordinate(y, height - 1);

  return sourceData[(copiedY * width + copiedX) * 4 + channelOffset];
}

function hasSelectedChannels(channels: FilterChannels): boolean {
  return channels.red || channels.green || channels.blue || channels.alpha;
}

export function applyConvolutionFilterToImageData(
  sourceImageData: ImageData,
  options: ConvolutionFilterOptions
): ImageData {
  const { kernel, channels, edgeHandling } = options;
  const { width, height, data } = sourceImageData;
  const output = new Uint8ClampedArray(data);

  if (!hasSelectedChannels(channels)) {
    return new ImageData(output, width, height);
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const targetOffset = (y * width + x) * 4;

      for (let channelOffset = 0; channelOffset < 4; channelOffset += 1) {
        const channel = getChannelOffset(channelOffset);

        if (!channels[channel]) {
          continue;
        }

        let accumulator = 0;
        let kernelIndex = 0;

        for (let kernelY = -1; kernelY <= 1; kernelY += 1) {
          for (let kernelX = -1; kernelX <= 1; kernelX += 1) {
            const sourceValue = getPaddingValue(
              data,
              width,
              height,
              x + kernelX,
              y + kernelY,
              channelOffset,
              edgeHandling
            );

            accumulator += sourceValue * kernel[kernelIndex];
            kernelIndex += 1;
          }
        }

        output[targetOffset + channelOffset] = clampByte(accumulator);
      }
    }
  }

  return new ImageData(output, width, height);
}