import * as Three from 'three';
import styled from 'styled-components';
import { useEffect, useState } from "react";
import { VolumeToBbox, VolumeToFog } from '../../../src/openvdb/three';
import { Html } from '@react-three/drei';

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

export const VDBPreview = (props) => {
  const { vdbSource, renderType, resolution, steps, absorbance, opacity, noise, color } = props;
  const [popUpText, setPopUpText] = useState(null);
  const [output, setOutput] = useState(new Three.Object3D());

  useEffect(() => {
    let output;

    if (!vdbSource) {
      setOutput(new Three.Object3D());
      return;
    }

    // NOTE Load proper rendering type of the VDB
    if (renderType === 'boundingBox') {
      output = new VolumeToBbox(vdbSource);
    } else {
      output = new VolumeToFog(vdbSource, null, {
        resolution: resolution,
        progressive: false,
        steps: steps,
        opacity: opacity,
        absorbance: absorbance,
        noise: noise,
        color: color
      }, () => {
        setPopUpText(null);
      }, ({ convertedVoxels, totalVoxels }) => {
        setPopUpText(`${convertedVoxels} / ${totalVoxels} voxels (${((convertedVoxels / totalVoxels) * 100.0).toFixed(0)}%)`);
      });
    }

    // NOTE Center the VDB on y-axis according to its BBOX
    const sampleGrid = vdbSource.grids[Object.keys(vdbSource.grids)[0]];
    const worldBbox = new Three.Box3();
    worldBbox.set(...sampleGrid.getPreciseWorldBbox());
    const worldOffset = new Three.Vector3();
    worldBbox.getSize(worldOffset).multiplyScalar(0.5);

    output.position.y += worldOffset.y;

    setOutput(output);

    return () => {
      if (output?.dispose) {
        output.dispose();
      }
    };
  }, [vdbSource, renderType, resolution]);

  return (
    <group position={props.position} rotation={props.rotation} scale={props.scale}>
      <primitive object={output} />
      {popUpText !== null && (
          <PopUpBox>
            <div>
              {popUpText}
            </div>
          </PopUpBox>
        )}
    </group>
  )
};
