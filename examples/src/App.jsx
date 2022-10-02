import * as Three from 'three';
import WebGL from 'three/examples/jsm/capabilities/WebGL';
import styled from 'styled-components';
import { useEffect, useRef, useState } from 'react';
import { Canvas, render, useThree } from 'react-three-fiber';
import { OrbitControls } from '@react-three/drei';
import GUI from 'lil-gui';
import { SimpleDropzone } from 'simple-dropzone';
import { volumeShaders } from './volumeShaders';

import { loadVDB } from '../../src/openvdb/index';
import { VolumeToBbox } from '../../src/openvdb/tools/VolumeToBbox';
import { VolumeToFog } from '../../src/openvdb/tools/VolumeToFog';

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
  const defaults = {
    sourceFile: null,
    renderType: 'debugBbox'
  };
  const [vdbSource, setVdbSource] = useState(defaults.sourceFile);
  const [renderType, setRenderType] = useState(defaults.renderType);
  const [output, setOutput] = useState(new Three.Object3D());
  
  const dropZoneRef = useRef();
  const [dropZoneLoadingState, setDropZoneLoadingState] = useState('Drop VDB here');

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
  }, []);

  useEffect(() => {
    let output;

    if (!vdbSource) {
      setOutput(new Three.Object3D());
      return;
    }

    if (renderType === 'debugBbox') {
      // NOTE Convert each VDB grid to a set of instanced bounding boxes
      // REF Instancing https://github.com/mrdoob/three.js/blob/master/examples/webgl_instancing_dynamic.html#L118

      const vdbLeavesSum = Object.values(vdbSource.grids).reduce((total, next) => total + next.leavesCount, 0);
      const instancedMesh = new Three.InstancedMesh(
        new Three.BoxGeometry(1.0, 1.0, 1.0),
        new Three.MeshBasicMaterial({ wireframe: true, color: 0xFFCACA, transparent: true, opacity: 0.1 }),
        vdbLeavesSum
      );
      let instanceId = 0;
      const mock = new Three.Object3D();
      
      VolumeToBbox.convert(vdbSource, (bbox) => {
        bbox.getCenter(mock.position);
        bbox.getSize(mock.scale);

        mock.updateMatrix();
        instancedMesh.setMatrixAt(instanceId++, mock.matrix);
      });
      
      output = instancedMesh;
    }

    if (renderType === 'fog') {
      const fog = new Three.Object3D();
      const geometry = new Three.BoxGeometry(1.1, 1.1, 1.1);

      VolumeToFog.convert(vdbSource, ({ bbox, data, size }) => {
        const fogData = new Three.Data3DTexture(Uint8Array.from(data), size, size, size);
        fogData.format = Three.RedFormat;
				fogData.minFilter = Three.LinearFilter;
				fogData.magFilter = Three.LinearFilter;
				fogData.unpackAlignment = 1;
				fogData.needsUpdate = true;

        const fogMaterial = new Three.ShaderMaterial({
          glslVersion: Three.GLSL3,
          uniforms: {
            base: {
              value: new Three.Color(0xffffff),
            },
            map: {
              value: fogData
            },
            threshold: { value: 0.001 },
            opacity: { value: 0.01 },
            range: { value: 0.001 },
            steps: { value: 10 },
          },
          vertexShader: volumeShaders.vertex,
          fragmentShader: volumeShaders.fragment,
          side: Three.BackSide,
          transparent: true
        });

        const fogTile = new Three.Mesh(
          geometry,
          fogMaterial
        );

        bbox.getSize(fogTile.scale);
        bbox.getCenter(fogTile.position);

        fog.add(fogTile);
      });

      output = fog;
    }

    const sampleGrid = vdbSource.grids[Object.keys(vdbSource.grids)[0]];
    const worldBbox = new Three.Box3();
    worldBbox.set(...sampleGrid.getPreciseWorldBbox());
    const worldOffset = new Three.Vector3();
    worldBbox.getSize(worldOffset).multiplyScalar(0.5);

    output.position.y += worldOffset.y;

    setOutput(output);
    setDropZoneLoadingState('Drop VDB here');
  }, [vdbSource, renderType]);

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

  return (
    <DemoWrapper>
      <Canvas flat onCreated={(gl) => {
        gl.camera.position.z = 250.0;
      }}>
        <OrbitControls
          enablePan={false}
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
          <meshBasicMaterial color={0x251B37} />
        </mesh>
        <primitive object={output} />
      </Canvas>
      <DropZone ref={dropZoneRef}>
        <div>
          {dropZoneLoadingState}
        </div>
      </DropZone>
    </DemoWrapper>
  );
};
