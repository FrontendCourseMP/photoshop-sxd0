import type { ChangeEvent } from "react";
import { Box, Stack, Typography } from "@mui/material";

interface StatusBarProps {
  format: string;
  width: number;
  height: number;
  colorDepth: string;
  hasMask: boolean;
  channelCount: number;
  fileName: string;
  toolMode: string;
  channelsSummary: string;
  hasImage: boolean;
  scalePercent: number;
  scaleMin: number;
  scaleMax: number;
  onScalePercentChange: (value: number) => void;
}

function StatusBar({
  format,
  width,
  height,
  colorDepth,
  hasMask,
  channelCount,
  fileName,
  toolMode,
  channelsSummary,
  hasImage,
  scalePercent,
  scaleMin,
  scaleMax,
  onScalePercentChange,
}: StatusBarProps) {
  const handleScaleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onScalePercentChange(Number(event.target.value));
  };

  return (
    <Box className="app-statusbar">
      <Stack
        direction="row"
        spacing={3}
        sx={{
          width: "100%",
          alignItems: "center",
          color: "#d4d4d4",
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
      >
        <Typography variant="body2" sx={{ color: "#9cdcfe", fontWeight: 500 }}>
          Status
        </Typography>

        <Typography variant="body2">File: {fileName || "—"}</Typography>
        <Typography variant="body2">Format: {format}</Typography>
        <Typography variant="body2">Width: {width}</Typography>
        <Typography variant="body2">Height: {height}</Typography>
        <Typography variant="body2">Color depth: {colorDepth}</Typography>
        <Typography variant="body2">Channels: {channelCount || "—"}</Typography>

        <Typography variant="body2">
          Mask: {hasMask ? "present" : "absent"}
        </Typography>

        <Typography variant="body2">Tool: {toolMode}</Typography>
        <Typography variant="body2">Visible channels: {channelsSummary}</Typography>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="body2">View scale: {scalePercent}%</Typography>

          <input
            type="range"
            min={scaleMin}
            max={scaleMax}
            step={1}
            value={scalePercent}
            disabled={!hasImage}
            onChange={handleScaleChange}
            style={{ width: 140 }}
          />

          <Typography variant="body2">View interpolation: Bilinear</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export default StatusBar;
