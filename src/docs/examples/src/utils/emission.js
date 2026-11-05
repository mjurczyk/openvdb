import * as Three from 'three';
import * as OpenVDB from 'three-openvdb';

// NOTE Emission light and lit meshes for the demos. One light lights the meshes with all emissive volumes of the scene.
export const createEmissionDemo = (scene) => {
  const params = {
    emissionLight: false,
    emissionIntensity: 1.0,
    emissionResolution: 16,
    emissionCascades: 1,
    sceneMeshes: false,
  };

  const light = new OpenVDB.FrameEmissionLight({
    intensity: params.emissionIntensity,
    resolution: params.emissionResolution,
    cascades: params.emissionCascades,
  });

  light.visible = params.emissionLight;
  scene.add(light);

  // NOTE A ground and props around the volume, in units of the box width
  const meshes = new Three.Group();
  const material = new Three.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.8 });
  // NOTE The ground shows only shadows. Elsewhere it is transparent, so the environment ground shows.
  const ground = new Three.Mesh(new Three.PlaneGeometry(8.0, 8.0), new Three.ShadowMaterial({ opacity: 0.5 }));
  const pillarGeometry = new Three.BoxGeometry(0.12, 0.5, 0.12);
  const sphereGeometry = new Three.SphereGeometry(0.15, 32, 16);

  // NOTE Pillars and spheres. A demo can move them to another group with the same transform.
  const props = new Three.Group();

  ground.rotation.x = -Math.PI / 2.0;
  meshes.add(ground, props);

  // NOTE Each sphere is between two pillars, on the pillar circle
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2.0;
    const sphereAngle = angle + Math.PI / 8.0;
    const pillar = new Three.Mesh(pillarGeometry, material);
    const sphere = new Three.Mesh(sphereGeometry, material);

    pillar.position.set(Math.cos(angle) * 0.67, 0.25, Math.sin(angle) * 0.67);
    sphere.position.set(Math.cos(sphereAngle) * 0.67, 0.15, Math.sin(sphereAngle) * 0.67);
    props.add(pillar, sphere);
  }

  meshes.visible = params.sceneMeshes;
  scene.add(meshes);

  // NOTE The meshes stand on the bottom of a box at the scene origin. groundScale makes the ground larger.
  const placeMeshes = (height, width, groundScale = 1.0) => {
    meshes.position.y = -height / 2.0;
    meshes.scale.setScalar(width);
    ground.scale.setScalar(groundScale);
  };

  const lightFields = [
    {
      id: 'emissionLight',
      name: 'Emission Light',
      defaultValue: params.emissionLight,
      onChange: (value) => {
        params.emissionLight = value;
        light.visible = value;
      },
    },
    {
      id: 'emissionIntensity',
      name: 'Light Intensity',
      defaultValue: params.emissionIntensity,
      min: 0.0,
      max: 50.0,
      onChange: (value) => {
        params.emissionIntensity = value;
        light.intensity = value;
      },
    },
    {
      id: 'emissionResolution',
      name: 'Probes',
      defaultValue: params.emissionResolution,
      options: { '8³': 8, '16³': 16, '32³': 32 },
      onChange: (value) => {
        params.emissionResolution = value;
        light.resolution = value;
      },
    },
    {
      id: 'emissionCascades',
      name: 'Cascades',
      defaultValue: params.emissionCascades,
      options: { 1: 1, 2: 2, 3: 3, 4: 4 },
      onChange: (value) => {
        params.emissionCascades = value;
        light.cascades = value;
      },
    },
  ];

  const meshesField = {
    id: 'sceneMeshes',
    name: 'Ground + Props',
    defaultValue: params.sceneMeshes,
    onChange: (value) => {
      params.sceneMeshes = value;
      meshes.visible = value;
    },
  };

  return { light, meshes, props, placeMeshes, lightFields, meshesField };
};
