import { useEffect, useState } from "react";
import * as Three from 'three';
import * as OpenVDB from "../../../src/openvdb/three";
import { DebugScene } from "../utils/DebugScene";
import { VDBPreview } from "../utils/VDBPreview";
import { useMemo } from "react";
import { Detailed } from "@react-three/drei";
import { LoadingNote } from "../utils/LoadingNote";

export const LevelSetLOD = () => {
  const [vdbSource, setVdbSource] = useState(null);

  useEffect(() => {
    new OpenVDB.VDBLoader().load('./assets/bunny_cloud.vdb', (vdb) => {
      setVdbSource(vdb);
    }, null, () => {
      alert('Could not load the VDB file.');
    });
  }, []);

  const lodMesh = useMemo(() => {
    const maxLod = 6;
    const lodLevels = Array(maxLod).fill(0).map((_, i) => ([
      Math.round(Three.MathUtils.lerp(10, 80, i / maxLod)),
      Math.random() * 0x888888 + 0x888888
    ])).reverse();

    return (
      <Detailed distances={lodLevels.map((_, index) => index * 100.0)}>
        {lodLevels.map(([ level, color ]) => (
          <mesh key={level}>
            <VDBPreview
              vdbSource={vdbSource}
              renderType="levelSet"
              resolution={level}
              color={color}
            />
          </mesh>
        ))}
      </Detailed>
    );
  });

  if (!vdbSource) {
    return <LoadingNote />;
  }

  return (
    <>
      <DebugScene />
      <directionalLight position={[ 0.0, 1.0, 0.0 ]} color={0xffffff} intensity={1.} />
      {Array(10).fill(0).map((_, x) => {
        return (
          <group position={[ x * 40.0, 0.0, 0.0 ]} key={x}>
            {Array(10).fill(0).map((_, z) => {
              return (
                <group position={[ 0.0, 0.0, z * 40.0 ]} key={`${x}_${z}`}>
                  {lodMesh}
                </group>
              );
            })}
          </group>
        )
      })}
    </>
  );
};
