import type { ImageDocument } from "../types/image";

const GB7_SIGNATURE = [0x47, 0x42, 0x37, 0x1d];
const GB7_HEADER_SIZE = 12;
const GB7_VERSION = 0x01;

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function validateSignature(bytes: Uint8Array) {
  for (let index = 0; index < GB7_SIGNATURE.length; index += 1) {
    if (bytes[index] !== GB7_SIGNATURE[index]) {
      throw new Error("Invalid GB7 signature.");
    }
  }
}

export function decodeGB7(buffer: ArrayBuffer, fileName: string): ImageDocument {
  const bytes = new Uint8Array(buffer);

  if (bytes.length < GB7_HEADER_SIZE) {
    throw new Error("GB7 file is too small to contain a valid header.");
  }

  validateSignature(bytes);

  const version = bytes[4];
  const flags = bytes[5];
  const hasMask = (flags & 0x01) !== 0;
  const reservedFlagBits = flags & 0xfe;

  if (version !== GB7_VERSION) {
    throw new Error(`Unsupported GB7 version: ${version}.`);
  }

  if (reservedFlagBits !== 0) {
    throw new Error("GB7 header contains unsupported flag bits.");
  }

  const width = readUint16BE(bytes, 6);
  const height = readUint16BE(bytes, 8);
  const reserved = readUint16BE(bytes, 10);

  if (width === 0 || height === 0) {
    throw new Error("GB7 image dimensions must be greater than zero.");
  }

  if (reserved !== 0) {
    throw new Error("GB7 reserved header bytes must be zero.");
  }

  const pixelCount = width * height;
  const expectedLength = GB7_HEADER_SIZE + pixelCount;

  if (bytes.length !== expectedLength) {
    throw new Error(
      `Invalid GB7 file size. Expected ${expectedLength} bytes, got ${bytes.length}.`
    );
  }

  const rgba = new Uint8ClampedArray(pixelCount * 4);

  for (let index = 0; index < pixelCount; index += 1) {
    const packedPixel = bytes[GB7_HEADER_SIZE + index];
    const gray7 = packedPixel & 0x7f;
    const gray8 = Math.round((gray7 * 255) / 127);

    if (!hasMask && (packedPixel & 0x80) !== 0) {
      throw new Error("GB7 file without mask contains masked pixel bits.");
    }

    const alpha = hasMask ? ((packedPixel & 0x80) !== 0 ? 255 : 0) : 255;
    const rgbaIndex = index * 4;

    rgba[rgbaIndex] = gray8;
    rgba[rgbaIndex + 1] = gray8;
    rgba[rgbaIndex + 2] = gray8;
    rgba[rgbaIndex + 3] = alpha;
  }

  return {
    fileName,
    format: "gb7",
    width,
    height,
    colorDepth: hasMask ? "7-bit grayscale + 1-bit mask" : "7-bit grayscale",
    hasMask,
    channelModel: "grayscale",
    imageData: new ImageData(rgba, width, height),
  };
}