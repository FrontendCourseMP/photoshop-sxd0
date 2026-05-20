import { useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  NativeSelect,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  EdgeHandlingStrategy,
  FilterChannel,
  FilterSettings,
  Kernel3x3,
  KernelPresetId,
} from "../types/filters";
import { KERNEL_PRESETS, getKernelPreset } from "../types/filters";

interface FiltersDialogProps {
  open: boolean;
  settings: FilterSettings;
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

function FiltersDialog({
  open,
  settings,
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
            Apply a 3×3 convolution kernel to selected image channels.
          </Typography>
        </Box>

        <Stack spacing={2.5}>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <Typography variant="body2" sx={{ mb: 0.75 }}>
                Preset
              </Typography>

              <NativeSelect
                value={settings.presetId}
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

            <FormControl fullWidth size="small">
              <Typography variant="body2" sx={{ mb: 0.75 }}>
                Edge handling
              </Typography>

              <NativeSelect
                value={settings.edgeHandling}
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
              {selectedPreset.label}
            </Typography>

            <Typography variant="body2" sx={{ color: "#c7c7c7" }}>
              {selectedPreset.description}
            </Typography>
          </Box>

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
            label="Preview"
          />

          <Box className="filters-dialog__note">
            <Typography variant="body2" sx={{ color: "#c7c7c7" }}>
              The filter keeps the original image size. Border pixels are
              processed using the selected edge handling strategy.
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

          <Button variant="contained" onClick={onApply}>
            Apply
          </Button>
        </Box>
      </Box>
    </dialog>
  );
}

export default FiltersDialog;