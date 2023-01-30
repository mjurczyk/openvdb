import { useEffect, useState } from "react";
import { useFrame } from "react-three-fiber";
import * as Three from 'three';
import * as OpenVDB from "../../../src/openvdb/three";
import { DebugLight } from "../utils/DebugLight";
import { DebugScene } from "../utils/DebugScene";

export const Primitives = () => {
  const [output, setOutput] = useState(new Three.Object3D());

  useEffect(() => {
    const group = new Three.Group();

    const parametricPrimitive = new OpenVDB.ParametricVolume((position) => {
      const { x, y, z } = position;

      return position.length() < 0.65 && y + 0.5 + Math.sin(x * 50.0) * 0.5 * Math.sin(z * 50.0) * 0.5 < 0.5
    });

    const parametricVolume = new OpenVDB.FogVolume(parametricPrimitive, null, {
      resolution: 100,
      progressive: true,
      steps: 100,
      absorbance: 0.1,
      color: 0xff0000
    });
    parametricVolume.scale.setScalar(100.0);
    parametricVolume.position.y += 50.0;
    group.add(parametricVolume);

    const cubePrimitive = new OpenVDB.CubeVolume();
    const cubeVolume = new OpenVDB.FogVolume(cubePrimitive, null, {
      resolution: 100,
      progressive: true,
      steps: 100,
      absorbance: 0.1,
      color: 0x00ff00
    });
    cubeVolume.scale.setScalar(100.0);
    cubeVolume.position.x += 150.0;
    cubeVolume.position.y += 50.0;
    group.add(cubeVolume);

    const spherePrimitive = new OpenVDB.SphereVolume();
    const sphereVolume = new OpenVDB.FogVolume(spherePrimitive, null, {
      resolution: 100,
      progressive: true,
      steps: 200,
      absorbance: 1.0,
      color: 0x0000ff
    });
    sphereVolume.scale.setScalar(100.0);
    sphereVolume.position.x -= 150.0;
    sphereVolume.position.y += 50.0;
    group.add(sphereVolume);

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
