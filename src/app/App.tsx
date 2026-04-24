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
  getDefaultLevelsChannel,
} from "../types/levels";
import { applyChannelVisibility } from "../utils/applyChannelVisibility";
import { decodeGB7 } from "../utils/decodeGB7";
import { exportImageAsGB7 } from "../utils/encodeGB7";
import { exportImageAsJpg, exportImageAsPng } from "../utils/exportImage";
import { getCanvasPixelCoordinates } from "../utils/getCanvasPixelCoordinates";
import { loadStandardImage } from "../utils/loadStandardImage";
import { renderToCanvas } from "../utils/renderToCanvas";
import { rgbToLab } from "../utils/rgbToLab";
import "../App.css";

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
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

  const renderedImageData = useMemo(() => {
    if (!document) {
      return null;
    }

    return applyChannelVisibility(document.imageData, channels);
  }, [document, channels]);

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

  const handleOpen = () => {
    fileInputRef.current?.click();
  };

  const handleOpenLevels = () => {
    if (!document) {
      return;
    }

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

  const handleLevelsReset = () => {
    setLevelsSettings(createDefaultLevelsSettings());
  };

  const handleLevelsCancel = () => {
    setLevelsDialogState((previous) => ({
      ...previous,
      isOpen: false,
    }));
  };

  const handleLevelsApply = () => {
    setLevelsDialogState((previous) => ({
      ...previous,
      isOpen: false,
    }));
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
        currentValues={levelsSettings[levelsDialogState.selectedChannel]}
        onChangeChannel={handleLevelsChannelChange}
        onChangeHistogramMode={handleHistogramModeChange}
        onTogglePreview={handleLevelsPreviewToggle}
        onReset={handleLevelsReset}
        onCancel={handleLevelsCancel}
        onApply={handleLevelsApply}
      />
    </Box>
  );
}

export default App;