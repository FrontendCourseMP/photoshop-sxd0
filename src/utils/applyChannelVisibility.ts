import type { ChannelVisibility } from "../types/image";

export function applyChannelVisibility(
  sourceImageData: ImageData,
  channels: ChannelVisibility
): ImageData {
  const { width, height, data } = sourceImageData;
  const output = new Uint8ClampedArray(data.length);

  const activeRgbCount =
    Number(channels.red) + Number(channels.green) + Number(channels.blue);

  const alphaOnly =
    channels.alpha &&
    !channels.red &&
    !channels.green &&
    !channels.blue;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];

    if (alphaOnly) {
      output[index] = alpha;
      output[index + 1] = alpha;
      output[index + 2] = alpha;
      output[index + 3] = 255;
      continue;
    }

    output[index] = channels.red ? red : 0;
    output[index + 1] = channels.green ? green : 0;
    output[index + 2] = channels.blue ? blue : 0;

    if (channels.alpha) {
      output[index + 3] = alpha;
    } else {
      output[index + 3] = 255;
    }

    if (activeRgbCount === 0 && !channels.alpha) {
      output[index] = 0;
      output[index + 1] = 0;
      output[index + 2] = 0;
      output[index + 3] = 255;
    }
  }

  return new ImageData(output, width, height);
}