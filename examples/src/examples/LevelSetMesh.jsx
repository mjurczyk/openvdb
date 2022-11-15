import { useEffect, useState } from "react";
import * as Three from 'three';
import * as OpenVDB from "../../../src/openvdb/three";
import { DebugScene } from "../utils/DebugScene";
import { VDBPreview } from "../utils/VDBPreview";
import { useMemo } from "react";
import { Detailed } from "@react-three/drei";
import { DebugLight } from "../utils/DebugLight";

export const LevelSetMesh = () => {
  const [vdbSource, setVdbSource] = useState(null);

  useEffect(() => {
    new OpenVDB.VDBLoader().load('./assets/sphere.vdb', (vdb) => {
      setVdbSource(vdb);
    }, null, () => {
      alert('Could not load the VDB file.');
    });
  }, []);

  if (!vdbSource) {
    return null;
  }

  return (
    <>
      <DebugScene />
      <DebugLight color={0xff00ff} position={[ 60.0, 20.0, 0.0 ]} />
      <VDBPreview
        vdbSource={vdbSource}
        renderType="levelSet"
        resolution={20}
      />
    </>
  );
};
