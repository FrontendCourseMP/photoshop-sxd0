import type { ChannelModel } from "../types/image";
import type { LevelsInputValues, LevelsSettingsMap } from "../types/levels";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createLevelsLut(values: LevelsInputValues): Uint8Array {
  const lut = new Uint8Array(256);
  const blackPoint = clamp(Math.round(values.blackPoint), 0, 254);
  const whitePoint = clamp(Math.round(values.whitePoint), blackPoint + 1, 255);
  const gamma = clamp(values.gamma, 0.1, 9.9);
  const range = whitePoint - blackPoint;

  for (let index = 0; index < 256; index += 1) {
    const normalized = clamp((index - blackPoint) / range, 0, 1);
    const corrected = Math.pow(normalized, gamma);
    lut[index] = Math.round(corrected * 255);
  }

  return lut;
}

export function applyLevelsToImageData(
  sourceImageData: ImageData,
  channelModel: ChannelModel,
  settings: LevelsSettingsMap
): ImageData {
  const { width, height, data } = sourceImageData;
  const output = new Uint8ClampedArray(data.length);

  const masterLut = createLevelsLut(settings.master);
  const grayscaleLut = createLevelsLut(settings.grayscale);
  const redLut = createLevelsLut(settings.red);
  const greenLut = createLevelsLut(settings.green);
  const blueLut = createLevelsLut(settings.blue);
  const alphaLut = createLevelsLut(settings.alpha);

  for (let index = 0; index < data.length; index += 4) {
    const sourceRed = data[index];
    const sourceGreen = data[index + 1];
    const sourceBlue = data[index + 2];
    const sourceAlpha = data[index + 3];

    if (channelModel === "grayscale") {
      let gray = sourceRed;
      gray = masterLut[gray];
      gray = grayscaleLut[gray];

      output[index] = gray;
      output[index + 1] = gray;
      output[index + 2] = gray;
      output[index + 3] = alphaLut[sourceAlpha];
      continue;
    }

    let red = masterLut[sourceRed];
    let green = masterLut[sourceGreen];
    let blue = masterLut[sourceBlue];

    red = redLut[red];
    green = greenLut[green];
    blue = blueLut[blue];

    output[index] = red;
    output[index + 1] = green;
    output[index + 2] = blue;
    output[index + 3] = alphaLut[sourceAlpha];
  }

  return new ImageData(output, width, height);
}