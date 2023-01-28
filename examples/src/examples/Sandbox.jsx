import { useEffect, useRef, useState, useContext } from "react";
import { DebugScene } from "../utils/DebugScene";
import { VDBPreview } from "../utils/VDBPreview";
import { VDBUploadContext } from "../utils/VDBUpload";

export const Sandbox = () => {
  const vdbUploadContext = useContext(VDBUploadContext);
  const { vdbFile, setShowVDBUpload, setVDBFile } = vdbUploadContext;

  useEffect(() => {
    if (!vdbFile) {
      setShowVDBUpload(true);
    }

    return () => {
      setShowVDBUpload(false);
    };
  });

  useEffect(() => {
    if (vdbFile) {
      setShowVDBUpload(false);
    }
  }, [vdbFile]);

  if (!vdbFile) {
    return null;
  }

  return (
    <>
      <DebugScene />
      <VDBPreview
        vdbSource={vdbFile}
        resolution={500}
        color={0xffffff}
        absorbance={1.}
      />
      <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xff0000} intensity={1.} />
      <directionalLight position={[ -1.0, -1.0, 0.0 ]} color={0x00ffff} intensity={1.} />
    </>
  );
};
