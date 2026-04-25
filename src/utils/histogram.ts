import type { HistogramData, LevelsChannelTarget } from "../types/levels";

function getMasterValue(red: number, green: number, blue: number): number {
  return Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
}

export function computeHistogram(
  imageData: ImageData,
  channel: LevelsChannelTarget
): HistogramData {
  const bins = new Array<number>(256).fill(0);
  const { data, width, height } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];

    let value = 0;

    switch (channel) {
      case "master":
        value = getMasterValue(red, green, blue);
        break;
      case "grayscale":
        value = red;
        break;
      case "red":
        value = red;
        break;
      case "green":
        value = green;
        break;
      case "blue":
        value = blue;
        break;
      case "alpha":
        value = alpha;
        break;
    }

    bins[value] += 1;
  }

  let maxValue = 0;

  for (const count of bins) {
    if (count > maxValue) {
      maxValue = count;
    }
  }

  return {
    bins,
    maxValue,
    totalPixels: width * height,
  };
}