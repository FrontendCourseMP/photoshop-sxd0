import type { ImageDocument, SupportedImageFormat } from "../types/image";

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

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Failed to load image in browser environment."));

    image.src = src;
  });
}

function getColorDepth(format: SupportedImageFormat): string {
  if (format === "png") {
    return "32-bit RGBA";
  }

  return "24-bit RGB";
}

async function createImageDataFromFile(file: File): Promise<ImageDocument> {
  const format = getFormatFromFile(file);
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadHtmlImage(objectUrl);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("2D canvas context is not available.");
    }

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    return {
      fileName: file.name,
      format,
      width: canvas.width,
      height: canvas.height,
      colorDepth: getColorDepth(format),
      hasMask: false,
      imageData,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function loadStandardImage(file: File): Promise<ImageDocument> {
  return createImageDataFromFile(file);
}