import {
  AppBar,
  Box,
  Button,
  Stack,
  Toolbar as MuiToolbar,
  Typography,
} from "@mui/material";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

function Toolbar() {
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

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={<AddPhotoAlternateOutlinedIcon />}
            disableElevation
          >
            Open
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            disabled
          >
            Export PNG
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            disabled
          >
            Export JPG
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            disabled
          >
            Export GB7
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineOutlinedIcon />}
            disabled
          >
            Clear
          </Button>
        </Stack>
      </MuiToolbar>
    </AppBar>
  );
}

export default Toolbar;