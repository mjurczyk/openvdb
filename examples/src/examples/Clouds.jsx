import { useEffect, useState } from "react";
import { useFrame } from "react-three-fiber";
import * as Three from 'three';
import * as OpenVDB from "../../../src/openvdb/three";
import { DebugLight } from "../utils/DebugLight";
import { DebugScene } from "../utils/DebugScene";

export const Clouds = () => {
  const [output, setOutput] = useState(new Three.Object3D());

  useEffect(() => {
    const group = new Three.Group();

    const cloudVolume = new OpenVDB.FogVolume(new OpenVDB.CloudVolume(), null, {
      resolution: 200,
      progressive: true,
      steps: 50 / window.devicePixelRatio,
      absorbance: 0.5,
      color: 0xaaaaaa
    });
    cloudVolume.scale.x = 100.0;
    cloudVolume.scale.y = 50.0;
    cloudVolume.scale.z = 100.0;
    cloudVolume.position.y += 30.0;
    group.add(cloudVolume);

    setOutput(group);
  }, []);

  return (
    <>
      <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xffffff} intensity={10.0} />
      <directionalLight position={[ 0.0, -1.0, 0.0 ]} color={0xccccff} intensity={2.0} />
      <primitive object={output} />
    </>
  );
};
