import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Box } from "@mui/material";
import Toolbar from "../components/Toolbar";
import CanvasViewport from "../components/CanvasViewport";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import useImageDocument from "../hooks/useImageDocument";
import type {
  ChannelVisibility,
  SampledPixelInfo,
  ToolMode,
} from "../types/image";
import { decodeGB7 } from "../utils/decodeGB7";
import { exportImageAsGB7 } from "../utils/encodeGB7";
import { exportImageAsJpg, exportImageAsPng } from "../utils/exportImage";
import { loadStandardImage } from "../utils/loadStandardImage";
import { renderToCanvas } from "../utils/renderToCanvas";
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

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { document, setDocument, hasImage, metadata, clearDocument } =
    useImageDocument();

  const [errorMessage, setErrorMessage] = useState("");
  const [toolMode, setToolMode] = useState<ToolMode>("none");
  const [channels] = useState<ChannelVisibility>(defaultChannels);
  const [sampledPixel] = useState<SampledPixelInfo | null>(null);

  useEffect(() => {
    if (!document || !canvasRef.current) {
      return;
    }

    renderToCanvas(canvasRef.current, document.imageData);
  }, [document]);

  const handleOpen = () => {
    fileInputRef.current?.click();
  };

  const handleToggleEyedropper = () => {
    setToolMode((previous) =>
      previous === "eyedropper" ? "none" : "eyedropper"
    );
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
        />

        <Sidebar
          channels={channels}
          toolMode={toolMode}
          sampledPixel={sampledPixel}
        />
      </Box>

      <StatusBar
        fileName={document?.fileName ?? ""}
        format={metadata.format}
        width={metadata.width}
        height={metadata.height}
        colorDepth={metadata.colorDepth}
        hasMask={metadata.hasMask}
      />
    </Box>
  );
}

export default App;