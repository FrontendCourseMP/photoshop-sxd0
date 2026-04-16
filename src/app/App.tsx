import { useRef } from "react";
import { Box } from "@mui/material";
import Toolbar from "../components/Toolbar";
import CanvasViewport from "../components/CanvasViewport";
import StatusBar from "../components/StatusBar";
import useImageDocument from "../hooks/useImageDocument";
import "../App.css";

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { hasImage, metadata, clearDocument } = useImageDocument();

  const handleOpen = () => {
    window.alert("Image loading will be implemented in the next commit.");
  };

  return (
    <Box className="app-shell">
      <Toolbar
        hasImage={hasImage}
        onOpen={handleOpen}
        onClear={clearDocument}
      />
      <CanvasViewport hasImage={hasImage} canvasRef={canvasRef} />
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