import { TransformControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import { loadVDB } from "../../../src/openvdb";
import { Bunny } from "../utils/Bunny";
import { DebugLight } from "../utils/DebugLight";

export const Bbox = () => {
  const [vdbSource, setVdbSource] = useState(null);

  useEffect(() => {
    loadVDB(`./assets/bunny_cloud.vdb`).then(vdb => {
      setVdbSource(vdb);
    }).catch(() => {
      alert('Could not load the VDB file.');
    });
  }, []);

  if (!vdbSource) {
    return null;
  }

  return (
    <>
      <Bunny
        vdbSource={vdbSource}
        renderType="boundingBox"
      />
    </>
  );
};
