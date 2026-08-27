import { useMemo, useState } from "react";
import type { ImageDocument } from "../types/image";

function useImageDocument() {
  const [document, setDocument] = useState<ImageDocument | null>(null);

  const metadata = useMemo(() => {
    if (!document) {
      return {
        format: "—",
        width: 0,
        height: 0,
        colorDepth: "—",
        hasMask: false,
        channelCount: 0,
      };
    }

    return {
      format: document.format.toUpperCase(),
      width: document.width,
      height: document.height,
      colorDepth: document.colorDepth,
      hasMask: document.hasMask,
      channelCount: document.channelCount,
    };
  }, [document]);

  const clearDocument = () => {
    setDocument(null);
  };

  return {
    document,
    setDocument,
    clearDocument,
    metadata,
    hasImage: document !== null,
  };
}

export default useImageDocument;
