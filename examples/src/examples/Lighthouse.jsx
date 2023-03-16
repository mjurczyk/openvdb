import { useEffect, useState } from "react";
import { useFrame } from "react-three-fiber";
import * as Three from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as OpenVDB from "../../../src/openvdb/three";

export const Lighthouse = () => {
  const [output, setOutput] = useState(new Three.Object3D());
  const [model, setModel] = useState(new Three.Object3D());
  const [lampLight, setLampLight] = useState(new Three.Object3D());

  useEffect(() => {
    const primitiveGrid = new OpenVDB.CubeVolume();
    const depthMaterial = new Three.MeshStandardMaterial();
    depthMaterial.side = Three.BackSide;
    depthMaterial.depthWrite = false;
    depthMaterial.depthTest = false;
    depthMaterial.transparent = true;
    const output = new OpenVDB.FogVolume(primitiveGrid, depthMaterial, {
      // NOTE High resolution is not necessary for volumetric fog cubes and can save some performance
      resolution: 10,
      progressive: true,
      // NOTE You likely do not want to double the workload on retina displays
      steps: 30 / window.devicePixelRatio,
      absorbance: 0.5,
      color: 0xffffff
    });
    output.scale.setScalar(1100.0);
    output.position.y += 200.0;

    setOutput(output);

    new GLTFLoader().load('./assets/lighthouse.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(20.0);

      model.traverse(child => {
        if (!['water', 'frame'].includes(child.name)) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const lighthouseLight = model.getObjectByName('lighthouse_light');
      const lighthouseLightSource = model.getObjectByName('lighthouse_lightSource');
      const spotLight = new Three.SpotLight(0xffff88, 100.0, 0.0, 1.0, 1.0);
      spotLight.add(spotLight.target);
      spotLight.position.set(0.0, 0.0, 0.3);
      spotLight.target.position.set(0.0, 0.0, 1.0);
      lighthouseLight.add(spotLight);
      setLampLight(lighthouseLight);

      const spotLightBeam = new Three.SpotLight(0xffffff, 200.0, 0.0, 0.5, 1.0);
      spotLightBeam.add(spotLightBeam.target);
      spotLightBeam.position.set(0.0, 0.0, 0.0);
      spotLightBeam.target.position.set(0.0, 0.0, 1.0);
      spotLight.add(spotLightBeam);

      lighthouseLightSource.material = lighthouseLightSource.material.clone();
      lighthouseLightSource.material.emissive = new Three.Color(0xffff33);
      lighthouseLightSource.material.emissiveIntensity = 1.0;

      const boatLight = model.getObjectByName('boat_light');
      const boatLightSource = model.getObjectByName('boat_lightSource');
      const pointLight = new Three.PointLight(0x00ffff, 20.0, 100.0, 2.0);
      boatLight.add(pointLight);

      boatLightSource.material = boatLightSource.material.clone();
      boatLightSource.material.emissive = new Three.Color(0x33ffff);
      boatLightSource.material.emissiveIntensity = 1.0;

      const water = model.getObjectByName('water');
      water.material = new Three.MeshStandardMaterial({
        color: 0x111188,
        roughness: 1.0,
        metalness: 1.0,
        emissiveMap: water.material.map,
        emissive: 0x118888,
        emissiveIntensity: 10.0,
        displacementMap: water.material.map,
        displacementScale: 0.1
      });

      setModel(model);
    });
  }, []);

  let dt = 0.0;
  useFrame(() => {
    dt += 1.0;
    if (lampLight) {
      lampLight.rotation.y += 0.005;
    }

    const water = model.getObjectByName('water');
    const boat = model.getObjectByName('boat');

    if (water) {
      water.material.displacementMap.offset.x += 0.0005;
      water.material.displacementMap.offset.y += 0.0005;
    }

    if (boat) {
      boat.position.y = Math.sin(dt / 30.0) * 0.1 + 0.3;
      boat.rotation.y = Math.sin(dt / 50.0) * 0.1 + 1.0;
      boat.rotation.x = Math.sin(dt / 30.0) * 0.2 + Math.PI;
    }
  });

  if (!model) {
    return null;
  }

  return (
    <>
      <primitive object={output} />
      <primitive object={model} />
    </>
  );
};
