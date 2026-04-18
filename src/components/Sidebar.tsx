import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type {
  ChannelVisibility,
  SampledPixelInfo,
  ToolMode,
} from "../types/image";

interface SidebarProps {
  channels: ChannelVisibility;
  toolMode: ToolMode;
  sampledPixel: SampledPixelInfo | null;
  onToggleChannel: (channel: keyof ChannelVisibility) => void;
}

function Sidebar({
  channels,
  toolMode,
  sampledPixel,
  onToggleChannel,
}: SidebarProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        width: 320,
        minWidth: 320,
        height: "100%",
        border: "1px solid #3c3c3c",
        backgroundColor: "#1f1f1f",
        display: "grid",
        gridTemplateRows: "1fr 1fr",
        overflow: "hidden",
      }}
    >
      <Box sx={{ minHeight: 0, overflow: "auto" }}>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid #333",
            backgroundColor: "#252526",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Channels
          </Typography>
        </Box>

        <List disablePadding>
          <ListItemButton
            selected={channels.red}
            onClick={() => onToggleChannel("red")}
          >
            <ListItemText
              primary="Red channel"
              secondary={channels.red ? "Enabled" : "Disabled"}
            />
          </ListItemButton>

          <ListItemButton
            selected={channels.green}
            onClick={() => onToggleChannel("green")}
          >
            <ListItemText
              primary="Green channel"
              secondary={channels.green ? "Enabled" : "Disabled"}
            />
          </ListItemButton>

          <ListItemButton
            selected={channels.blue}
            onClick={() => onToggleChannel("blue")}
          >
            <ListItemText
              primary="Blue channel"
              secondary={channels.blue ? "Enabled" : "Disabled"}
            />
          </ListItemButton>

          <ListItemButton
            selected={channels.alpha}
            onClick={() => onToggleChannel("alpha")}
          >
            <ListItemText
              primary="Alpha channel"
              secondary={channels.alpha ? "Enabled" : "Disabled"}
            />
          </ListItemButton>
        </List>
      </Box>

      <Divider />

      <Box sx={{ minHeight: 0, overflow: "auto" }}>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid #333",
            backgroundColor: "#252526",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Eyedropper Info
          </Typography>
        </Box>

        <Stack spacing={1.5} sx={{ p: 2 }}>
          <Typography variant="body2">
            Tool mode: {toolMode === "eyedropper" ? "Eyedropper" : "None"}
          </Typography>

          {sampledPixel ? (
            <>
              <Typography variant="body2">
                Position: ({sampledPixel.x}, {sampledPixel.y})
              </Typography>
              <Typography variant="body2">
                RGB: {sampledPixel.r}, {sampledPixel.g}, {sampledPixel.b}
              </Typography>
              <Typography variant="body2">Alpha: {sampledPixel.a}</Typography>
              <Typography variant="body2">
                LAB: {sampledPixel.lab.l.toFixed(2)},{" "}
                {sampledPixel.lab.a.toFixed(2)},{" "}
                {sampledPixel.lab.b.toFixed(2)}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" sx={{ color: "#a8a8a8" }}>
              No pixel selected yet.
            </Typography>
          )}
        </Stack>
      </Box>
    </Paper>
  );
}

export default Sidebar;