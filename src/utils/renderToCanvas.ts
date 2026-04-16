export function renderToCanvas(
  canvas: HTMLCanvasElement,
  imageData: ImageData
) {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("2D canvas context is not available.");
  }

  canvas.width = imageData.width;
  canvas.height = imageData.height;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.putImageData(imageData, 0, 0);
}