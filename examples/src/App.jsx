import * as Three from 'three';
import styled from 'styled-components';
import { useEffect, useRef, useState, useContext } from 'react';
import { Canvas } from 'react-three-fiber';
import { OrbitControls, Stats, useContextBridge } from '@react-three/drei';
import { PropertyMatrix } from './examples/PropertyMatrix';
import { Transforms } from './examples/Transforms';
import { gui } from './Gui';
import { SpotLights } from './examples/SpotLights';
import { Bbox } from './examples/Bbox';
import { Primitives } from './examples/Primitives';
import { Lighthouse } from './examples/Lighthouse';
import packageInfo from '../../package.json';
import { LevelSetMesh } from './examples/LevelSetMesh';
import { LevelSetLOD } from './examples/LevelSetLOD';
import { Sandbox } from './examples/Sandbox';
import { SimpleDropzone } from 'simple-dropzone';
import { VDBUploadContext } from './utils/VDBUpload';
import { loadVDB } from '../../src/openvdb';
import { Temperature } from './examples/Temperature';
import { Clouds } from './examples/Clouds';

const DropZone = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 240px;
  height: 60px;
  background-color: #1f1f1f;
  border: solid #3f3f3f 1px;
  transform: translateX(-50%) translateY(-50%);
  z-index: 10000;

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

const DemoWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #251B37;
  color: #ffffff;
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

const BottomTab = styled.div`
  position: absolute;
  display: inline-flex;
  bottom: 0px;
  left: 0px;
  width: calc(100vw - 8px);
  padding: 6px 4px 2px 4px;
  font-size: 14px;
  color: #ffffff;
  background-color: #1f1f1f;
  z-index: 3;
  border-top: solid 1px #3f3f3f;

  a {
    color: #ffffff;
    text-decoration: none;
    opacity: 0.8;

    &:hover {
      opacity: 1.0;
    }
  }

  & > * {
    margin: 0px 8px;
  }
`;

export const App = () => {
  const ContextBridge = useContextBridge(VDBUploadContext);
  const vdbUploadContext = useContext(VDBUploadContext);
  const [demo, setDemo] = useState('shuttle');
  const dropZoneRef = useRef();
  const [dropZoneLoadingState, setDropZoneLoadingState] = useState('Drop zipped VDB here');

  useEffect(() => {
    gui.controllersRecursive().forEach(controller => controller.destroy());

    gui.add({ demo }, 'demo', {
      '(0.1.4) Shuttle': 'shuttle',
      '(0.1.3) Lighthouse': 'lighthouse',
      'BBOX': 'bbox',
      'Primitives': 'primitives',
      'Clouds': 'clouds',
      'Transforms': 'transforms',
      'Spotlights': 'spotLights',
      'Temperature': 'temperature',
      'Level Set Mesh': 'levelSetMesh',
      'Level Set LOD': 'levelSetLOD',
      'Property Matrix': 'propertyMatrix',
    }).name('Example').onChange((demo) => {
      setDemo(demo);
    });
  });

  useEffect(() => {
    if (!dropZoneRef.current) {
      return;
    }

    const dropzone = new SimpleDropzone(dropZoneRef.current, document.createElement('input'));

    dropzone.on('drop', ({ files }) => {
      let file = [...files];

      const fileSource = URL.createObjectURL(file[0][1]);

      setDropZoneLoadingState('Reading VDB');

      loadVDB(fileSource).then(vdb => {
        setDropZoneLoadingState('Drop zipped VDB here');

        console.info('loaded', fileSource);
        vdbUploadContext.setVDBFile(vdb);
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
      <DropZone ref={dropZoneRef} style={{ display: vdbUploadContext.showVDBUpload ? '' : 'none' }}>
        <div>
          {dropZoneLoadingState}
        </div>
      </DropZone>
      <ContextBridge>
        <Canvas
          flat
          dpr={1.0}
          onCreated={(gl) => {
            gl.camera.position.z = 500.0;

            gl.camera.far = 10000.0;
            gl.camera.near = 0.01;
            gl.camera.updateProjectionMatrix();

            gl.scene.background = new Three.Color(0x598eff);

            // loaders.rgbe.load('./assets/blue-sky-2-HDR.hdr', hdri => {
            //   hdri.mapping = Three.EquirectangularReflectionMapping;

            //   gl.scene.environment = hdri;
            // });

            // loaders.texture.load('./assets/blue-sky-2-SD.jpg', texture => {
            //   texture.encoding = Three.sRGBEncoding;
            //   texture.mapping = Three.EquirectangularRefractionMapping;

            //   gl.scene.background = texture;
            // });
          }}
        >
          {({
            'shuttle': <Sandbox />,
            'lighthouse': <Lighthouse />,
            'bbox': <Bbox />,
            'primitives': <Primitives />,
            'clouds': <Clouds />,
            'transforms': <Transforms />,
            'temperature': <Temperature />,
            'propertyMatrix': <PropertyMatrix />,
            'spotLights': <SpotLights />,
            'levelSetMesh': <LevelSetMesh />,
            'levelSetLOD': <LevelSetLOD />,
          })[demo]}
          <OrbitControls />
        </Canvas>
      </ContextBridge>
      <BottomTab>
        <div>
          <a href="https://github.com/mjurczyk/openvdb" target="_blank">
            Github mjurczyk/openvdb
          </a>
        </div>
        <div>
          <a href="https://github.com/mjurczyk/openvdb#usage" target="_blank">
            Documentation
          </a>
        </div>
        <div>
          <a href="https://www.openvdb.org/" target="_blank">
            OpenVDB
          </a>
        </div>
        <div>
          <a href="https://github.com/mjurczyk/openvdb" target="_blank">
            <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/mjurczyk/openvdb?style=social" />
          </a>
        </div>
        <div style={{ flexGrow: '1', textAlign: 'right' }}>
          v{packageInfo.version}
        </div>
      </BottomTab>
      <Stats />
    </DemoWrapper>
  );
};
