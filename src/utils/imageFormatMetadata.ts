import type {
  ChannelModel,
  ImageChannelCount,
  SupportedImageFormat,
} from "../types/image";

export interface StandardImageMetadata {
  width: number;
  height: number;
  bitDepth: number;
  channelModel: ChannelModel;
  hasAlpha: boolean;
  channelCount: ImageChannelCount;
  colorDepth: string;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xc0,
  0xc1,
  0xc2,
  0xc3,
  0xc5,
  0xc6,
  0xc7,
  0xc9,
  0xca,
  0xcb,
  0xcd,
  0xce,
  0xcf,
]);

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  let result = "";

  for (let index = 0; index < length; index += 1) {
    result += String.fromCharCode(bytes[offset + index]);
  }

  return result;
}

function assertPositiveDimensions(width: number, height: number): void {
  if (width <= 0 || height <= 0) {
    throw new Error("Image dimensions must be greater than zero.");
  }
}

function getColorDepthDescription(
  channelModel: ChannelModel,
  hasAlpha: boolean,
  bitDepth: number,
  indexed = false
): string {
  if (indexed) {
    return `${bitDepth}-bit indexed RGB${hasAlpha ? " + alpha" : ""}`;
  }

  if (channelModel === "grayscale") {
    return hasAlpha
      ? `${bitDepth}-bit grayscale + ${bitDepth}-bit alpha`
      : `${bitDepth}-bit grayscale`;
  }

  const totalDepth = bitDepth * (hasAlpha ? 4 : 3);
  return `${totalDepth}-bit ${hasAlpha ? "RGBA" : "RGB"}`;
}

export function parsePngMetadata(buffer: ArrayBuffer): StandardImageMetadata {
  const bytes = new Uint8Array(buffer);

  if (bytes.length < 33) {
    throw new Error("PNG file is too small to contain a valid IHDR chunk.");
  }

  for (let index = 0; index < PNG_SIGNATURE.length; index += 1) {
    if (bytes[index] !== PNG_SIGNATURE[index]) {
      throw new Error("Invalid PNG signature.");
    }
  }

  if (readUint32BE(bytes, 8) !== 13 || readAscii(bytes, 12, 4) !== "IHDR") {
    throw new Error("PNG file does not start with a valid IHDR chunk.");
  }

  const width = readUint32BE(bytes, 16);
  const height = readUint32BE(bytes, 20);
  const bitDepth = bytes[24];
  const colorType = bytes[25];

  assertPositiveDimensions(width, height);

  let hasTransparencyChunk = false;
  let chunkOffset = 8;

  while (chunkOffset + 12 <= bytes.length) {
    const chunkLength = readUint32BE(bytes, chunkOffset);
    const chunkEnd = chunkOffset + 12 + chunkLength;

    if (chunkEnd > bytes.length) {
      throw new Error("PNG contains a truncated chunk.");
    }

    const chunkType = readAscii(bytes, chunkOffset + 4, 4);

    if (chunkType === "tRNS") {
      hasTransparencyChunk = true;
    }

    chunkOffset = chunkEnd;

    if (chunkType === "IEND") {
      break;
    }
  }

  let channelModel: ChannelModel;
  let hasAlpha: boolean;
  let channelCount: ImageChannelCount;
  let indexed = false;

  switch (colorType) {
    case 0:
      channelModel = "grayscale";
      hasAlpha = hasTransparencyChunk;
      channelCount = hasAlpha ? 2 : 1;
      break;
    case 2:
      channelModel = "rgb";
      hasAlpha = hasTransparencyChunk;
      channelCount = hasAlpha ? 4 : 3;
      break;
    case 3:
      channelModel = "rgb";
      hasAlpha = hasTransparencyChunk;
      channelCount = hasAlpha ? 4 : 3;
      indexed = true;
      break;
    case 4:
      channelModel = "grayscale";
      hasAlpha = true;
      channelCount = 2;
      break;
    case 6:
      channelModel = "rgb";
      hasAlpha = true;
      channelCount = 4;
      break;
    default:
      throw new Error(`Unsupported PNG color type: ${colorType}.`);
  }

  return {
    width,
    height,
    bitDepth,
    channelModel,
    hasAlpha,
    channelCount,
    colorDepth: getColorDepthDescription(
      channelModel,
      hasAlpha,
      bitDepth,
      indexed
    ),
  };
}

export function parseJpegMetadata(buffer: ArrayBuffer): StandardImageMetadata {
  const bytes = new Uint8Array(buffer);

  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("Invalid JPEG signature.");
  }

  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset += 1;
    }

    if (offset >= bytes.length) {
      break;
    }

    const marker = bytes[offset];
    offset += 1;

    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      continue;
    }

    if (offset + 2 > bytes.length) {
      break;
    }

    const segmentLength = readUint16BE(bytes, offset);

    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      throw new Error("JPEG contains a truncated segment.");
    }

    if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      if (segmentLength < 8) {
        throw new Error("JPEG start-of-frame segment is invalid.");
      }

      const bitDepth = bytes[offset + 2];
      const height = readUint16BE(bytes, offset + 3);
      const width = readUint16BE(bytes, offset + 5);
      const componentCount = bytes[offset + 7];

      assertPositiveDimensions(width, height);

      const channelModel: ChannelModel =
        componentCount === 1 ? "grayscale" : "rgb";
      const channelCount: ImageChannelCount =
        channelModel === "grayscale" ? 1 : 3;

      return {
        width,
        height,
        bitDepth,
        channelModel,
        hasAlpha: false,
        channelCount,
        colorDepth: getColorDepthDescription(
          channelModel,
          false,
          bitDepth
        ),
      };
    }

    offset += segmentLength;
  }

  throw new Error("JPEG dimensions and channel metadata were not found.");
}

export function parseStandardImageMetadata(
  format: SupportedImageFormat,
  buffer: ArrayBuffer
): StandardImageMetadata {
  if (format === "png") {
    return parsePngMetadata(buffer);
  }

  if (format === "jpg" || format === "jpeg") {
    return parseJpegMetadata(buffer);
  }

  throw new Error(`Unsupported standard image format: ${format}.`);
}
