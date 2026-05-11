import type { ChannelModel } from "../types/image";

interface ImageDataAnalysis {
  hasAlpha: boolean;
  channelModel: ChannelModel;
}

export function analyzeImageData(imageData: ImageData): ImageDataAnalysis {
  const { data } = imageData;
  let hasAlpha = false;
  let isGrayscale = true;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];

    if (alpha < 255) {
      hasAlpha = true;
    }

    if (red !== green || green !== blue) {
      isGrayscale = false;
    }

    if (hasAlpha && !isGrayscale) {
      break;
    }
  }

  return {
    hasAlpha,
    channelModel: isGrayscale ? "grayscale" : "rgb",
  };
}

export function imageDataHasAlpha(imageData: ImageData): boolean {
  const { data } = imageData;

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) {
      return true;
    }
  }

  return false;
}

export function detectChannelModel(imageData: ImageData): ChannelModel {
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];

    if (red !== green || green !== blue) {
      return "rgb";
    }
  }

  return "grayscale";
}

export function cloneImageData(imageData: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}