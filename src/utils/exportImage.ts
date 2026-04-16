function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to convert canvas to blob."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(objectUrl);
}

function getBaseFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return fileName;
  }

  return fileName.slice(0, lastDotIndex);
}

export async function exportImageAsPng(
  imageData: ImageData,
  sourceFileName: string
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("2D canvas context is not available.");
  }

  canvas.width = imageData.width;
  canvas.height = imageData.height;

  context.putImageData(imageData, 0, 0);

  const blob = await canvasToBlob(canvas, "image/png");
  downloadBlob(blob, `${getBaseFileName(sourceFileName)}.png`);
}

export async function exportImageAsJpg(
  imageData: ImageData,
  sourceFileName: string
) {
  const sourceCanvas = document.createElement("canvas");
  const sourceContext = sourceCanvas.getContext("2d");

  if (!sourceContext) {
    throw new Error("2D canvas context is not available.");
  }

  sourceCanvas.width = imageData.width;
  sourceCanvas.height = imageData.height;
  sourceContext.putImageData(imageData, 0, 0);

  const outputCanvas = document.createElement("canvas");
  const outputContext = outputCanvas.getContext("2d");

  if (!outputContext) {
    throw new Error("2D canvas context is not available.");
  }

  outputCanvas.width = imageData.width;
  outputCanvas.height = imageData.height;

  outputContext.fillStyle = "#ffffff";
  outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
  outputContext.drawImage(sourceCanvas, 0, 0);

  const blob = await canvasToBlob(outputCanvas, "image/jpeg", 0.92);
  downloadBlob(blob, `${getBaseFileName(sourceFileName)}.jpg`);
}