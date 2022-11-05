export const DebugScene = () => (
  <>
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
  </>
);
