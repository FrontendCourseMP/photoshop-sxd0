import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent as ReactMouseEvent } from "react";
import { Box } from "@mui/material";
import Toolbar from "../components/Toolbar";
import CanvasViewport from "../components/CanvasViewport";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import LevelsDialog from "../components/LevelsDialog";
import ResizeDialog from "../components/ResizeDialog";
import useImageDocument from "../hooks/useImageDocument";
import type {
  ChannelVisibility,
  SampledPixelInfo,
  ToolMode,
} from "../types/image";
import type {
  HistogramData,
  LevelsChannelTarget,
  LevelsDialogState,
  LevelsHistogramMode,
  LevelsSettingsMap,
} from "../types/levels";
import {
  createDefaultLevelsSettings,
  getDefaultLevelsChannel,
} from "../types/levels";
import type { InterpolationMethod, ResizeDimensions } from "../types/scale";
import {
  SCALE_PERCENT_DEFAULT,
  SCALE_PERCENT_MAX,
  SCALE_PERCENT_MIN,
} from "../types/scale";
import { cloneImageData, imageDataHasAlpha } from "../utils/analyzeImageData";
import { applyChannelVisibility } from "../utils/applyChannelVisibility";
import { applyLevelsToImageData } from "../utils/applyLevels";
import { decodeGB7 } from "../utils/decodeGB7";
import { exportImageAsGB7 } from "../utils/encodeGB7";
import { exportImageAsJpg, exportImageAsPng } from "../utils/exportImage";
import { getCanvasPixelCoordinates } from "../utils/getCanvasPixelCoordinates";
import { computeHistogram } from "../utils/histogram";
import { loadStandardImage } from "../utils/loadStandardImage";
import { renderToCanvas } from "../utils/renderToCanvas";
import {
  calculateDimensionsFromPercent,
  calculateMaxScalePercentForPixelLimit,
  calculateScalePercentToFit,
  resizeImageData,
} from "../utils/resizeImage";
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

function createEmptyHistogram(): HistogramData {
  return {
    bins: new Array<number>(256).fill(0),
    maxValue: 0,
    totalPixels: 0,
  };
}

function areAllChannelsVisible(channels: ChannelVisibility): boolean {
  return channels.red && channels.green && channels.blue && channels.alpha;
}

function getVisiblePixelValues(
  red: number,
  green: number,
  blue: number,
  alpha: number,
  channels: ChannelVisibility
): Pick<SampledPixelInfo, "r" | "g" | "b" | "a"> {
  const alphaOnly =
    channels.alpha &&
    !channels.red &&
    !channels.green &&
    !channels.blue;

  if (alphaOnly) {
    return {
      r: alpha,
      g: alpha,
      b: alpha,
      a: 255,
    };
  }

  if (!channels.red && !channels.green && !channels.blue && !channels.alpha) {
    return {
      r: 0,
      g: 0,
      b: 0,
      a: 255,
    };
  }

  return {
    r: channels.red ? red : 0,
    g: channels.green ? green : 0,
    b: channels.blue ? blue : 0,
    a: channels.alpha ? alpha : 255,
  };
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

const DISPLAY_FIT_PADDING_PX = 50;
const MAX_VIEW_PIXELS = 10_000_000;

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { document, setDocument, hasImage, metadata, clearDocument } =
    useImageDocument();

  const [errorMessage, setErrorMessage] = useState("");
  const [toolMode, setToolMode] = useState<ToolMode>("none");
  const [channels, setChannels] = useState<ChannelVisibility>(defaultChannels);
  const [sampledPixel, setSampledPixel] = useState<SampledPixelInfo | null>(
    null
  );
  const [displayScalePercent, setDisplayScalePercent] = useState(
    SCALE_PERCENT_DEFAULT
  );

  const [levelsDialogState, setLevelsDialogState] =
    useState<LevelsDialogState>(defaultLevelsDialogState);
  const [levelsSettings, setLevelsSettings] = useState<LevelsSettingsMap>(
    createDefaultLevelsSettings()
  );
  const [previewRenderSettings, setPreviewRenderSettings] =
    useState<LevelsSettingsMap>(createDefaultLevelsSettings());
  const [levelsBaseImageData, setLevelsBaseImageData] =
    useState<ImageData | null>(null);
  const [resizeDialogOpen, setResizeDialogOpen] = useState(false);

  const displayScaleMax = useMemo(() => {
    if (!document) {
      return SCALE_PERCENT_MAX;
    }

    return calculateMaxScalePercentForPixelLimit(
      document.width,
      document.height,
      MAX_VIEW_PIXELS
    );
  }, [document]);

  useEffect(() => {
    if (displayScalePercent > displayScaleMax) {
      setDisplayScalePercent(displayScaleMax);
    }
  }, [displayScalePercent, displayScaleMax]);

  useEffect(() => {
    if (!levelsDialogState.isOpen || !levelsDialogState.previewEnabled) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      setPreviewRenderSettings(levelsSettings);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [
    levelsDialogState.isOpen,
    levelsDialogState.previewEnabled,
    levelsSettings,
  ]);

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
      previewRenderSettings
    );
  }, [
    document,
    levelsBaseImageData,
    levelsDialogState.isOpen,
    levelsDialogState.previewEnabled,
    previewRenderSettings,
  ]);

  const displayedImageData = levelsPreviewImageData ?? document?.imageData ?? null;

  const scaledDisplayImageData = useMemo(() => {
    if (!displayedImageData) {
      return null;
    }

    const safeScalePercent = clamp(
      displayScalePercent,
      SCALE_PERCENT_MIN,
      displayScaleMax
    );

    const dimensions = calculateDimensionsFromPercent(
      displayedImageData.width,
      displayedImageData.height,
      safeScalePercent
    );

    return resizeImageData(displayedImageData, dimensions, "bilinear");
  }, [displayedImageData, displayScalePercent, displayScaleMax]);

  const scaledRenderedImageData = useMemo(() => {
    if (!scaledDisplayImageData) {
      return null;
    }

    if (areAllChannelsVisible(channels)) {
      return scaledDisplayImageData;
    }

    return applyChannelVisibility(scaledDisplayImageData, channels);
  }, [scaledDisplayImageData, channels]);

  const levelsHistogram = useMemo(() => {
    if (!document || !levelsDialogState.isOpen) {
      return createEmptyHistogram();
    }

    return computeHistogram(document.imageData, levelsDialogState.selectedChannel);
  }, [document, levelsDialogState.isOpen, levelsDialogState.selectedChannel]);

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
    if (!scaledRenderedImageData || !canvasRef.current) {
      return;
    }

    renderToCanvas(canvasRef.current, scaledRenderedImageData);
  }, [scaledRenderedImageData]);

  const calculateInitialDisplayScale = (imageData: ImageData): number => {
    const viewportWidth =
      canvasViewportRef.current?.clientWidth ?? window.innerWidth;
    const viewportHeight =
      canvasViewportRef.current?.clientHeight ?? window.innerHeight;

    const fitScale = calculateScalePercentToFit(
      imageData.width,
      imageData.height,
      viewportWidth,
      viewportHeight,
      DISPLAY_FIT_PADDING_PX
    );

    const maxSafeScale = calculateMaxScalePercentForPixelLimit(
      imageData.width,
      imageData.height,
      MAX_VIEW_PIXELS
    );

    return clamp(fitScale, SCALE_PERCENT_MIN, maxSafeScale);
  };

  const resetLevelsState = () => {
    setLevelsDialogState(defaultLevelsDialogState);
    setLevelsSettings(createDefaultLevelsSettings());
    setPreviewRenderSettings(createDefaultLevelsSettings());
    setLevelsBaseImageData(null);
  };

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

  const handleDisplayScaleChange = (value: number) => {
    const nextScale = clamp(
      Math.round(value),
      SCALE_PERCENT_MIN,
      displayScaleMax
    );

    setDisplayScalePercent(nextScale);
    setSampledPixel(null);
  };

  const handleOpenResize = () => {
    if (!document) {
      return;
    }

    setToolMode("none");
    setSampledPixel(null);
    setResizeDialogOpen(true);
  };

  const handleResizeCancel = () => {
    setResizeDialogOpen(false);
  };

  const handleResizeApply = (
    dimensions: ResizeDimensions,
    interpolationMethod: InterpolationMethod
  ) => {
    if (!document) {
      return;
    }

    try {
      const resizedImageData = resizeImageData(
        document.imageData,
        dimensions,
        interpolationMethod
      );

      const hasAlpha = imageDataHasAlpha(resizedImageData);
      const nextDisplayScale = calculateInitialDisplayScale(resizedImageData);

      setDisplayScalePercent(nextDisplayScale);
      setDocument({
        ...document,
        width: resizedImageData.width,
        height: resizedImageData.height,
        imageData: resizedImageData,
        hasMask: hasAlpha,
        colorDepth: getUpdatedColorDepth(document.channelModel, hasAlpha),
      });

      setResizeDialogOpen(false);
      setToolMode("none");
      setSampledPixel(null);
      setChannels(defaultChannels);
      resetLevelsState();
      setErrorMessage("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to resize image.";

      setErrorMessage(message);
    }
  };

  const handleOpenLevels = () => {
    if (!document) {
      return;
    }

    const defaults = createDefaultLevelsSettings();

    setLevelsSettings(defaults);
    setPreviewRenderSettings(defaults);
    setLevelsBaseImageData(cloneImageData(document.imageData));
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
    const defaultSettings = createDefaultLevelsSettings();

    setLevelsSettings(defaultSettings);
    setPreviewRenderSettings(defaultSettings);
  };

  const handleLevelsCancel = () => {
    resetLevelsState();
    setSampledPixel(null);
  };

  const handleLevelsApply = () => {
    if (!document || !levelsBaseImageData) {
      resetLevelsState();
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

    resetLevelsState();
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
    if (
      toolMode !== "eyedropper" ||
      !displayedImageData ||
      !scaledRenderedImageData
    ) {
      return;
    }

    try {
      const canvasCoordinates = getCanvasPixelCoordinates(
        event.currentTarget,
        event.clientX,
        event.clientY
      );

      const sourceX = clamp(
        Math.floor(
          (canvasCoordinates.x * displayedImageData.width) /
            scaledRenderedImageData.width
        ),
        0,
        displayedImageData.width - 1
      );

      const sourceY = clamp(
        Math.floor(
          (canvasCoordinates.y * displayedImageData.height) /
            scaledRenderedImageData.height
        ),
        0,
        displayedImageData.height - 1
      );

      const pixelIndex = (sourceY * displayedImageData.width + sourceX) * 4;
      const red = displayedImageData.data[pixelIndex];
      const green = displayedImageData.data[pixelIndex + 1];
      const blue = displayedImageData.data[pixelIndex + 2];
      const alpha = displayedImageData.data[pixelIndex + 3];
      const visiblePixel = getVisiblePixelValues(
        red,
        green,
        blue,
        alpha,
        channels
      );
      const lab = rgbToLab(visiblePixel.r, visiblePixel.g, visiblePixel.b);

      setSampledPixel({
        x: sourceX,
        y: sourceY,
        r: visiblePixel.r,
        g: visiblePixel.g,
        b: visiblePixel.b,
        a: visiblePixel.a,
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
    setDisplayScalePercent(SCALE_PERCENT_DEFAULT);
    resetLevelsState();
    setResizeDialogOpen(false);

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

      const initialDisplayScale = calculateInitialDisplayScale(
        loadedDocument.imageData
      );

      setDisplayScalePercent(initialDisplayScale);
      setDocument(loadedDocument);
      setErrorMessage("");
      setToolMode("none");
      setChannels(defaultChannels);
      setSampledPixel(null);
      resetLevelsState();
      setResizeDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to open selected image file.";

      setErrorMessage(message);
      clearDocument();
      setDisplayScalePercent(SCALE_PERCENT_DEFAULT);
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
        onOpenResize={handleOpenResize}
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
          viewportRef={canvasViewportRef}
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
        hasImage={hasImage}
        scalePercent={displayScalePercent}
        scaleMin={SCALE_PERCENT_MIN}
        scaleMax={displayScaleMax}
        onScalePercentChange={handleDisplayScaleChange}
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

      <ResizeDialog
        open={resizeDialogOpen}
        document={document}
        onCancel={handleResizeCancel}
        onApply={handleResizeApply}
      />
    </Box>
  );
}

export default App;