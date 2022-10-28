import { useRef } from "react";
import { useFrame } from "react-three-fiber";

export const DebugLight = (props) => {
  const lightRef = useRef();
  const pivotRef = useRef();

  let dt = 0;

  useFrame(() => {
    dt += 0.01;

    if (!lightRef.current || !pivotRef.current) {
      return;
    }

    if (!lightRef.current.userData.originalPosition) {
      lightRef.current.userData.originalPosition = lightRef.current.position.clone();
      lightRef.current.userData.seed = Math.random();
    }

    // NOTE Linear
    // lightRef.current.position.x = lightRef.current.userData.originalPosition.x + Math.sin(lightRef.current.userData.seed + dt) * 100.0;
    // lightRef.current.position.z = lightRef.current.userData.originalPosition.z + Math.sin(lightRef.current.userData.seed - dt) * 10.0;

    // NOTE Orbit
    pivotRef.current.rotateY(0.01);
    lightRef.current.position.z = lightRef.current.userData.originalPosition.z + Math.sin(lightRef.current.userData.seed - dt) * 10.0;
  });

  return (
    <group ref={pivotRef}>
      <pointLight color={props.color} intensity={.5} {...props} ref={lightRef}>
        <mesh>
          <sphereGeometry args={[ 1.0, 32, 32]} />
          <meshBasicMaterial color={props.color} />
        </mesh>
      </pointLight>
    </group>
  );
};
