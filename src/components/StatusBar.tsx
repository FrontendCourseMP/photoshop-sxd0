import { Box, Stack, Typography } from "@mui/material";

interface StatusBarProps {
  format: string;
  width: number;
  height: number;
  colorDepth: string;
  hasMask: boolean;
}

function StatusBar({
  format,
  width,
  height,
  colorDepth,
  hasMask,
}: StatusBarProps) {
  return (
    <Box className="app-statusbar">
      <Stack
        direction="row"
        spacing={3}
        sx={{
          width: "100%",
          alignItems: "center",
          color: "#d4d4d4",
          fontSize: 13,
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
      >
        <Typography variant="body2">Format: {format}</Typography>
        <Typography variant="body2">Width: {width}</Typography>
        <Typography variant="body2">Height: {height}</Typography>
        <Typography variant="body2">Color depth: {colorDepth}</Typography>
        <Typography variant="body2">
          Mask: {hasMask ? "present" : "absent"}
        </Typography>
      </Stack>
    </Box>
  );
}

export default StatusBar;