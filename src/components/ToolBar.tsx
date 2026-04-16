import {
  AppBar,
  Button,
  Stack,
  Toolbar as MuiToolbar,
  Typography,
} from "@mui/material";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

interface ToolbarProps {
  hasImage: boolean;
  onOpen: () => void;
  onClear: () => void;
}

function Toolbar({ hasImage, onOpen, onClear }: ToolbarProps) {
  return (
    <AppBar position="static" elevation={0} color="transparent">
      <MuiToolbar
        sx={{
          minHeight: "64px",
          borderBottom: "1px solid #333",
          backgroundColor: "#252526",
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600 }}>
          Image Processing Lab
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: "wrap" }}
        >
          <Button
            variant="contained"
            startIcon={<AddPhotoAlternateOutlinedIcon />}
            disableElevation
            onClick={onOpen}
          >
            Open
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            disabled={!hasImage}
          >
            Export PNG
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            disabled={!hasImage}
          >
            Export JPG
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            disabled={!hasImage}
          >
            Export GB7
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineOutlinedIcon />}
            disabled={!hasImage}
            onClick={onClear}
          >
            Clear
          </Button>
        </Stack>
      </MuiToolbar>
    </AppBar>
  );
}

export default Toolbar;