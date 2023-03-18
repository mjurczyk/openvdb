import { useEffect, useRef, useState, useContext, Suspense } from "react";
import { VDBPreview } from "../utils/VDBPreview";
import { VDBUploadContext } from "../utils/VDBUpload";
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const Sandbox = () => {
  const vdbUploadContext = useContext(VDBUploadContext);
  const { vdbFile, setShowVDBUpload } = vdbUploadContext;
  const shuttleModel = useLoader(GLTFLoader, './assets/shuttle.glb');

  useEffect(() => {
    if (!vdbFile) {
      setShowVDBUpload(true);
    }

    return () => {
      setShowVDBUpload(false);
    };
  });

  useEffect(() => {
    if (vdbFile) {
      setShowVDBUpload(false);
    }
  }, [vdbFile]);

  if (!vdbFile) {
    return null;
  }

  if (vdbFile.grids.flame) {
    vdbFile.grids.temperature = vdbFile.grids.flame;
    delete vdbFile.grids.flame;
  }

  return (
    <>
      <Suspense fallback={null}>
        <group>
          <VDBPreview
            vdbSource={vdbFile}
            resolution={75}
            steps={500}
            color={0xffffff}
            absorbance={1.0}
            progressive
          />
          <primitive
            object={shuttleModel.scene}
            position={[ 10.0, 32.0, 13.5 ]}  
            rotation={[ 0.0, -Math.PI / 2.0, 0.0 ]}
            scale={0.8}
          >
            <pointLight
              color={0xffffcc}
              intensity={1.}
              position={[ 0.0, -10.0, -20.0 ]}
            />
            <pointLight
              color={0xffcccc}
              intensity={2.}
              position={[ 0.0, -10.0, 20.0 ]}
            />
          </primitive>
        </group>
      </Suspense>
    </>
  );
};
