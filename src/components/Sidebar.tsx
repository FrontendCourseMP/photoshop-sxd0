import { useMemo } from "react";
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
  ImageDocument,
  SampledPixelInfo,
  ToolMode,
} from "../types/image";
import {
  createChannelPreviewUrl,
  getVisibleChannelKeys,
  type PreviewChannel,
} from "../utils/channelPreview";

interface SidebarProps {
  document: ImageDocument | null;
  channels: ChannelVisibility;
  toolMode: ToolMode;
  sampledPixel: SampledPixelInfo | null;
  onToggleChannel: (channel: PreviewChannel | "grayscale") => void;
}

function getChannelLabel(channel: PreviewChannel): string {
  switch (channel) {
    case "grayscale":
      return "Grayscale";
    case "red":
      return "Red channel";
    case "green":
      return "Green channel";
    case "blue":
      return "Blue channel";
    case "alpha":
      return "Alpha channel";
  }
}

function isChannelSelected(
  channels: ChannelVisibility,
  channel: PreviewChannel
): boolean {
  if (channel === "grayscale") {
    return channels.red && channels.green && channels.blue;
  }

  return channels[channel];
}

function Sidebar({
  document,
  channels,
  toolMode,
  sampledPixel,
  onToggleChannel,
}: SidebarProps) {
  const channelItems = useMemo(() => {
    if (!document) {
      return [];
    }

    return getVisibleChannelKeys(document).map((channel) => ({
      key: channel,
      label: getChannelLabel(channel),
      selected: isChannelSelected(channels, channel),
      previewUrl: createChannelPreviewUrl(document.imageData, channel),
    }));
  }, [document, channels]);

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

        {document ? (
          <List disablePadding>
            {channelItems.map((item) => (
              <ListItemButton
                key={item.key}
                selected={item.selected}
                onClick={() =>
                  onToggleChannel(
                    item.key === "grayscale" ? "grayscale" : item.key
                  )
                }
                sx={{
                  alignItems: "center",
                  gap: 1.5,
                  py: 1,
                }}
              >
                <Box
                  component="img"
                  src={item.previewUrl}
                  alt={item.label}
                  sx={{
                    width: 88,
                    height: 64,
                    objectFit: "cover",
                    border: "1px solid #444",
                    borderRadius: 1,
                    backgroundColor: "#111",
                    flexShrink: 0,
                  }}
                />

                <ListItemText
                  primary={item.label}
                  secondary={item.selected ? "Enabled" : "Disabled"}
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ p: 2, color: "#a8a8a8" }}>
            Load an image to display channel previews.
          </Typography>
        )}
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