import type { RefObject } from "react";
import { Box, Paper, Typography } from "@mui/material";

interface CanvasViewportProps {
  hasImage: boolean;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

function CanvasViewport({ hasImage, canvasRef }: CanvasViewportProps) {
  return (
    <Box className="app-workspace">
      <Paper
        elevation={0}
        sx={{
          width: "min(960px, 100%)",
          minHeight: "min(640px, 100%)",
          border: "1px solid #3c3c3c",
          backgroundColor: "#1f1f1f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 3,
        }}
      >
        <Box
          sx={{
            width: "100%",
            minHeight: 480,
            border: "1px dashed #5a5a5a",
            background:
              "linear-gradient(45deg, #2c2c2c 25%, transparent 25%), linear-gradient(-45deg, #2c2c2c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2c2c2c 75%), linear-gradient(-45deg, transparent 75%, #2c2c2c 75%)",
            backgroundSize: "24px 24px",
            backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 1,
            overflow: "auto",
            padding: 2,
          }}
        >
          {hasImage ? (
            <canvas
              ref={canvasRef}
              style={{
                display: "block",
                maxWidth: "100%",
                height: "auto",
                imageRendering: "auto",
              }}
            />
          ) : (
            <Typography
              variant="body1"
              sx={{
                color: "#bdbdbd",
                textAlign: "center",
                maxWidth: 360,
                lineHeight: 1.6,
              }}
            >
              No image loaded yet. Use the Open button to load PNG, JPG or GB7
              image and display it on the canvas.
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default CanvasViewport;