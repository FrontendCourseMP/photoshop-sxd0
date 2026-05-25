import { useEffect, useMemo, useRef, useState } from "react";
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
  Tooltip,
  Typography,
} from "@mui/material";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import type { ImageDocument } from "../types/image";
import type {
  InterpolationMethod,
  ResizeDimensions,
  ResizeUnit,
} from "../types/scale";
import {
  INTERPOLATION_METHODS,
  getInterpolationMethodInfo,
} from "../types/scale";

interface ResizeDialogProps {
  open: boolean;
  document: ImageDocument | null;
  onCancel: () => void;
  onApply: (
    dimensions: ResizeDimensions,
    interpolationMethod: InterpolationMethod
  ) => void;
}

const MIN_PERCENT = 1;
const MAX_PERCENT = 1000;
const MIN_SIZE_PX = 1;
const MAX_SIZE_PX = 10000;
const MAX_TOTAL_PIXELS = 25_000_000;

function parseNumericValue(value: string): number {
  return Number(value.replace(",", "."));
}

function formatPixels(value: number): string {
  return `${value.toLocaleString("en-US")} px`;
}

function formatMegapixels(value: number): string {
  const megapixels = value / 1_000_000;

  return `${megapixels.toFixed(megapixels >= 10 ? 1 : 2)} MP`;
}

function getTargetDimensions(
  document: ImageDocument,
  unit: ResizeUnit,
  widthValue: string,
  heightValue: string
): ResizeDimensions {
  const width = parseNumericValue(widthValue);
  const height = parseNumericValue(heightValue);

  if (unit === "percent") {
    return {
      width: Math.max(1, Math.round((document.width * width) / 100)),
      height: Math.max(1, Math.round((document.height * height) / 100)),
    };
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

function ResizeDialog({
  open,
  document,
  onCancel,
  onApply,
}: ResizeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [unit, setUnit] = useState<ResizeUnit>("percent");
  const [widthValue, setWidthValue] = useState("100");
  const [heightValue, setHeightValue] = useState("100");
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [interpolationMethod, setInterpolationMethod] =
    useState<InterpolationMethod>("bilinear");

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

  const aspectRatio = useMemo(() => {
    if (!document || document.height === 0) {
      return 1;
    }

    return document.width / document.height;
  }, [document]);

  const targetDimensions = useMemo(() => {
    if (!document) {
      return {
        width: 0,
        height: 0,
      };
    }

    return getTargetDimensions(document, unit, widthValue, heightValue);
  }, [document, unit, widthValue, heightValue]);

  const sourcePixels = document ? document.width * document.height : 0;
  const targetPixels = targetDimensions.width * targetDimensions.height;

  const validationMessage = useMemo(() => {
    if (!document) {
      return "No image loaded.";
    }

    const width = parseNumericValue(widthValue);
    const height = parseNumericValue(heightValue);

    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      return "Width and height must be valid numbers.";
    }

    if (unit === "percent") {
      if (width < MIN_PERCENT || width > MAX_PERCENT) {
        return `Width percent must be between ${MIN_PERCENT}% and ${MAX_PERCENT}%.`;
      }

      if (height < MIN_PERCENT || height > MAX_PERCENT) {
        return `Height percent must be between ${MIN_PERCENT}% and ${MAX_PERCENT}%.`;
      }
    }

    if (unit === "pixels") {
      if (
        !Number.isInteger(width) ||
        width < MIN_SIZE_PX ||
        width > MAX_SIZE_PX
      ) {
        return `Width must be an integer between ${MIN_SIZE_PX} and ${MAX_SIZE_PX} pixels.`;
      }

      if (
        !Number.isInteger(height) ||
        height < MIN_SIZE_PX ||
        height > MAX_SIZE_PX
      ) {
        return `Height must be an integer between ${MIN_SIZE_PX} and ${MAX_SIZE_PX} pixels.`;
      }
    }

    if (
      targetDimensions.width < MIN_SIZE_PX ||
      targetDimensions.height < MIN_SIZE_PX
    ) {
      return "Resulting image dimensions must be at least 1 pixel.";
    }

    if (targetPixels > MAX_TOTAL_PIXELS) {
      return `Resulting image is too large. Maximum is ${formatMegapixels(
        MAX_TOTAL_PIXELS
      )}.`;
    }

    return "";
  }, [
    document,
    widthValue,
    heightValue,
    unit,
    targetDimensions.width,
    targetDimensions.height,
    targetPixels,
  ]);

  const selectedMethodInfo = getInterpolationMethodInfo(interpolationMethod);
  const applyDisabled = !document || validationMessage.length > 0;

  const resetValuesForCurrentUnit = (nextUnit: ResizeUnit) => {
    if (!document) {
      return;
    }

    if (nextUnit === "percent") {
      setWidthValue("100");
      setHeightValue("100");
      return;
    }

    setWidthValue(String(document.width));
    setHeightValue(String(document.height));
  };

  const handleUnitChange = (nextUnit: ResizeUnit) => {
    setUnit(nextUnit);
    resetValuesForCurrentUnit(nextUnit);
  };

  const handleWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    setWidthValue(nextValue);

    if (!document || !keepAspectRatio) {
      return;
    }

    const parsedValue = parseNumericValue(nextValue);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return;
    }

    if (unit === "percent") {
      setHeightValue(nextValue);
      return;
    }

    setHeightValue(String(Math.max(1, Math.round(parsedValue / aspectRatio))));
  };

  const handleHeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    setHeightValue(nextValue);

    if (!document || !keepAspectRatio) {
      return;
    }

    const parsedValue = parseNumericValue(nextValue);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return;
    }

    if (unit === "percent") {
      setWidthValue(nextValue);
      return;
    }

    setWidthValue(String(Math.max(1, Math.round(parsedValue * aspectRatio))));
  };

  const handleKeepAspectRatioChange = (enabled: boolean) => {
    setKeepAspectRatio(enabled);

    if (!enabled || !document) {
      return;
    }

    const parsedWidth = parseNumericValue(widthValue);

    if (!Number.isFinite(parsedWidth) || parsedWidth <= 0) {
      return;
    }

    if (unit === "percent") {
      setHeightValue(widthValue);
      return;
    }

    setHeightValue(String(Math.max(1, Math.round(parsedWidth / aspectRatio))));
  };

  const handleReset = () => {
    resetValuesForCurrentUnit(unit);
    setKeepAspectRatio(true);
    setInterpolationMethod("bilinear");
  };

  const handleApply = () => {
    if (!document || applyDisabled) {
      return;
    }

    onApply(targetDimensions, interpolationMethod);
  };

  return (
    <dialog
      ref={dialogRef}
      className="resize-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <Box className="resize-dialog__content">
        <Box className="resize-dialog__header">
          <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600 }}>
            Resize Image
          </Typography>

          <Typography variant="body2" sx={{ color: "#a8a8a8" }}>
            Change the real pixel dimensions of the current image.
          </Typography>
        </Box>

        <Stack spacing={2.5}>
          <Box className="resize-dialog__pixel-summary">
            <Box>
              <Typography variant="body2" sx={{ color: "#a8a8a8" }}>
                Current image
              </Typography>

              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {document ? `${document.width} × ${document.height}` : "—"}
              </Typography>

              <Typography variant="body2" sx={{ color: "#c7c7c7" }}>
                {formatMegapixels(sourcePixels)} • {formatPixels(sourcePixels)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ color: "#a8a8a8" }}>
                Result after resize
              </Typography>

              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {targetDimensions.width} × {targetDimensions.height}
              </Typography>

              <Typography variant="body2" sx={{ color: "#c7c7c7" }}>
                {formatMegapixels(targetPixels)} • {formatPixels(targetPixels)}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <Typography variant="body2" sx={{ mb: 0.75 }}>
                Resize unit
              </Typography>

              <NativeSelect
                value={unit}
                onChange={(event) =>
                  handleUnitChange(event.target.value as ResizeUnit)
                }
              >
                <option value="percent">Percent</option>
                <option value="pixels">Pixels</option>
              </NativeSelect>
            </FormControl>

            <FormControl fullWidth size="small">
              <Typography variant="body2" sx={{ mb: 0.75 }}>
                Interpolation
              </Typography>

              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <NativeSelect
                  value={interpolationMethod}
                  onChange={(event) =>
                    setInterpolationMethod(
                      event.target.value as InterpolationMethod
                    )
                  }
                  sx={{ flex: 1 }}
                >
                  {INTERPOLATION_METHODS.map((methodInfo) => (
                    <option key={methodInfo.method} value={methodInfo.method}>
                      {methodInfo.label}
                    </option>
                  ))}
                </NativeSelect>

                <Tooltip title={selectedMethodInfo.description} arrow>
                  <HelpOutlineOutlinedIcon
                    fontSize="small"
                    sx={{ color: "#a8a8a8" }}
                  />
                </Tooltip>
              </Stack>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label={unit === "percent" ? "Width, %" : "Width, px"}
              type="number"
              size="small"
              value={widthValue}
              onChange={handleWidthChange}
              fullWidth
              slotProps={{
                htmlInput: {
                  min: unit === "percent" ? MIN_PERCENT : MIN_SIZE_PX,
                  max: unit === "percent" ? MAX_PERCENT : MAX_SIZE_PX,
                  step: 1,
                },
              }}
            />

            <TextField
              label={unit === "percent" ? "Height, %" : "Height, px"}
              type="number"
              size="small"
              value={heightValue}
              onChange={handleHeightChange}
              fullWidth
              slotProps={{
                htmlInput: {
                  min: unit === "percent" ? MIN_PERCENT : MIN_SIZE_PX,
                  max: unit === "percent" ? MAX_PERCENT : MAX_SIZE_PX,
                  step: 1,
                },
              }}
            />
          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={keepAspectRatio}
                onChange={(event) =>
                  handleKeepAspectRatioChange(event.target.checked)
                }
              />
            }
            label="Keep original aspect ratio"
          />

          <Box className="resize-dialog__method-description">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {selectedMethodInfo.label}
            </Typography>

            <Typography variant="body2" sx={{ color: "#c7c7c7" }}>
              {selectedMethodInfo.description}
            </Typography>
          </Box>

          {validationMessage && (
            <Typography variant="body2" sx={{ color: "#ff8a80" }}>
              {validationMessage}
            </Typography>
          )}
        </Stack>

        <Box className="resize-dialog__actions">
          <Button variant="outlined" color="inherit" onClick={handleReset}>
            Reset
          </Button>

          <Box sx={{ flex: 1 }} />

          <Button variant="outlined" color="inherit" onClick={onCancel}>
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={applyDisabled}
            onClick={handleApply}
          >
            Apply
          </Button>
        </Box>
      </Box>
    </dialog>
  );
}

export default ResizeDialog;
