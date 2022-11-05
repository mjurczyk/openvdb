import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { Canvas } from 'react-three-fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import { PropertyMatrix } from './examples/PropertyMatrix';
import { Transforms } from './examples/Transforms';
import { gui } from './Gui';
import { SpotLights } from './examples/SpotLights';
import { Bbox } from './examples/Bbox';
import { Primitives } from './examples/Primitives';
import { Lighthouse } from './examples/Lighthouse';
import packageInfo from '../../package.json';

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
  const [demo, setDemo] = useState('lighthouse');

  useEffect(() => {
    gui.controllersRecursive().forEach(controller => controller.destroy());

    gui.add({ demo }, 'demo', {
      'Lighthouse': 'lighthouse',
      'BBOX': 'bbox',
      'Primitives': 'primitives',
      'Transforms': 'transforms',
      'Spotlights': 'spotLights',
      'Property Matrix (Slow)': 'propertyMatrix',
    }).name('Example').onChange((demo) => {
      setDemo(demo);
    });
  });

  return (
    <DemoWrapper>
      <Canvas
        flat
        onCreated={(gl) => {
        gl.camera.position.z = 500.0;

        gl.camera.far = 10000.0;
        gl.camera.near = 0.01;
        gl.camera.updateProjectionMatrix();
      }}>
        {({
          'lighthouse': <Lighthouse />,
          'bbox': <Bbox />,
          'primitives': <Primitives />,
          'transforms': <Transforms />,
          'propertyMatrix': <PropertyMatrix />,
          'spotLights': <SpotLights />,
        })[demo]}
        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2.0 - 0.1}
          maxDistance={475.0}
        />
      </Canvas>
      <BottomTab>
        <div>
          <a href="https://github.com/mjurczyk/openvdb" target="_blank">
            Github mjurczyk/openvdb
          </a>
        </div>
        <div>
          <a href="https://github.com/mjurczyk/openvdb" target="_blank">
            <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/mjurczyk/openvdb?style=social" />
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
        <div style={{ flexGrow: '1', textAlign: 'right' }}>
          v{packageInfo.version}
        </div>
      </BottomTab>
      <Stats />
    </DemoWrapper>
  );
};
