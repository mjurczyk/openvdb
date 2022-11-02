import { useEffect, useState } from "react";
import { VDBPreview } from "../utils/VDBPreview";
import { DebugLight } from "../utils/DebugLight";
import { VDBLoader } from '../../../src/openvdb/three';

export const SpotLights = () => {
  const [vdbSource, setVdbSource] = useState(null);

  useEffect(() => {
    new VDBLoader().load('./assets/bunny_cloud.vdb', (vdb) => {
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
      <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xff0000} intensity={1.} />
      <DebugLight color={0x00ffff} position={[ 30.0, 80.0, 0.0 ]} lightType="spot" />
      <DebugLight color={0xff00ff} position={[ -30.0, 80.0, 0.0 ]} lightType="spot" />
      <VDBPreview
        vdbSource={vdbSource}
        color={0xffffff}
        resolution={100}
        absorbance={1.}
      />
    </>
  );
};
