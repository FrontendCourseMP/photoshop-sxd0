import { useEffect, useMemo, useRef } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  NativeSelect,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ImageDocument } from "../types/image";
import type {
  HistogramData,
  LevelsChannelTarget,
  LevelsDialogState,
  LevelsHistogramMode,
  LevelsInputValues,
} from "../types/levels";

interface LevelsDialogProps {
  open: boolean;
  document: ImageDocument | null;
  state: LevelsDialogState;
  histogram: HistogramData;
  currentValues: LevelsInputValues;
  onChangeChannel: (channel: LevelsChannelTarget) => void;
  onChangeHistogramMode: (mode: LevelsHistogramMode) => void;
  onTogglePreview: (enabled: boolean) => void;
  onChangeBlackPoint: (value: number) => void;
  onChangeGamma: (value: number) => void;
  onChangeWhitePoint: (value: number) => void;
  onReset: () => void;
  onCancel: () => void;
  onApply: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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

function getHistogramColor(channel: LevelsChannelTarget): string {
  switch (channel) {
    case "master":
      return "#bdbdbd";
    case "grayscale":
      return "#bdbdbd";
    case "red":
      return "#ef5350";
    case "green":
      return "#66bb6a";
    case "blue":
      return "#42a5f5";
    case "alpha":
      return "#e0e0e0";
  }
}

function gammaToMarkerPosition(
  blackPoint: number,
  whitePoint: number,
  gamma: number
): number {
  const safeGamma = clamp(gamma, 0.1, 9.9);
  const span = Math.max(1, whitePoint - blackPoint);
  const normalized = Math.pow(0.5, 1 / safeGamma);
  return Math.round(blackPoint + normalized * span);
}

function markerPositionToGamma(
  blackPoint: number,
  whitePoint: number,
  markerPosition: number
): number {
  const span = Math.max(1, whitePoint - blackPoint);
  const normalized = clamp(
    (markerPosition - blackPoint) / span,
    0.01,
    0.99
  );

  return clamp(Math.log(0.5) / Math.log(normalized), 0.1, 9.9);
}

function LevelsDialog({
  open,
  document,
  state,
  histogram,
  currentValues,
  onChangeChannel,
  onChangeHistogramMode,
  onTogglePreview,
  onChangeBlackPoint,
  onChangeGamma,
  onChangeWhitePoint,
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

  const displayHeights = useMemo(() => {
    const transformed =
      state.histogramMode === "log"
        ? histogram.bins.map((value) => Math.log1p(value))
        : histogram.bins;

    const maxDisplayValue = Math.max(...transformed, 1);

    return transformed.map((value) => (value / maxDisplayValue) * 100);
  }, [histogram, state.histogramMode]);

  const histogramColor = getHistogramColor(state.selectedChannel);

  const gammaMarkerPosition = useMemo(() => {
    return gammaToMarkerPosition(
      currentValues.blackPoint,
      currentValues.whitePoint,
      currentValues.gamma
    );
  }, [
    currentValues.blackPoint,
    currentValues.whitePoint,
    currentValues.gamma,
  ]);

  const gammaMarkerMin = Math.min(
    255,
    currentValues.blackPoint + 1
  );

  const gammaMarkerMax = Math.max(
    gammaMarkerMin,
    currentValues.whitePoint - 1
  );

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

              <NativeSelect
                value={state.selectedChannel}
                onChange={(event) =>
                  onChangeChannel(event.target.value as LevelsChannelTarget)
                }
              >
                {channelOptions.map((channel) => (
                  <option key={channel} value={channel}>
                    {getChannelLabel(channel)}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>

            <FormControl fullWidth size="small">
              <Typography variant="body2" sx={{ mb: 0.75 }}>
                Histogram mode
              </Typography>

              <NativeSelect
                value={state.histogramMode}
                onChange={(event) =>
                  onChangeHistogramMode(event.target.value as LevelsHistogramMode)
                }
              >
                <option value="linear">Linear</option>
                <option value="log">Logarithmic</option>
              </NativeSelect>
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
              <Box sx={{ width: "100%" }}>
                <svg
                  viewBox="0 0 256 100"
                  preserveAspectRatio="none"
                  style={{
                    display: "block",
                    width: "100%",
                    height: 220,
                    background: "#111",
                    borderRadius: 8,
                  }}
                >
                  {displayHeights.map((height, index) => (
                    <rect
                      key={index}
                      x={index}
                      y={100 - height}
                      width={1}
                      height={height}
                      fill={histogramColor}
                    />
                  ))}
                </svg>

                <Box className="levels-dialog__marker-strip">
                  <Slider
                    min={0}
                    max={255}
                    value={[currentValues.blackPoint, currentValues.whitePoint]}
                    onChange={(_, value) => {
                      const [black, white] = value as number[];
                      onChangeBlackPoint(black);
                      onChangeWhitePoint(white);
                    }}
                    disableSwap
                    sx={{
                      position: "absolute",
                      inset: 0,
                      color: "#bdbdbd",
                      "& .MuiSlider-rail": {
                        height: 2,
                        opacity: 1,
                        bgcolor: "#555",
                      },
                      "& .MuiSlider-track": {
                        height: 2,
                      },
                      "& .MuiSlider-thumb": {
                        width: 14,
                        height: 14,
                        borderRadius: "3px",
                      },
                    }}
                  />

                  <Slider
                    min={gammaMarkerMin}
                    max={gammaMarkerMax}
                    value={clamp(gammaMarkerPosition, gammaMarkerMin, gammaMarkerMax)}
                    onChange={(_, value) => {
                      const marker = value as number;
                      onChangeGamma(
                        markerPositionToGamma(
                          currentValues.blackPoint,
                          currentValues.whitePoint,
                          marker
                        )
                      );
                    }}
                    sx={{
                      position: "absolute",
                      inset: 0,
                      color: "#ffd54f",
                      "& .MuiSlider-rail": {
                        opacity: 0,
                      },
                      "& .MuiSlider-track": {
                        display: "none",
                      },
                      "& .MuiSlider-thumb": {
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
                      },
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#a8a8a8",
                    fontSize: 12,
                  }}
                >
                  <span>0</span>
                  <span>
                    Peak: {histogram.maxValue} px • Total: {histogram.totalPixels}
                  </span>
                  <span>255</span>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box className="levels-dialog__levels-panel">
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Input Levels
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Black point
                </Typography>

                <Slider
                  min={0}
                  max={Math.max(0, currentValues.whitePoint - 1)}
                  step={1}
                  value={currentValues.blackPoint}
                  onChange={(_, value) => onChangeBlackPoint(value as number)}
                />

                <TextField
                  size="small"
                  type="number"
                  value={currentValues.blackPoint}
                  onChange={(event) =>
                    onChangeBlackPoint(Number(event.target.value))
                  }
                  slotProps={{
                    htmlInput: { min: 0, max: 254, step: 1 },
                  }}
                  fullWidth
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Gamma
                </Typography>

                <Slider
                  min={0.1}
                  max={9.9}
                  step={0.1}
                  value={currentValues.gamma}
                  onChange={(_, value) => onChangeGamma(value as number)}
                />

                <TextField
                  size="small"
                  type="number"
                  value={currentValues.gamma}
                  onChange={(event) =>
                    onChangeGamma(Number(event.target.value))
                  }
                  slotProps={{
                    htmlInput: { min: 0.1, max: 9.9, step: 0.1 },
                  }}
                  fullWidth
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  White point
                </Typography>

                <Slider
                  min={Math.min(255, currentValues.blackPoint + 1)}
                  max={255}
                  step={1}
                  value={currentValues.whitePoint}
                  onChange={(_, value) => onChangeWhitePoint(value as number)}
                />

                <TextField
                  size="small"
                  type="number"
                  value={currentValues.whitePoint}
                  onChange={(event) =>
                    onChangeWhitePoint(Number(event.target.value))
                  }
                  slotProps={{
                    htmlInput: { min: 1, max: 255, step: 1 },
                  }}
                  fullWidth
                />
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ mt: 1.5, color: "#a8a8a8" }}>
              Values are stored independently for each selected channel.
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