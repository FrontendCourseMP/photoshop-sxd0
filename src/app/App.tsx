import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Box } from "@mui/material";
import Toolbar from "../components/Toolbar";
import CanvasViewport from "../components/CanvasViewport";
import StatusBar from "../components/StatusBar";
import useImageDocument from "../hooks/useImageDocument";
import { loadStandardImage } from "../utils/loadStandardImage";
import { renderToCanvas } from "../utils/renderToCanvas";
import "../App.css";

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { document, setDocument, hasImage, metadata, clearDocument } =
    useImageDocument();

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!document || !canvasRef.current) {
      return;
    }

    renderToCanvas(canvasRef.current, document.imageData);
  }, [document]);

  const handleOpen = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    clearDocument();
    setErrorMessage("");

    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");

      if (context) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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
      const loadedDocument = await loadStandardImage(selectedFile);
      setDocument(loadedDocument);
      setErrorMessage("");
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
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        hidden
        onChange={handleFileChange}
      />

      <Toolbar
        hasImage={hasImage}
        onOpen={handleOpen}
        onClear={handleClear}
      />

      <CanvasViewport
        hasImage={hasImage}
        canvasRef={canvasRef}
        errorMessage={errorMessage}
      />

      <StatusBar
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