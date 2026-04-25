import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { Box } from "@mui/material";
import Toolbar from "../components/Toolbar";
import CanvasViewport from "../components/CanvasViewport";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import LevelsDialog from "../components/LevelsDialog";
import useImageDocument from "../hooks/useImageDocument";
import type {
  ChannelVisibility,
  SampledPixelInfo,
  ToolMode,
} from "../types/image";
import type {
  LevelsChannelTarget,
  LevelsDialogState,
  LevelsHistogramMode,
  LevelsSettingsMap,
} from "../types/levels";
import {
  createDefaultLevelsSettings,
  createDefaultLevelsValues,
  getDefaultLevelsChannel,
} from "../types/levels";
import { imageDataHasAlpha } from "../utils/analyzeImageData";
import { applyChannelVisibility } from "../utils/applyChannelVisibility";
import { applyLevelsToImageData } from "../utils/applyLevels";
import { decodeGB7 } from "../utils/decodeGB7";
import { exportImageAsGB7 } from "../utils/encodeGB7";
import { exportImageAsJpg, exportImageAsPng } from "../utils/exportImage";
import { getCanvasPixelCoordinates } from "../utils/getCanvasPixelCoordinates";
import { computeHistogram } from "../utils/histogram";
import { loadStandardImage } from "../utils/loadStandardImage";
import { renderToCanvas } from "../utils/renderToCanvas";
import { rgbToLab } from "../utils/rgbToLab";
import "../App.css";

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function getUpdatedColorDepth(
  channelModel: "grayscale" | "rgb",
  hasAlpha: boolean
): string {
  if (channelModel === "grayscale") {
    return hasAlpha ? "8-bit grayscale + alpha" : "8-bit grayscale";
  }

  return hasAlpha ? "32-bit RGBA" : "24-bit RGB";
}

const defaultChannels: ChannelVisibility = {
  red: true,
  green: true,
  blue: true,
  alpha: true,
};

const defaultLevelsDialogState: LevelsDialogState = {
  isOpen: false,
  previewEnabled: true,
  histogramMode: "linear",
  selectedChannel: "master",
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { document, setDocument, hasImage, metadata, clearDocument } =
    useImageDocument();

  const [errorMessage, setErrorMessage] = useState("");
  const [toolMode, setToolMode] = useState<ToolMode>("none");
  const [channels, setChannels] = useState<ChannelVisibility>(defaultChannels);
  const [sampledPixel, setSampledPixel] = useState<SampledPixelInfo | null>(
    null
  );

  const [levelsDialogState, setLevelsDialogState] =
    useState<LevelsDialogState>(defaultLevelsDialogState);
  const [levelsSettings, setLevelsSettings] = useState<LevelsSettingsMap>(
    createDefaultLevelsSettings()
  );
  const [levelsBaseImageData, setLevelsBaseImageData] = useState<ImageData | null>(
    null
  );

  const levelsPreviewImageData = useMemo(() => {
    if (
      !document ||
      !levelsBaseImageData ||
      !levelsDialogState.isOpen ||
      !levelsDialogState.previewEnabled
    ) {
      return null;
    }

    return applyLevelsToImageData(
      levelsBaseImageData,
      document.channelModel,
      levelsSettings
    );
  }, [
    document,
    levelsBaseImageData,
    levelsDialogState.isOpen,
    levelsDialogState.previewEnabled,
    levelsSettings,
  ]);

  const displayedImageData = levelsPreviewImageData ?? document?.imageData ?? null;

  const renderedImageData = useMemo(() => {
    if (!displayedImageData) {
      return null;
    }

    return applyChannelVisibility(displayedImageData, channels);
  }, [displayedImageData, channels]);

  const levelsHistogram = useMemo(() => {
    if (!document) {
      return {
        bins: new Array<number>(256).fill(0),
        maxValue: 0,
        totalPixels: 0,
      };
    }

    return computeHistogram(document.imageData, levelsDialogState.selectedChannel);
  }, [document, levelsDialogState.selectedChannel]);

  const channelsSummary = useMemo(() => {
    if (!document) {
      return "—";
    }

    if (document.channelModel === "grayscale") {
      const parts: string[] = [];

      if (channels.red && channels.green && channels.blue) {
        parts.push("Gray");
      }

      if (document.hasMask && channels.alpha) {
        parts.push("Alpha");
      }

      return parts.length > 0 ? parts.join(", ") : "none";
    }

    const parts: string[] = [];

    if (channels.red) {
      parts.push("R");
    }

    if (channels.green) {
      parts.push("G");
    }

    if (channels.blue) {
      parts.push("B");
    }

    if (document.hasMask && channels.alpha) {
      parts.push("A");
    }

    return parts.length > 0 ? parts.join(", ") : "none";
  }, [document, channels]);

  useEffect(() => {
    if (!renderedImageData || !canvasRef.current) {
      return;
    }

    renderToCanvas(canvasRef.current, renderedImageData);
  }, [renderedImageData]);

  const updateLevelsForSelectedChannel = (
    updater: (
      previous: LevelsSettingsMap[LevelsChannelTarget]
    ) => LevelsSettingsMap[LevelsChannelTarget]
  ) => {
    const channel = levelsDialogState.selectedChannel;

    setLevelsSettings((previous) => ({
      ...previous,
      [channel]: updater(previous[channel]),
    }));
  };

  const handleOpen = () => {
    fileInputRef.current?.click();
  };

  const handleOpenLevels = () => {
    if (!document) {
      return;
    }

    setLevelsSettings(createDefaultLevelsSettings());
    setLevelsBaseImageData(document.imageData);
    setSampledPixel(null);

    setLevelsDialogState({
      isOpen: true,
      previewEnabled: true,
      histogramMode: "linear",
      selectedChannel: getDefaultLevelsChannel(document.channelModel),
    });
  };

  const handleLevelsChannelChange = (channel: LevelsChannelTarget) => {
    setLevelsDialogState((previous) => ({
      ...previous,
      selectedChannel: channel,
    }));
  };

  const handleHistogramModeChange = (mode: LevelsHistogramMode) => {
    setLevelsDialogState((previous) => ({
      ...previous,
      histogramMode: mode,
    }));
  };

  const handleLevelsPreviewToggle = (enabled: boolean) => {
    setLevelsDialogState((previous) => ({
      ...previous,
      previewEnabled: enabled,
    }));
  };

  const handleChangeBlackPoint = (value: number) => {
    updateLevelsForSelectedChannel((previous) => {
      const blackPoint = clamp(Math.round(value), 0, previous.whitePoint - 1);

      return {
        ...previous,
        blackPoint,
      };
    });
  };

  const handleChangeGamma = (value: number) => {
    updateLevelsForSelectedChannel((previous) => ({
      ...previous,
      gamma: clamp(Number(value), 0.1, 9.9),
    }));
  };

  const handleChangeWhitePoint = (value: number) => {
    updateLevelsForSelectedChannel((previous) => {
      const whitePoint = clamp(Math.round(value), previous.blackPoint + 1, 255);

      return {
        ...previous,
        whitePoint,
      };
    });
  };

  const handleLevelsReset = () => {
    const channel = levelsDialogState.selectedChannel;

    setLevelsSettings((previous) => ({
      ...previous,
      [channel]: createDefaultLevelsValues(),
    }));
  };

  const handleLevelsCancel = () => {
    setLevelsDialogState(defaultLevelsDialogState);
    setLevelsSettings(createDefaultLevelsSettings());
    setLevelsBaseImageData(null);
    setSampledPixel(null);
  };

  const handleLevelsApply = () => {
    if (!document || !levelsBaseImageData) {
      setLevelsDialogState(defaultLevelsDialogState);
      setLevelsSettings(createDefaultLevelsSettings());
      setLevelsBaseImageData(null);
      return;
    }

    const appliedImageData = applyLevelsToImageData(
      levelsBaseImageData,
      document.channelModel,
      levelsSettings
    );

    const hasAlpha = imageDataHasAlpha(appliedImageData);

    setDocument({
      ...document,
      imageData: appliedImageData,
      hasMask: hasAlpha,
      colorDepth: getUpdatedColorDepth(document.channelModel, hasAlpha),
    });

    setLevelsDialogState(defaultLevelsDialogState);
    setLevelsSettings(createDefaultLevelsSettings());
    setLevelsBaseImageData(null);
    setSampledPixel(null);
    setErrorMessage("");
  };

  const handleToggleEyedropper = () => {
    setToolMode((previous) =>
      previous === "eyedropper" ? "none" : "eyedropper"
    );
  };

  const handleToggleChannel = (
    channel: keyof ChannelVisibility | "grayscale"
  ) => {
    setSampledPixel(null);

    if (channel === "grayscale") {
      setChannels((previous) => {
        const nextValue = !(previous.red && previous.green && previous.blue);

        return {
          ...previous,
          red: nextValue,
          green: nextValue,
          blue: nextValue,
        };
      });

      return;
    }

    setChannels((previous) => ({
      ...previous,
      [channel]: !previous[channel],
    }));
  };

  const handleCanvasClick = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    if (toolMode !== "eyedropper" || !renderedImageData) {
      return;
    }

    try {
      const { x, y } = getCanvasPixelCoordinates(
        event.currentTarget,
        event.clientX,
        event.clientY
      );

      const pixelIndex = (y * renderedImageData.width + x) * 4;
      const red = renderedImageData.data[pixelIndex];
      const green = renderedImageData.data[pixelIndex + 1];
      const blue = renderedImageData.data[pixelIndex + 2];
      const alpha = renderedImageData.data[pixelIndex + 3];
      const lab = rgbToLab(red, green, blue);

      setSampledPixel({
        x,
        y,
        r: red,
        g: green,
        b: blue,
        a: alpha,
        lab,
      });

      setErrorMessage("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to sample pixel from canvas.";

      setErrorMessage(message);
    }
  };

  const handleExportPng = async () => {
    if (!document) {
      return;
    }

    try {
      await exportImageAsPng(document.imageData, document.fileName);
      setErrorMessage("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export PNG image.";

      setErrorMessage(message);
    }
  };

  const handleExportJpg = async () => {
    if (!document) {
      return;
    }

    try {
      await exportImageAsJpg(document.imageData, document.fileName);
      setErrorMessage("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export JPG image.";

      setErrorMessage(message);
    }
  };

  const handleExportGb7 = async () => {
    if (!document) {
      return;
    }

    try {
      await exportImageAsGB7(document.imageData, document.fileName);
      setErrorMessage("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export GB7 image.";

      setErrorMessage(message);
    }
  };

  const handleClear = () => {
    clearDocument();
    setErrorMessage("");
    setToolMode("none");
    setChannels(defaultChannels);
    setSampledPixel(null);
    setLevelsDialogState(defaultLevelsDialogState);
    setLevelsSettings(createDefaultLevelsSettings());
    setLevelsBaseImageData(null);

    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");

      if (context) {
        context.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }

      canvasRef.current.width = 0;
      canvasRef.current.height = 0;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    try {
      const extension = getFileExtension(selectedFile.name);

      const loadedDocument =
        extension === "gb7"
          ? decodeGB7(await selectedFile.arrayBuffer(), selectedFile.name)
          : await loadStandardImage(selectedFile);

      setDocument(loadedDocument);
      setErrorMessage("");
      setToolMode("none");
      setChannels(defaultChannels);
      setSampledPixel(null);
      setLevelsDialogState(defaultLevelsDialogState);
      setLevelsSettings(createDefaultLevelsSettings());
      setLevelsBaseImageData(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to open selected image file.";

      setErrorMessage(message);
      clearDocument();
    } finally {
      event.target.value = "";
    }
  };

  return (
    <Box className="app-shell">
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.gb7,image/png,image/jpeg"
        hidden
        onChange={handleFileChange}
      />

      <Toolbar
        hasImage={hasImage}
        toolMode={toolMode}
        onOpen={handleOpen}
        onOpenLevels={handleOpenLevels}
        onExportPng={handleExportPng}
        onExportJpg={handleExportJpg}
        onExportGb7={handleExportGb7}
        onToggleEyedropper={handleToggleEyedropper}
        onClear={handleClear}
      />

      <Box className="app-main">
        <CanvasViewport
          hasImage={hasImage}
          canvasRef={canvasRef}
          errorMessage={errorMessage}
          fileName={document?.fileName ?? ""}
          toolMode={toolMode}
          onCanvasClick={handleCanvasClick}
        />

        <Sidebar
          document={document}
          channels={channels}
          toolMode={toolMode}
          sampledPixel={sampledPixel}
          onToggleChannel={handleToggleChannel}
        />
      </Box>

      <StatusBar
        fileName={document?.fileName ?? ""}
        format={metadata.format}
        width={metadata.width}
        height={metadata.height}
        colorDepth={metadata.colorDepth}
        hasMask={metadata.hasMask}
        toolMode={toolMode === "eyedropper" ? "Eyedropper" : "None"}
        channelsSummary={channelsSummary}
      />

      <LevelsDialog
        open={levelsDialogState.isOpen}
        document={document}
        state={levelsDialogState}
        histogram={levelsHistogram}
        currentValues={levelsSettings[levelsDialogState.selectedChannel]}
        onChangeChannel={handleLevelsChannelChange}
        onChangeHistogramMode={handleHistogramModeChange}
        onTogglePreview={handleLevelsPreviewToggle}
        onChangeBlackPoint={handleChangeBlackPoint}
        onChangeGamma={handleChangeGamma}
        onChangeWhitePoint={handleChangeWhitePoint}
        onReset={handleLevelsReset}
        onCancel={handleLevelsCancel}
        onApply={handleLevelsApply}
      />
    </Box>
  );
}

export default App;