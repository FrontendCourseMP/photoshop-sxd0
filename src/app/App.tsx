import { Box } from "@mui/material";
import Toolbar from "../components/Toolbar";
import CanvasViewport from "../components/CanvasViewport";
import StatusBar from "../components/StatusBar";
import "../App.css";

function App() {
  return (
    <Box className="app-shell">
      <Toolbar />
      <CanvasViewport />
      <StatusBar
        format="—"
        width={0}
        height={0}
        colorDepth="—"
        hasMask={false}
      />
    </Box>
  );
}

export default App;