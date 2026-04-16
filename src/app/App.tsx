import { Box } from "@mui/material";
import "../App.css";

function App() {
  return (
    <Box className="app-shell">
      <header className="app-toolbar">Toolbar</header>
      <main className="app-workspace">Workspace</main>
      <footer className="app-statusbar">Status bar</footer>
    </Box>
  );
}

export default App;