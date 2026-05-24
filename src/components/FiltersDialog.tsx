import { useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  LinearProgress,
  NativeSelect,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  EdgeHandlingStrategy,
  FilterChannel,
  FilterMode,
  FilterSettings,
  Kernel3x3,
  KernelPresetId,
} from "../types/filters";
import { KERNEL_PRESETS, getKernelPreset } from "../types/filters";

interface FiltersDialogProps {
  open: boolean;
  settings: FilterSettings;
  processing: boolean;
  progress: number;
  onChange: (settings: FilterSettings) => void;
  onReset: () => void;
  onCancel: () => void;
  onApply: () => void;
}

const FILTER_CHANNELS: Array<{
  channel: FilterChannel;
  label: string;
}> = [
  {
    channel: "red",
    label: "Red",
  },
  {
    channel: "green",
    label: "Green",
  },
  {
    channel: "blue",
    label: "Blue",
  },
  {
    channel: "alpha",
    label: "Alpha",
  },
];

const nativeSelectSx = {
  color: "#f5f5f5",
  "& .MuiNativeSelect-icon": {
    color: "#f5f5f5",
  },
  "&:before": {
    borderBottomColor: "#3c3c3c",
  },
  "&:after": {
    borderBottomColor: "#2196f3",
  },
  "&:hover:not(.Mui-disabled):before": {
    borderBottomColor: "#6a6a6a",
  },
};

const textFieldSx = {
  "& .MuiInputBase-input": {
    color: "#f5f5f5",
  },
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#141414",
    "& fieldset": {
      borderColor: "#2f2f2f",
    },
    "&:hover fieldset": {
      borderColor: "#555",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2196f3",
    },
    "&.Mui-disabled": {
      backgroundColor: "#101010",
    },
  },
  "& .MuiInputBase-input.Mui-disabled": {
    WebkitTextFillColor: "#777",
  },
};

function parseKernelValue(value: string): number {
  const parsedValue = Number(value.replace(",", "."));

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return parsedValue;
}

function formatKernelValue(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(Number(value.toFixed(4)));
}

function getModeDescription(mode: FilterMode): string {
  if (mode === "median") {
    return "Median filter replaces each selected channel value with the median value from a 3×3 neighborhood. It is useful for removing isolated noise.";
  }

  return "Kernel mode applies a 3×3 convolution matrix to selected channels. Presets fill the matrix, but every value can be edited manually.";
}

function FiltersDialog({
  open,
  settings,
  processing,
  progress,
  onChange,
  onReset,
  onCancel,
  onApply,
}: FiltersDialogProps) {
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

  const selectedPreset = getKernelPreset(settings.presetId);
  const kernelControlsDisabled = settings.mode === "median";
  const identitySelected =
    settings.mode === "kernel" && settings.presetId === "identity";

  const handleModeChange = (mode: FilterMode) => {
    onChange({
      ...settings,
      mode,
    });
  };

  const handlePresetChange = (presetId: KernelPresetId) => {
    const preset = getKernelPreset(presetId);

    onChange({
      ...settings,
      mode: "kernel",
      presetId: preset.id,
      kernel: [...preset.kernel] as Kernel3x3,
    });
  };

  const handleKernelValueChange = (index: number, value: string) => {
    const nextKernel = [...settings.kernel] as Kernel3x3;

    nextKernel[index] = parseKernelValue(value);

    onChange({
      ...settings,
      mode: "kernel",
      kernel: nextKernel,
    });
  };

  const handleChannelChange = (channel: FilterChannel, checked: boolean) => {
    onChange({
      ...settings,
      channels: {
        ...settings.channels,
        [channel]: checked,
      },
    });
  };

  const handleEdgeHandlingChange = (edgeHandling: EdgeHandlingStrategy) => {
    onChange({
      ...settings,
      edgeHandling,
    });
  };

  const handlePreviewChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...settings,
      previewEnabled: event.target.checked,
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className="filters-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <Box className="filters-dialog__content">
        <Box className="filters-dialog__header">
          <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600 }}>
            Filters
          </Typography>

          <Typography variant="body2" sx={{ color: "#a8a8a8" }}>
            Apply convolution kernels and median filtering to selected image
            channels.
          </Typography>
        </Box>

        <Stack spacing={2.25}>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <Typography variant="body2" sx={{ mb: 0.75 }}>
                Filter mode
              </Typography>

              <NativeSelect
                value={settings.mode}
                sx={nativeSelectSx}
                onChange={(event) =>
                  handleModeChange(event.target.value as FilterMode)
                }
              >
                <option value="kernel">Kernel 3×3</option>
                <option value="median">Median 3×3</option>
              </NativeSelect>
            </FormControl>

            <FormControl fullWidth size="small">
              <Typography variant="body2" sx={{ mb: 0.75 }}>
                Edge handling
              </Typography>

              <NativeSelect
                value={settings.edgeHandling}
                sx={nativeSelectSx}
                onChange={(event) =>
                  handleEdgeHandlingChange(
                    event.target.value as EdgeHandlingStrategy
                  )
                }
              >
                <option value="copy">Copy nearest pixel</option>
                <option value="black">Fill with black</option>
                <option value="white">Fill with white</option>
              </NativeSelect>
            </FormControl>
          </Stack>

          <Box className="filters-dialog__preset-description">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {settings.mode === "median" ? "Median 3×3" : selectedPreset.label}
            </Typography>

            <Typography variant="body2" sx={{ color: "#c7c7c7" }}>
              {settings.mode === "median"
                ? getModeDescription("median")
                : selectedPreset.description}
            </Typography>

            {identitySelected && (
              <Typography variant="body2" sx={{ color: "#ffcc80", mt: 0.5 }}>
                Identity is the initial kernel and does not change the image.
                Choose Sharpen, Gaussian blur, Prewitt X or Prewitt Y to see a
                visible preview.
              </Typography>
            )}
          </Box>

          <FormControl fullWidth size="small" disabled={kernelControlsDisabled}>
            <Typography variant="body2" sx={{ mb: 0.75 }}>
              Kernel preset
            </Typography>

            <NativeSelect
              value={settings.presetId}
              sx={nativeSelectSx}
              onChange={(event) =>
                handlePresetChange(event.target.value as KernelPresetId)
              }
            >
              {KERNEL_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </NativeSelect>
          </FormControl>

          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Kernel 3×3
            </Typography>

            <Box className="filters-dialog__kernel-grid">
              {settings.kernel.map((value, index) => (
                <TextField
                  key={index}
                  type="number"
                  size="small"
                  value={formatKernelValue(value)}
                  disabled={kernelControlsDisabled}
                  sx={textFieldSx}
                  onChange={(event) =>
                    handleKernelValueChange(index, event.target.value)
                  }
                  slotProps={{
                    htmlInput: {
                      step: 0.0625,
                    },
                  }}
                />
              ))}
            </Box>

            {settings.mode === "median" && (
              <Typography variant="body2" sx={{ color: "#a8a8a8", mt: 1 }}>
                Median mode does not use kernel coefficients. It sorts 3×3
                neighborhood values and takes the middle value.
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Channels
            </Typography>

            <Box className="filters-dialog__channels-grid">
              {FILTER_CHANNELS.map((item) => (
                <FormControlLabel
                  key={item.channel}
                  control={
                    <Checkbox
                      checked={settings.channels[item.channel]}
                      onChange={(event) =>
                        handleChannelChange(item.channel, event.target.checked)
                      }
                    />
                  }
                  label={item.label}
                />
              ))}
            </Box>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={settings.previewEnabled}
                onChange={handlePreviewChange}
              />
            }
            label="Live preview on main canvas"
          />

          {processing && (
            <Box className="filters-dialog__processing">
              <Typography variant="body2" sx={{ color: "#c7c7c7", mb: 1 }}>
                Processing preview... {progress}%
              </Typography>

              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          <Box className="filters-dialog__note">
            <Typography variant="body2" sx={{ color: "#c7c7c7" }}>
              {settings.previewEnabled
                ? "Preview temporarily applies the selected filter to the main canvas behind this dialog. Close cancels the preview. Apply saves the result."
                : "Preview is disabled. The main canvas shows the image before filtering until you press Apply."}
            </Typography>
          </Box>
        </Stack>

        <Box className="filters-dialog__actions">
          <Button variant="outlined" color="inherit" onClick={onReset}>
            Reset
          </Button>

          <Box sx={{ flex: 1 }} />

          <Button variant="outlined" color="inherit" onClick={onCancel}>
            Close
          </Button>

          <Button variant="contained" disabled={processing} onClick={onApply}>
            Apply
          </Button>
        </Box>
      </Box>
    </dialog>
  );
}

export default FiltersDialog;