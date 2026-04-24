import { useEffect, useMemo, useRef } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type { ImageDocument } from "../types/image";
import type {
  LevelsChannelTarget,
  LevelsDialogState,
  LevelsHistogramMode,
  LevelsInputValues,
} from "../types/levels";

interface LevelsDialogProps {
  open: boolean;
  document: ImageDocument | null;
  state: LevelsDialogState;
  currentValues: LevelsInputValues;
  onChangeChannel: (channel: LevelsChannelTarget) => void;
  onChangeHistogramMode: (mode: LevelsHistogramMode) => void;
  onTogglePreview: (enabled: boolean) => void;
  onReset: () => void;
  onCancel: () => void;
  onApply: () => void;
}

function getChannelOptions(document: ImageDocument | null): LevelsChannelTarget[] {
  if (!document) {
    return ["master"];
  }

  if (document.channelModel === "grayscale") {
    return document.hasMask
      ? ["master", "grayscale", "alpha"]
      : ["master", "grayscale"];
  }

  return document.hasMask
    ? ["master", "red", "green", "blue", "alpha"]
    : ["master", "red", "green", "blue"];
}

function getChannelLabel(channel: LevelsChannelTarget): string {
  switch (channel) {
    case "master":
      return "Master";
    case "grayscale":
      return "Grayscale";
    case "red":
      return "Red";
    case "green":
      return "Green";
    case "blue":
      return "Blue";
    case "alpha":
      return "Alpha";
  }
}

function LevelsDialog({
  open,
  document,
  state,
  currentValues,
  onChangeChannel,
  onChangeHistogramMode,
  onTogglePreview,
  onReset,
  onCancel,
  onApply,
}: LevelsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const channelOptions = useMemo(() => getChannelOptions(document), [document]);

  return (
    <dialog
      ref={dialogRef}
      className="levels-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <Box className="levels-dialog__content">
        <Box className="levels-dialog__header">
          <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600 }}>
            Levels
          </Typography>

          <Typography variant="body2" sx={{ color: "#a8a8a8" }}>
            Tone correction with histogram and input levels
          </Typography>
        </Box>

        <Stack spacing={2.5}>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <Typography variant="body2" sx={{ mb: 0.75 }}>
                Channel
              </Typography>

              <Select
                value={state.selectedChannel}
                onChange={(event) =>
                  onChangeChannel(event.target.value as LevelsChannelTarget)
                }
              >
                {channelOptions.map((channel) => (
                  <MenuItem key={channel} value={channel}>
                    {getChannelLabel(channel)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <Typography variant="body2" sx={{ mb: 0.75 }}>
                Histogram mode
              </Typography>

              <Select
                value={state.histogramMode}
                onChange={(event) =>
                  onChangeHistogramMode(event.target.value as LevelsHistogramMode)
                }
              >
                <MenuItem value="linear">Linear</MenuItem>
                <MenuItem value="log">Logarithmic</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={state.previewEnabled}
                onChange={(event) => onTogglePreview(event.target.checked)}
              />
            }
            label="Preview"
          />

          <Box className="levels-dialog__histogram">
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Histogram
            </Typography>

            <Box className="levels-dialog__histogram-placeholder">
              Histogram preview will be implemented in the next commit.
            </Box>
          </Box>

          <Box className="levels-dialog__levels-panel">
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Input Levels
            </Typography>

            <Stack spacing={1}>
              <Typography variant="body2">
                Black point: {currentValues.blackPoint}
              </Typography>
              <Typography variant="body2">
                Gamma: {currentValues.gamma.toFixed(2)}
              </Typography>
              <Typography variant="body2">
                White point: {currentValues.whitePoint}
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ mt: 1.5, color: "#a8a8a8" }}>
              Sliders and constraints will be added in the next commit.
            </Typography>
          </Box>
        </Stack>

        <Box className="levels-dialog__actions">
          <Button variant="outlined" onClick={onReset}>
            Reset
          </Button>

          <Box sx={{ flex: 1 }} />

          <Button variant="outlined" color="inherit" onClick={onCancel}>
            Cancel
          </Button>

          <Button variant="contained" onClick={onApply}>
            Apply
          </Button>
        </Box>
      </Box>
    </dialog>
  );
}

export default LevelsDialog;