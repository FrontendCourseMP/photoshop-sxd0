import type { ImageDocument, SupportedImageFormat } from "../types/image";
import { analyzeImageData } from "./analyzeImageData";

const MAX_STANDARD_IMAGE_PIXELS = 20_000_000;

function getFormatFromFile(file: File): SupportedImageFormat {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "png") {
    return "png";
  }

  if (extension === "jpg" || extension === "jpeg") {
    return extension;
  }

  throw new Error("Unsupported file format. Please choose PNG or JPG image.");
}

function getColorDepth(
  format: SupportedImageFormat,
  hasAlpha: boolean,
  channelModel: "grayscale" | "rgb"
): string {
  if (channelModel === "grayscale") {
    return hasAlpha ? "8-bit grayscale + alpha" : "8-bit grayscale";
  }

  if (format === "png" && hasAlpha) {
    return "32-bit RGBA";
  }

  return "24-bit RGB";
}

function validateImageSize(width: number, height: number): void {
  const totalPixels = width * height;

  if (totalPixels > MAX_STANDARD_IMAGE_PIXELS) {
    throw new Error(
      `Image is too large: ${width} × ${height} (${(
        totalPixels / 1_000_000
      ).toFixed(1)} MP). Maximum supported size is ${(
        MAX_STANDARD_IMAGE_PIXELS / 1_000_000
      ).toFixed(0)} MP.`
    );
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Failed to load image in browser environment."));

    image.src = src;
  });
}

async function loadImageBitmap(file: File): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap !== "function") {
    return null;
  }

  try {
    return await createImageBitmap(file);
  } catch {
    return null;
  }
}

function createImageDocumentFromSource(
  fileName: string,
  format: SupportedImageFormat,
  source: CanvasImageSource,
  width: number,
  height: number
): ImageDocument {
  validateImageSize(width, height);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error("2D canvas context is not available.");
  }

  canvas.width = width;
  canvas.height = height;

  context.drawImage(source, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const analysis = analyzeImageData(imageData);

  return {
    fileName,
    format,
    width,
    height,
    colorDepth: getColorDepth(
      format,
      analysis.hasAlpha,
      analysis.channelModel
    ),
    hasMask: analysis.hasAlpha,
    channelModel: analysis.channelModel,
    imageData,
  };
}

async function createImageDataFromFile(file: File): Promise<ImageDocument> {
  const format = getFormatFromFile(file);
  const bitmap = await loadImageBitmap(file);

  if (bitmap) {
    try {
      return createImageDocumentFromSource(
        file.name,
        format,
        bitmap,
        bitmap.width,
        bitmap.height
      );
    } finally {
      bitmap.close();
    }
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadHtmlImage(objectUrl);

    return createImageDocumentFromSource(
      file.name,
      format,
      image,
      image.naturalWidth,
      image.naturalHeight
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function loadStandardImage(file: File): Promise<ImageDocument> {
  return createImageDataFromFile(file);
}