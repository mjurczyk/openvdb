import { Html } from "@react-three/drei";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { loadVDB } from "../../../src/openvdb";
import { Bunny } from "../utils/Bunny";
import { DebugLight } from "../utils/DebugLight";

const GroupLabel = styled(Html)`
  & > div {
    display: inline-block;
    padding: 10px 15px;
    border-radius: 4px;
    background-color: #372948;
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    white-space: nowrap;
    transform: translateX(-100%) translateY(-50%);
    user-select: none;
    pointer-events: none;
  }
`;

export const PropertyMatrix = () => {
  const [vdbSource, setVdbSource] = useState(null);

  useEffect(() => {
    loadVDB(`./assets/bunny_cloud.vdb`).then(vdb => {
      setVdbSource(vdb);
    }).catch(() => {
      alert('Could not load the VDB file.');
    });
  }, []);

  if (!vdbSource) {
    return null;
  }

  const bunnyArray = {
    'Resolution': [
      { resolution: 10 },
      { resolution: 50 },
      { resolution: 100 },
      { resolution: 200 },
    ],
    'Steps': [
      { steps: 10 },
      { steps: 50 },
      { steps: 100 },
      { steps: 200 },
    ],
    'Noise (CPU)': [
      { noise: 10 },
      { noise: 50 },
      { noise: 100 },
      { noise: 200 },
    ],
    'Absorbance': [
      { absorbance: 0.01 },
      { absorbance: 0.25 },
      { absorbance: 0.5 },
      { absorbance: 1.0 },
    ],
    'Opacity': [
      { opacity: 0.1 },
      { opacity: 0.25 },
      { opacity: 0.5 },
      { opacity: 1.0 },
    ],
    'Albedo': [
      { color: 0xff0000 },
      { color: 0x00ff00 },
      { color: 0x0000ff },
      { color: 0xff00ff },
    ]
  };

  return (
    <>
      <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xffffff} intensity={1.} />
      {Object.entries(bunnyArray).map(([ groupId, presets ], groupIndex) => (
        <group key={groupId} position={[ -90.0, groupIndex * 60.0, 0.0 ]}>
          <GroupLabel position={[ -40.0, 40.0, 0.0 ]}>
            <div>
              {groupId}
            </div>
          </GroupLabel>
          <DebugLight color={0xff00ff} position={[ 90.0, 40.0, 0.0 ]} movementDirection="linear" />
          {presets.map((preset, presetIndex) => (
            <Bunny key={`group_${groupId}_${presetIndex}`} vdbSource={vdbSource} color={0xffffff} position={[ presetIndex * 60.0, 0.0, 0.0 ]} resolution={100} {...preset} />
          ))}
        </group>
      ))}
    </>
  );
};