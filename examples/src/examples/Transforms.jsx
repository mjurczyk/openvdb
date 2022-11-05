import { TransformControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import { VDBPreview } from "../utils/VDBPreview";
import { DebugLight } from "../utils/DebugLight";
import { gui } from "../Gui";
import * as OpenVDB from "../../../src/openvdb/three";
import { DebugScene } from "../utils/DebugScene";

export const Transforms = () => {
  const [vdbSource, setVdbSource] = useState(null);
  const [transformMode, setTransformMode] = useState('translate');

  useEffect(() => {
    gui.add({ transformMode }, 'transformMode', {
      'Translate': 'translate',
      'Rotate': 'rotate',
      'Scale': 'scale',
    }).name('Transform Mode').onChange((mode) => {
      setTransformMode(mode);
    });

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
      <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xff0000} intensity={1.} />
      <directionalLight position={[ -1.0, -1.0, 0.0 ]} color={0x00ffff} intensity={1.} />
      <DebugLight color={0xff00ff} position={[ 90.0, 40.0, 0.0 ]} />
      <TransformControls mode={transformMode}>
        <VDBPreview
          vdbSource={vdbSource}
          color={0xffffff}
          resolution={100}
          absorbance={0.5}
        />
      </TransformControls>
    </>
  );
};
