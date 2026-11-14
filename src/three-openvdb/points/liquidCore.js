import * as Three from 'three';

// NOTE Liquid of a point data grid: screen-space fluid rendering (Green, GDC 2010). Shared by both backends.
// NOTE World units of the VDB are metres.

// NOTE Pure water. IOR at 20 °C. Absorption in 1/m at 650, 550 and 450 nm (Pope & Fry 1997).
export const liquidWater = {
  ior: 1.333,
  absorption: new Three.Vector3(0.34, 0.0565, 0.0092),
};

// NOTE Calm water. GGX with roughness 0 shows no highlight of punctual lights.
export const liquidRoughness = 0.05;

export const liquidMaxLights = 8;

// NOTE Liquid uses at most this many points. Above it, every n-th point is used with a larger radius.
// Splat cost then grows with the cube root of the point count, not with the count.
export const liquidMaxPoints = 1000000;

// NOTE Bilateral depth filter (Truong & Yuksel 2018, §4): world sigma = 0.7 * radius, separable, 2 iterations.
// Depth range: depth steps above 10 radii are separate surfaces (Gaussian range sigma = 10 / 3 radii).
export const liquidFilterSigma = 0.7;
export const liquidFilterDepthRange = 10.0 / 3.0;
export const liquidFilterIterations = 2;
export const liquidFilterMaxRadius = 16;

// NOTE Thickness is smooth, so it is drawn at half resolution and blurred (world sigma = 2 * radius).
export const liquidThicknessResolution = 0.5;
export const liquidThicknessSigma = 2.0;

// NOTE Opt-in distance detail (lod): point spacing on screen is at least this many pixels. Far points are
// thinned out (kept fraction 1 / scale^3) and the kept spheres grow by the scale, so the liquid volume stays the same.
export const liquidLodSpacing = 3.0;

export const liquidLightTypes = { directional: 0, point: 1, spot: 2 };

// NOTE Default radius: the smallest sphere with no gaps between points on a cubic lattice (half the cube diagonal)
export const getLiquidRadius = (spacing) => spacing * Math.sqrt(3.0) * 0.5;

// NOTE Two triangles. Each instance is the view-facing square of one sphere.
const quadCorners = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);

// NOTE Instanced spheres of the points. liquidRadius: pscale or the default radius, larger by cbrt(stride) after
// decimation. liquidColor: Cd (0 to 1), only when the grid has Cd.
export const createLiquidGeometry = ({ positions, colors, radii, count, spacing, stride }) => {
  const geometry = new Three.InstancedBufferGeometry();
  const defaultRadius = getLiquidRadius(spacing);
  const strideScale = Math.cbrt(stride);
  const radius = new Float32Array(count);

  let radiusSum = 0.0;

  for (let i = 0; i < count; i++) {
    radius[i] = radii && radii[i] > 0.0 ? radii[i] * strideScale : defaultRadius;
    radiusSum += radius[i];
  }

  geometry.setAttribute('position', new Three.Float32BufferAttribute(quadCorners, 3));
  geometry.setAttribute('liquidCenter', new Three.InstancedBufferAttribute(positions, 3));
  geometry.setAttribute('liquidRadius', new Three.InstancedBufferAttribute(radius, 1));

  // NOTE Rank of each point for distance detail: golden ratio sequence, so kept points are even in each region
  const rank = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    rank[i] = (i * 0.6180339887498949) % 1.0;
  }

  geometry.setAttribute('liquidRank', new Three.InstancedBufferAttribute(rank, 1));

  if (colors) {
    const color = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      color[i] = Math.min(Math.max(colors[i], 0.0), 1.0);
    }

    geometry.setAttribute('liquidColor', new Three.InstancedBufferAttribute(color, 3));
  }

  geometry.instanceCount = count;

  return { geometry, meanRadius: count > 0 ? radiusSum / count : defaultRadius };
};

const worldPosition = new Three.Vector3();
const worldQuaternion = new Three.Quaternion();
const worldScale = new Three.Vector3();

// NOTE Scene units for one VDB unit
export const getLiquidWorldScale = (object) => {
  object.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

  return Math.max(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));
};

// NOTE Thickness of one point: the chord through a sphere center, scaled by the point volume / sphere volume.
// The liquid edge fades out below it, so silhouettes and single drops have soft edges.
export const getLiquidEdgeThickness = (radius, spacing) =>
  (2.0 * radius * spacing ** 3) / ((4.0 / 3.0) * Math.PI * radius ** 3);

// NOTE Light values in view space. The two backends make uniforms from these objects.
// positions: (view position or direction to the light, type). colors: (color * intensity, distance).
// spots: (view direction of the spot, cos of the cone). params: (cos of the penumbra, decay, 0, 0).
export const createLiquidLightState = () => ({
  count: 0,
  positions: Array.from({ length: liquidMaxLights }, () => new Three.Vector4()),
  colors: Array.from({ length: liquidMaxLights }, () => new Three.Vector4()),
  spots: Array.from({ length: liquidMaxLights }, () => new Three.Vector4()),
  params: Array.from({ length: liquidMaxLights }, () => new Three.Vector4()),
  ambient: new Three.Color(),
  hemiSky: new Three.Color(),
  hemiGround: new Three.Color(),
  hemiUp: new Three.Vector3(0.0, 1.0, 0.0),
});

const lightPosition = new Three.Vector3();
const targetPosition = new Three.Vector3();
const lightColor = new Three.Color();
const groundColor = new Three.Color();

let warnedLightLimit = false;

// NOTE Visible lights of the scene that the camera layers see. Lights after liquidMaxLights are not used.
export const collectLiquidLights = (scene, camera, state) => {
  const viewMatrix = camera.matrixWorldInverse;

  state.count = 0;
  state.ambient.setRGB(0.0, 0.0, 0.0);
  state.hemiSky.setRGB(0.0, 0.0, 0.0);
  state.hemiGround.setRGB(0.0, 0.0, 0.0);
  state.hemiUp.set(0.0, 1.0, 0.0).transformDirection(viewMatrix);

  scene.traverseVisible((light) => {
    if (!light.isLight || !camera.layers.test(light.layers)) {
      return;
    }

    lightColor.copy(light.color).multiplyScalar(light.intensity);

    if (light.isAmbientLight) {
      state.ambient.add(lightColor);

      return;
    }

    if (light.isHemisphereLight) {
      state.hemiSky.add(lightColor);
      state.hemiGround.add(groundColor.copy(light.groundColor).multiplyScalar(light.intensity));
      state.hemiUp.setFromMatrixPosition(light.matrixWorld).transformDirection(viewMatrix);

      return;
    }

    if (!light.isDirectionalLight && !light.isPointLight && !light.isSpotLight) {
      return;
    }

    if (state.count >= liquidMaxLights) {
      if (!warnedLightLimit) {
        console.warn(`VDBLiquid: too many lights. Only ${liquidMaxLights} lights are used.`);
        warnedLightLimit = true;
      }

      return;
    }

    const index = state.count++;
    const position = state.positions[index];
    const color = state.colors[index];

    lightPosition.setFromMatrixPosition(light.matrixWorld);
    color.set(lightColor.r, lightColor.g, lightColor.b, light.distance ?? 0.0);
    state.spots[index].set(0.0, 0.0, -1.0, 1.0);
    state.params[index].set(1.0, light.decay ?? 2.0, 0.0, 0.0);

    if (light.isDirectionalLight) {
      targetPosition.setFromMatrixPosition(light.target.matrixWorld);
      lightPosition.sub(targetPosition).transformDirection(viewMatrix);
      position.set(lightPosition.x, lightPosition.y, lightPosition.z, liquidLightTypes.directional);

      return;
    }

    lightPosition.applyMatrix4(viewMatrix);

    if (light.isPointLight) {
      position.set(lightPosition.x, lightPosition.y, lightPosition.z, liquidLightTypes.point);

      return;
    }

    targetPosition.setFromMatrixPosition(light.target.matrixWorld).applyMatrix4(viewMatrix);
    targetPosition.sub(lightPosition).normalize();
    position.set(lightPosition.x, lightPosition.y, lightPosition.z, liquidLightTypes.spot);
    state.spots[index].set(targetPosition.x, targetPosition.y, targetPosition.z, Math.cos(light.angle));
    state.params[index].x = Math.cos(light.angle * (1.0 - light.penumbra));
  });

  return state;
};

// NOTE Pixels for one scene unit at view depth 1.0 (perspective), or at any depth (orthographic)
export const getLiquidPixelScale = (camera, height) => camera.projectionMatrix.elements[5] * height * 0.5;
