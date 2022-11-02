import { TransformControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import { loadVDB } from "../../../src/openvdb";
import { Bunny } from "../utils/Bunny";
import { DebugLight } from "../utils/DebugLight";
import GUI from 'lil-gui';
import { gui } from "../Gui";

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
      <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xff0000} intensity={1.} />
      <directionalLight position={[ -1.0, -1.0, 0.0 ]} color={0x00ffff} intensity={1.} />
      <DebugLight color={0xff00ff} position={[ 90.0, 40.0, 0.0 ]} />
      <TransformControls mode={transformMode}>
        <Bunny
          vdbSource={vdbSource}
          color={0xffffff}
          resolution={100}
          absorbance={0.5}
        />
      </TransformControls>
    </>
  );
};
