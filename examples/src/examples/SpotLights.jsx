import { useEffect, useState } from "react";
import { VDBPreview } from "../utils/VDBPreview";
import { DebugLight } from "../utils/DebugLight";
import * as OpenVDB from "../../../src/openvdb/three";
import { DebugScene } from "../utils/DebugScene";

export const SpotLights = () => {
  const [vdbSource, setVdbSource] = useState(null);

  useEffect(() => {
    new OpenVDB.VDBLoader().load('./assets/bunny_cloud.vdb', (vdb) => {
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
      <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xff0000} intensity={0.5} />
      <DebugLight color={0x00ffff} position={[ 30.0, 80.0, 0.0 ]} lightType="spot" intensity={5.0} />
      <DebugLight color={0xff00ff} position={[ -30.0, 80.0, 0.0 ]} lightType="spot" intensity={5.0} />
      <VDBPreview
        vdbSource={vdbSource}
        color={0xffffff}
        resolution={100}
        absorbance={1.}
      />
    </>
  );
};
