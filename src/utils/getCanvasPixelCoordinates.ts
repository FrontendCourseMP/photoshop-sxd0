export interface CanvasPixelCoordinates {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getCanvasPixelCoordinates(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): CanvasPixelCoordinates {
  const rect = canvas.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    throw new Error("Canvas has zero-sized client rectangle.");
  }

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const rawX = Math.floor((clientX - rect.left) * scaleX);
  const rawY = Math.floor((clientY - rect.top) * scaleY);

  return {
    x: clamp(rawX, 0, canvas.width - 1),
    y: clamp(rawY, 0, canvas.height - 1),
  };
}