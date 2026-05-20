import type {
  EdgeHandlingStrategy,
  FilterChannels,
} from "../types/filters";

export interface MedianFilterOptions {
  channels: FilterChannels;
  edgeHandling: EdgeHandlingStrategy;
}

function clampCoordinate(value: number, maxValue: number): number {
  return Math.min(Math.max(value, 0), maxValue);
}

function getChannelKey(channelOffset: number): keyof FilterChannels {
  if (channelOffset === 0) {
    return "red";
  }

  if (channelOffset === 1) {
    return "green";
  }

  if (channelOffset === 2) {
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

function getMedian(values: number[]): number {
  values.sort((left, right) => left - right);

  return values[4];
}

export function applyMedianFilterToImageData(
  sourceImageData: ImageData,
  options: MedianFilterOptions
): ImageData {
  const { channels, edgeHandling } = options;
  const { width, height, data } = sourceImageData;
  const output = new Uint8ClampedArray(data);

  if (!hasSelectedChannels(channels)) {
    return new ImageData(output, width, height);
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const targetOffset = (y * width + x) * 4;

      for (let channelOffset = 0; channelOffset < 4; channelOffset += 1) {
        const channel = getChannelKey(channelOffset);

        if (!channels[channel]) {
          continue;
        }

        const values: number[] = [];

        for (let kernelY = -1; kernelY <= 1; kernelY += 1) {
          for (let kernelX = -1; kernelX <= 1; kernelX += 1) {
            values.push(
              getPaddingValue(
                data,
                width,
                height,
                x + kernelX,
                y + kernelY,
                channelOffset,
                edgeHandling
              )
            );
          }
        }

        output[targetOffset + channelOffset] = getMedian(values);
      }
    }
  }

  return new ImageData(output, width, height);
}