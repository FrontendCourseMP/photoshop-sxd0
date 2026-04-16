function getBaseFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return fileName;
  }

  return fileName.slice(0, lastDotIndex);
}

function clampToUint16(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value < 1 || value > 0xffff) {
    throw new Error(
      `GB7 ${fieldName} must be an integer between 1 and 65535.`
    );
  }
}

function toGray7(red: number, green: number, blue: number): number {
  const gray8 = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
  return Math.round((gray8 * 127) / 255);
}

function hasTransparentPixels(imageData: ImageData): boolean {
  const { data } = imageData;

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) {
      return true;
    }
  }

  return false;
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(objectUrl);
}

export async function exportImageAsGB7(
  imageData: ImageData,
  sourceFileName: string
) {
  clampToUint16(imageData.width, "width");
  clampToUint16(imageData.height, "height");

  const width = imageData.width;
  const height = imageData.height;
  const pixelCount = width * height;
  const withMask = hasTransparentPixels(imageData);

  const bytes = new Uint8Array(12 + pixelCount);

  bytes[0] = 0x47;
  bytes[1] = 0x42;
  bytes[2] = 0x37;
  bytes[3] = 0x1d;
  bytes[4] = 0x01;
  bytes[5] = withMask ? 0x01 : 0x00;
  bytes[6] = (width >> 8) & 0xff;
  bytes[7] = width & 0xff;
  bytes[8] = (height >> 8) & 0xff;
  bytes[9] = height & 0xff;
  bytes[10] = 0x00;
  bytes[11] = 0x00;

  const { data } = imageData;

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const rgbaIndex = pixelIndex * 4;

    const red = data[rgbaIndex];
    const green = data[rgbaIndex + 1];
    const blue = data[rgbaIndex + 2];
    const alpha = data[rgbaIndex + 3];

    const gray7 = toGray7(red, green, blue) & 0x7f;

    if (withMask) {
      const visibleBit = alpha >= 128 ? 0x80 : 0x00;
      bytes[12 + pixelIndex] = visibleBit | gray7;
    } else {
      bytes[12 + pixelIndex] = gray7;
    }
  }

  const blob = new Blob([bytes], { type: "application/octet-stream" });
  downloadBlob(blob, `${getBaseFileName(sourceFileName)}.gb7`);
}