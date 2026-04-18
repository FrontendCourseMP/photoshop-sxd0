import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import { Box, Paper, Typography } from "@mui/material";
import type { ToolMode } from "../types/image";

interface CanvasViewportProps {
  hasImage: boolean;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  errorMessage: string;
  fileName: string;
  toolMode: ToolMode;
  onCanvasClick: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
}

function CanvasViewport({
  hasImage,
  canvasRef,
  errorMessage,
  fileName,
  toolMode,
  onCanvasClick,
}: CanvasViewportProps) {
  const eyedropperActive = hasImage && toolMode === "eyedropper";

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
            position: "relative",
          }}
        >
          {eyedropperActive && (
            <Box
              sx={{
                position: "absolute",
                top: 16,
                left: 16,
                zIndex: 1,
                px: 1.25,
                py: 0.5,
                border: "1px solid #7e57c2",
                borderRadius: 1,
                backgroundColor: "rgba(30, 30, 30, 0.92)",
                color: "#d1c4e9",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Eyedropper active — click on image
            </Box>
          )}

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
                onClick={onCanvasClick}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  height: "auto",
                  boxShadow: eyedropperActive
                    ? "0 0 0 1px rgba(126, 87, 194, 0.55)"
                    : "0 0 0 1px rgba(255,255,255,0.06)",
                  cursor: toolMode === "eyedropper" ? "crosshair" : "default",
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