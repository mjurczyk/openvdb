import * as Three from 'three';
import styled from 'styled-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from 'react-three-fiber';
import { Html, OrbitControls, Stats } from '@react-three/drei';
import GUI from 'lil-gui';
import { SimpleDropzone } from 'simple-dropzone';

import { loadVDB, VolumeToBbox, VolumeToFog } from '../../src/openvdb/three';
import { DebugLight } from './utils/DebugLight';
import { Bunny } from './utils/Bunny';
import { PropertyMatrix } from './examples/PropertyMatrix';
import { Transforms } from './examples/Transforms';
import { gui } from './Gui';
import { SpotLights } from './examples/SpotLights';
import { Bbox } from './examples/Bbox';

const DemoWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #251B37;
  color: #FFECEF;
  font-family: 'Baloo Tamma 2', Arial, Helvetica, sans-serif;
  line-height: 1.23;
  z-index: 1;

  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2;
  }
`;

const DropZone = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  width: 180px;
  height: 60px;
  background-color: #372948;
  border: dashed #FFCACA 2px;
  z-index: 3;

  & > * {
    position: absolute;
    display: inline-block;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    opacity: 0.5;
    pointer-events: none;
    transition: opacity 0.1s ease;
    white-space: nowrap;
  }

  &:hover > * {
    opacity: 1.0;
  }
`;

export const App = () => {
  const [demo, setDemo] = useState('bbox');

  useEffect(() => {
    gui.controllersRecursive().forEach(controller => controller.destroy());

    gui.add({ demo }, 'demo', {
      'BBOX': 'bbox',
      'Transforms': 'transforms',
      'Spotlights': 'spotLights',
      'Property Matrix': 'propertyMatrix',
    }).name('Example').onChange((demo) => {
      setDemo(demo);
    });
  });

  return (
    <DemoWrapper>
      <Canvas flat onCreated={(gl) => {
        gl.camera.position.z = 250.0;
      }}>
        {({
          'bbox': <Bbox />,
          'transforms': <Transforms />,
          'propertyMatrix': <PropertyMatrix />,
          'spotLights': <SpotLights />,
        })[demo]}
        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2.0 - 0.1}
          maxDistance={475.0}
        />
        {Array(9).fill(0).map((_, step) => (
          <mesh rotation={[ -Math.PI / 2.0, 0.0, 0.0 ]} key={step}>
            <circleGeometry args={[ 500.0 / 8.0 * step, 32 ]} />
            <meshBasicMaterial wireframe color={0x372948} />
          </mesh>
        ))}
        <mesh rotation={[ -Math.PI / 2.0, 0.0, 0.0 ]} position={[ 0.0, -0.01, 0.0 ]}>
          <circleGeometry args={[ 500.0, 32 ]} />
          <meshBasicMaterial color={0x251B37} />
        </mesh>
      <mesh>
        <sphereGeometry args={[ 500.0, 32, 32 ]} />
        <meshBasicMaterial wireframe color={0x372948} />
      </mesh>
      </Canvas>
      {/* <DropZone ref={dropZoneRef}>
        <div>
          {dropZoneLoadingState}
        </div>
      </DropZone> */}
      <Stats />
    </DemoWrapper>
  );
};
