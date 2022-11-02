import * as Three from 'three';
import { PivotControls, TransformControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import { loadVDB } from "../../../src/openvdb";
import { Bunny } from "../utils/Bunny";
import { DebugLight } from "../utils/DebugLight";

export const SpotLights = () => {
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
      <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xff0000} intensity={.2} />
      <DebugLight color={0x00ffff} position={[ 30.0, 80.0, 0.0 ]} lightType="spot" />
      <DebugLight color={0xff00ff} position={[ -30.0, 80.0, 0.0 ]} lightType="spot" />
      <Bunny
        vdbSource={vdbSource}
        color={0xffffff}
        resolution={100}
        absorbance={.5}
      />
    </>
  );
};
