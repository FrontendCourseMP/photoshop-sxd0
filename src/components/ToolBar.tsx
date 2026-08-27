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
import ColorizeOutlinedIcon from "@mui/icons-material/ColorizeOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import AspectRatioOutlinedIcon from "@mui/icons-material/AspectRatioOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import type { ToolMode } from "../types/image";

interface ToolbarProps {
  hasImage: boolean;
  toolMode: ToolMode;
  onOpen: () => void;
  onOpenLevels: () => void;
  onOpenResize: () => void;
  onOpenFilters: () => void;
  onExportPng: () => void;
  onExportJpg: () => void;
  onExportGb7: () => void;
  onToggleEyedropper: () => void;
  onClear: () => void;
}

function Toolbar({
  hasImage,
  toolMode,
  onOpen,
  onOpenLevels,
  onOpenResize,
  onOpenFilters,
  onExportPng,
  onExportJpg,
  onExportGb7,
  onToggleEyedropper,
  onClear,
}: ToolbarProps) {
  return (
    <AppBar position="static" elevation={0} color="transparent">
      <MuiToolbar
        className="app-toolbar"
        sx={{
          minHeight: "64px",
          borderBottom: "1px solid #333",
          backgroundColor: "#252526",
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography
          className="app-toolbar__title"
          variant="h6"
          sx={{ fontSize: 18, fontWeight: 600, flexShrink: 0 }}
        >
          Image Processing Lab
        </Typography>

        <Stack
          className="app-toolbar__actions"
          direction="row"
          spacing={1}
          useFlexGap
          sx={{
            flex: 1,
            minWidth: 0,
            flexWrap: "nowrap",
            justifyContent: "flex-end",
            overflowX: "auto",
            py: 0.5,
          }}
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
            startIcon={<TuneOutlinedIcon />}
            disabled={!hasImage}
            onClick={onOpenLevels}
          >
            Levels
          </Button>

          <Button
            variant="outlined"
            startIcon={<AspectRatioOutlinedIcon />}
            disabled={!hasImage}
            onClick={onOpenResize}
          >
            Resize
          </Button>

          <Button
            variant="outlined"
            startIcon={<FilterAltOutlinedIcon />}
            disabled={!hasImage}
            onClick={onOpenFilters}
          >
            Filters
          </Button>

          <Button
            variant={toolMode === "eyedropper" ? "contained" : "outlined"}
            color={toolMode === "eyedropper" ? "secondary" : "inherit"}
            startIcon={<ColorizeOutlinedIcon />}
            disabled={!hasImage}
            onClick={onToggleEyedropper}
          >
            Eyedropper
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            disabled={!hasImage}
            onClick={onExportPng}
          >
            Export PNG
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            disabled={!hasImage}
            onClick={onExportJpg}
          >
            Export JPG
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadOutlinedIcon />}
            disabled={!hasImage}
            onClick={onExportGb7}
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
