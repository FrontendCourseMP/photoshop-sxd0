import type { RefObject } from "react";
import { Box, Paper, Typography } from "@mui/material";

interface CanvasViewportProps {
  hasImage: boolean;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  errorMessage: string;
  fileName: string;
}

function CanvasViewport({
  hasImage,
  canvasRef,
  errorMessage,
  fileName,
}: CanvasViewportProps) {
  return (
    <Box className="app-workspace">
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          height: "100%",
          minHeight: 0,
          border: "1px solid #3c3c3c",
          backgroundColor: "#1f1f1f",
          display: "grid",
          gridTemplateRows: "40px minmax(0, 1fr)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            borderBottom: "1px solid #333",
            backgroundColor: "#252526",
            color: "#d4d4d4",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Canvas View
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#a8a8a8",
              maxWidth: "60%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={fileName}
          >
            {fileName || "No file selected"}
          </Typography>
        </Box>

        <Box
          sx={{
            minHeight: 0,
            overflow: "auto",
            p: 2,
          }}
        >
          <Box
            sx={{
              minWidth: "100%",
              minHeight: "100%",
              border: "1px dashed #5a5a5a",
              background:
                "linear-gradient(45deg, #2c2c2c 25%, transparent 25%), linear-gradient(-45deg, #2c2c2c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2c2c2c 75%), linear-gradient(-45deg, transparent 75%, #2c2c2c 75%)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
              p: 2,
            }}
          >
            {hasImage ? (
              <canvas
                ref={canvasRef}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  height: "auto",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                }}
              />
            ) : (
              <Typography
                variant="body1"
                sx={{
                  color: errorMessage ? "#ff8a80" : "#bdbdbd",
                  textAlign: "center",
                  maxWidth: 420,
                  lineHeight: 1.6,
                }}
              >
                {errorMessage ||
                  "No image loaded yet. Use the Open button to load PNG, JPG or GB7 image and display it on the canvas."}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default CanvasViewport;