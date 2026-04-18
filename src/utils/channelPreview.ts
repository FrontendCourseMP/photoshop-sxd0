import type { ImageDocument } from "../types/image";

export type PreviewChannel = "grayscale" | "red" | "green" | "blue" | "alpha";

function createChannelImageData(
  imageData: ImageData,
  channel: PreviewChannel
): ImageData {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data.length);

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];

    if (channel === "grayscale") {
      output[index] = red;
      output[index + 1] = red;
      output[index + 2] = red;
      output[index + 3] = 255;
      continue;
    }

    if (channel === "alpha") {
      output[index] = alpha;
      output[index + 1] = alpha;
      output[index + 2] = alpha;
      output[index + 3] = 255;
      continue;
    }

    output[index] = channel === "red" ? red : 0;
    output[index + 1] = channel === "green" ? green : 0;
    output[index + 2] = channel === "blue" ? blue : 0;
    output[index + 3] = 255;
  }

  return new ImageData(output, width, height);
}

function imageDataToDataUrl(imageData: ImageData): string {
  const sourceCanvas = document.createElement("canvas");
  const sourceContext = sourceCanvas.getContext("2d");

  if (!sourceContext) {
    throw new Error("2D canvas context is not available.");
  }

  sourceCanvas.width = imageData.width;
  sourceCanvas.height = imageData.height;
  sourceContext.putImageData(imageData, 0, 0);

  const previewCanvas = document.createElement("canvas");
  const previewContext = previewCanvas.getContext("2d");

  if (!previewContext) {
    throw new Error("2D canvas context is not available.");
  }

  previewCanvas.width = 88;
  previewCanvas.height = 64;

  previewContext.fillStyle = "#1f1f1f";
  previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

  const scale = Math.min(
    previewCanvas.width / imageData.width,
    previewCanvas.height / imageData.height
  );

  const targetWidth = Math.max(1, Math.round(imageData.width * scale));
  const targetHeight = Math.max(1, Math.round(imageData.height * scale));
  const offsetX = Math.floor((previewCanvas.width - targetWidth) / 2);
  const offsetY = Math.floor((previewCanvas.height - targetHeight) / 2);

  previewContext.imageSmoothingEnabled = true;
  previewContext.drawImage(
    sourceCanvas,
    0,
    0,
    imageData.width,
    imageData.height,
    offsetX,
    offsetY,
    targetWidth,
    targetHeight
  );

  return previewCanvas.toDataURL("image/png");
}

export function createChannelPreviewUrl(
  imageData: ImageData,
  channel: PreviewChannel
): string {
  const channelImageData = createChannelImageData(imageData, channel);
  return imageDataToDataUrl(channelImageData);
}

export function getVisibleChannelKeys(document: ImageDocument): PreviewChannel[] {
  if (document.channelModel === "grayscale") {
    return document.hasMask ? ["grayscale", "alpha"] : ["grayscale"];
  }

  return document.hasMask
    ? ["red", "green", "blue", "alpha"]
    : ["red", "green", "blue"];
}