import * as Three from 'three';
import styled from 'styled-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from 'react-three-fiber';
import { Html, OrbitControls } from '@react-three/drei';
import GUI from 'lil-gui';
import { SimpleDropzone } from 'simple-dropzone';

import { loadVDB, VolumeToBbox, VolumeToFog } from '../../src/openvdb/three';
import { DebugLight } from './utils/DebugLight';

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

const PopUpBox = styled(Html)`
  & > div {
    display: inline-block;
    padding: 10px 15px;
    border-radius: 4px;
    background-color: #372948;
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    white-space: nowrap;
    transform: translateX(-50%) translateY(-50%);
    user-select: none;
    pointer-events: none;
  }
`;

export const App = () => {
  const defaults = {
    sourceFile: null,
    renderType: 'debugBbox',
    progressiveLoad: true,
    resolution: 20,
    threshold: 0.01,
    opacity: 1.0,
    range: 0.01,
    steps: 100
  };
  // NOTE UI
  const [vdbSource, setVdbSource] = useState(defaults.sourceFile);
  const [output, setOutput] = useState(new Three.Object3D());
  const [popUpText, setPopUpText] = useState(null);
  const [dropZoneLoadingState, setDropZoneLoadingState] = useState('Drop VDB here');
  const dropZoneRef = useRef();

  // NOTE Rendering
  const [renderType, setRenderType] = useState(defaults.renderType);
  const [progressiveLoad, setProgressiveLoad] = useState(defaults.progressiveLoad);
  
  // NOTE Fog
  const [resolution, setResolution] = useState(defaults.resolution);
  const [threshold, setThreshold] = useState(defaults.threshold);
  const [opacity, setOpacity] = useState(defaults.opacity);
  const [range, setRange] = useState(defaults.range);
  const [steps, setSteps] = useState(defaults.steps);

  useEffect(() => {
    const gui = new GUI();

    gui.add(defaults, 'sourceFile', {
      'Select...': null,
      'Cube (Mesh)': 'cube',
      'Smoke Volume (Fog)': 'smoke',
      'Sphere (Mesh)': 'sphere',
      'Utah Teapot (Mesh)': 'utahteapot'
    }).name('Source File').onChange((filename) => {
      if (!filename) {
        setVdbSource(null);
        return;
      }

      loadVDB(`./assets/${filename}.vdb`).then(vdb => {
        setVdbSource(vdb);
      }).catch(() => {
        alert('Could not load the VDB file.');
      });
    });

    gui.add(defaults, 'renderType', {
      'BBOX': 'debugBbox',
      'Fog (WebGL2)': 'fog'
    }).name('Render Type').onChange(setRenderType);

    gui.add(defaults, 'progressiveLoad', true).name('Progressive').onChange(setProgressiveLoad);

    const fogSettings = gui.addFolder('Fog');
    fogSettings.add(defaults, 'resolution', 10.0, 200.0, 1.0).name('Resolution').onChange(setResolution);
    fogSettings.add(defaults, 'threshold', 0.001, 2.0, 0.001).name('Threshold').onChange(setThreshold);
    fogSettings.add(defaults, 'opacity', 1.0, 2.0, 0.001).name('Opacity').onChange(setOpacity);
    fogSettings.add(defaults, 'range', 0.001, 2.0, 0.001).name('Range').onChange(setRange);
    fogSettings.add(defaults, 'steps', 1.0, 500.0, 1.0).name('Steps').onChange(setSteps);
  }, []);

  useEffect(() => {
    let output;

    if (!vdbSource) {
      setOutput(new Three.Object3D());
      return;
    }

    if (renderType === 'debugBbox') {
      output = new VolumeToBbox(vdbSource);
    }

    if (renderType === 'fog') {
      output = new VolumeToFog(vdbSource, null, {
        resolution: resolution,
        progressive: progressiveLoad,
        threshold: threshold,
        opacity: opacity,
        range: range,
        steps: steps,
      }, () => {
        setPopUpText(null);
      }, ({ convertedVoxels, totalVoxels }) => {
        setPopUpText(`${convertedVoxels} / ${totalVoxels} voxels (${((convertedVoxels / totalVoxels) * 100.0).toFixed(0)}%)`);
      });
    }

    const sampleGrid = vdbSource.grids[Object.keys(vdbSource.grids)[0]];
    const worldBbox = new Three.Box3();
    worldBbox.set(...sampleGrid.getPreciseWorldBbox());
    const worldOffset = new Three.Vector3();
    worldBbox.getSize(worldOffset).multiplyScalar(0.5);

    output.position.y += worldOffset.y;

    setOutput(output);
    setDropZoneLoadingState('Drop VDB here');

    return () => {
      if (output?.dispose) {
        output.dispose();
      }
    };
  }, [vdbSource, renderType, progressiveLoad, resolution]);

  useEffect(() => {
    if (renderType !== 'fog') {
      return;
    }

    output.traverse(child => {
      if (child.material?.isVolumetricFogMaterial) {
        child.material.uniforms.threshold.value = threshold;
        child.material.uniforms.opacity.value = opacity;
        child.material.uniforms.range.value = range;
        child.material.uniforms.steps.value = steps;

        child.material.needsUpdate = true;
      }
    });
  }, [renderType, threshold, opacity, range, steps]);

  useEffect(() => {
    const dropzone = new SimpleDropzone(dropZoneRef.current, document.createElement('input'));

    dropzone.on('drop', ({ files }) => {
      let file = [...files];

      const fileSource = URL.createObjectURL(file[0][1]);

      setDropZoneLoadingState('Reading VDB');

      loadVDB(fileSource).then(vdb => {
        setVdbSource(vdb);
      }).catch(() => {
        alert('Could not load the VDB file.');
      });
    });
    
    dropzone.on('dropstart', () => {
      setDropZoneLoadingState('Loading file');
    });

    dropzone.on('droperror', ({ message }) => {
      setDropZoneLoadingState(`Error: ${message}`);
    });
  }, [dropZoneRef.current]);

  const randomLightColor = useMemo(() => Math.random() * 0x888888 + 0x888888, []);

  return (
    <DemoWrapper>
      <Canvas flat onCreated={(gl) => {
        gl.camera.position.z = 250.0;
      }}>
        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2.0 - 0.1}
          maxDistance={475.0}
        />
        <mesh>
          <sphereGeometry args={[ 500.0, 32, 32 ]} />
          <meshBasicMaterial wireframe color={0x372948} />
        </mesh>
        {Array(9).fill(0).map((_, step) => (
          <mesh rotation={[ -Math.PI / 2.0, 0.0, 0.0 ]} key={step}>
            <circleGeometry args={[ 500.0 / 8.0 * step, 32 ]} />
            <meshBasicMaterial wireframe color={0x372948} />
          </mesh>
        ))}
        <mesh rotation={[ -Math.PI / 2.0, 0.0, 0.0 ]} position={[ 0.0, -0.01, 0.0 ]}>
          <circleGeometry args={[ 500.0, 32 ]} />
          <meshStandardMaterial color={0x251B37} />
        </mesh>
        <mesh position={[ 10.0, 10.0, 10.0 ]}>
          <sphereGeometry args={[ 5.0, 32, 32 ]} />
          <meshPhongMaterial color={0x000055} />
        </mesh>
        <primitive object={output} />
        {popUpText !== null && (
          <PopUpBox>
            <div>
              {popUpText}
            </div>
          </PopUpBox>
        )}
        <DebugLight color={0x00ffff} position={[ 30.0, 50.0, 10.0 ]} />
        <DebugLight color={0xff00ff} position={[ -30.0, 50.0, 10.0 ]} />
        <DebugLight color={0x00ff00} position={[ 0.0, 40.0, 0.0 ]} />
        {/* <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xff0000} intensity={2.} /> */}
        {/* <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xffffff} intensity={1.} /> */}
        {/* <directionalLight position={[ 0.0, -1.0, 0.0 ]} color={0xff00ff} intensity={1.} /> */}
      </Canvas>
      <DropZone ref={dropZoneRef}>
        <div>
          {dropZoneLoadingState}
        </div>
      </DropZone>
    </DemoWrapper>
  );
};
