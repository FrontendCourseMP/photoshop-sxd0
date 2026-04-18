import type { ChannelModel } from "../types/image";

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