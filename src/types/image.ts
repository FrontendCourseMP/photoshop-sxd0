export type SupportedImageFormat = "png" | "jpg" | "jpeg" | "gb7";
export type ChannelModel = "grayscale" | "rgb";
export type ImageChannelCount = 1 | 2 | 3 | 4;

export interface ImageDocument {
  fileName: string;
  format: SupportedImageFormat;
  width: number;
  height: number;
  colorDepth: string;
  hasMask: boolean;
  channelModel: ChannelModel;
  channelCount: ImageChannelCount;
  imageData: ImageData;
}

export interface ChannelVisibility {
  red: boolean;
  green: boolean;
  blue: boolean;
  alpha: boolean;
}

export type ToolMode = "none" | "eyedropper";

export interface SampledPixelInfo {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
  lab: {
    l: number;
    a: number;
    b: number;
  };
}
