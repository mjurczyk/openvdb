import { useEffect, useState } from "react";
import * as Three from 'three';
import * as OpenVDB from "../../../src/openvdb/three";
import { DebugScene } from "../utils/DebugScene";

export const Temperature = () => {
  const [output, setOutput] = useState(new Three.Object3D());

  useEffect(() => {
    const group = new Three.Group();

    for (let i = 0; i < 5.0; i++) {
      const temperaturePrimitive = new OpenVDB.ParametricVolume((position) => {
        return (position.length() * 2.0) * (i / 5.0);
      });

      const spherePrimitive = new OpenVDB.SphereVolume();
      const sphereVolume = new OpenVDB.FogVolume(spherePrimitive, null, {
        resolution: 100,
        progressive: true,
        steps: 200,
        absorbance: 1.0,
        color: 0x000000,
        emissiveGrid: temperaturePrimitive,
      });
      sphereVolume.scale.setScalar(100.0);
      sphereVolume.position.x -= 250.0 - 125.0 * i;
      sphereVolume.position.y += 50.0;
      group.add(sphereVolume);  
    }

    setOutput(group);
  }, []);

  return (
    <>
      <DebugScene />
      <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xffffff} intensity={1.0} />
      <primitive object={output} />
    </>
  );
};
