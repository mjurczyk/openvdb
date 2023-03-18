import { useEffect, useState } from "react";
import { VDBPreview } from "../utils/VDBPreview";
import { DebugLight } from "../utils/DebugLight";
import * as OpenVDB from "../../../src/openvdb/three";
import { LoadingNote } from "../utils/LoadingNote";
import { gui } from "../Gui";

export const SpotLights = () => {
  const [vdbSource, setVdbSource] = useState(null);
  const [materialProps, setMaterialProps] = useState({
    absorbance: 1.0
  });

  useEffect(() => {
    new OpenVDB.VDBLoader().load('./assets/bunny_cloud.vdb', (vdb) => {
      setVdbSource(vdb);
    }, null, () => {
      alert('Could not load the VDB file.');
    });
  }, []);

  useEffect(() => {
    gui.add(materialProps, 'absorbance', 0.0, 1.0, 0.01).name('Absorbance').onChange((value) => {
      setMaterialProps(current => ({
        ...current,
        absorbance: value
      }));
    });
  });

  if (!vdbSource) {
    return <LoadingNote />;
  }

  return (
    <>
      {/* <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xff0000} intensity={0.1} /> */}
      <DebugLight color={0x00ffff} position={[ 40.0, 60.0, 0.0 ]} intensity={0.5} />
      <DebugLight color={0xff00ff} position={[ -40.0, 80.0, 0.0 ]} intensity={0.5} />
      <VDBPreview
        vdbSource={vdbSource}
        color={0xffffff}
        resolution={200}
        absorbance={1.0}
        steps={50}
        position={[ 0.0, -0.0, 0.0]}
        {...materialProps}
      />
    </>
  );
};
