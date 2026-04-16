export type SupportedImageFormat = "png" | "jpg" | "jpeg" | "gb7";

export interface ImageDocument {
  fileName: string;
  format: SupportedImageFormat;
  width: number;
  height: number;
  colorDepth: string;
  hasMask: boolean;
  imageData: ImageData;
}