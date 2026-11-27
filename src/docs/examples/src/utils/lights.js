import * as Three from 'three';
import { setEnvironmentLights } from './resources';

// NOTE The Lights field shows one light setup at a time. environment: the lights of the environment map (utils/resources.js)
const createLightSetupField = (scene, options, lightSetups, lights) => ({
  id: 'lightSetup',
  name: 'Lights',
  defaultValue: 'environment',
  options,
  onChange: (value) => {
    const visibleLights = lightSetups[value];

    setEnvironmentLights(scene, value === 'environment');

    lights.forEach((light) => {
      light.visible = visibleLights.includes(light);
    });
  },
});

const createSunAndHemisphere = (scene) => {
  const sun = new Three.DirectionalLight(0xffffff, 1.0);
  sun.position.set(100.0, 200.0, 100.0);
  scene.add(sun);

  const hemiLight = new Three.HemisphereLight(0x88aaff, 0x443322, 0.5);
  scene.add(hemiLight);

  return { sun, hemiLight };
};

// NOTE Sun and hemisphere light, with a Lights field: Environment or Sun + Hemisphere
export const createSunHemiLights = (scene) => {
  const { sun, hemiLight } = createSunAndHemisphere(scene);

  const lightSetupField = createLightSetupField(
    scene,
    {
      Environment: 'environment',
      'Sun + Hemisphere': 'sunHemi',
    },
    { environment: [], sunHemi: [sun, hemiLight] },
    [sun, hemiLight],
  );

  return { lightSetupField };
};

// NOTE Light rig of the volume demos: sun, hemisphere, ambient, point and spot lights. Spheres show the light positions.
export const createLightRig = (scene) => {
  const lightHelpers = [];
  let animateLights = true;

  const addLightHelper = (light, radius = 1.0) => {
    const helper = new Three.Mesh(
      new Three.SphereGeometry(radius, 16, 16),
      new Three.MeshBasicMaterial({ color: light.color }),
    );

    light.add(helper);
    lightHelpers.push(helper);
  };

  const addPivotLight = (light, x, y, z) => {
    const pivot = new Three.Group();

    light.position.set(x, y, z);
    addLightHelper(light);
    pivot.add(light);
    scene.add(pivot);

    return pivot;
  };

  const { sun, hemiLight } = createSunAndHemisphere(scene);
  addLightHelper(sun, 3.0);

  const ambientLight = new Three.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const orbitPointLight = new Three.PointLight(0xff00ff, 1.0);
  const topPointLight = new Three.PointLight(0xff00ff, 1.0);
  const insidePointLight = new Three.PointLight(0xff00ff, 1.0);
  const orbitPointPivot = addPivotLight(orbitPointLight, 50.0, 80.0, 0.0);
  addPivotLight(topPointLight, 0.0, 80.0, 0.0);
  addPivotLight(insidePointLight, 0.0, -10.0, 0.0);

  const orbitSpotLight = new Three.SpotLight(0xff00ff, 1.0, 0.0, 0.2, 0.6);
  const topSpotLight = new Three.SpotLight(0xff00ff, 1.0, 0.0, 0.2, 0.6);
  const orbitSpotPivot = addPivotLight(orbitSpotLight, 50.0, 80.0, 0.0);
  addPivotLight(topSpotLight, 0.0, 80.0, 0.0);

  const allLights = [
    sun,
    hemiLight,
    ambientLight,
    orbitPointLight,
    topPointLight,
    orbitSpotLight,
    topSpotLight,
  ];

  // NOTE The sun and the point and spot lights. Light Intensity sets them, Light Color sets all but the sun.
  const coloredLights = [
    sun,
    orbitPointLight,
    topPointLight,
    insidePointLight,
    orbitSpotLight,
    topSpotLight,
  ];

  const lightInterval = setInterval(() => {
    if (animateLights) {
      orbitPointPivot.rotateX(0.005);
      orbitSpotPivot.rotateY(0.005);
    }
  }, 1000 / 60);

  const lightFields = [
    createLightSetupField(
      scene,
      {
        Environment: 'environment',
        'Sun + Hemisphere': 'sunHemi',
        Directional: 'dir',
        Hemisphere: 'hemi',
        'Point Lights': 'point',
        'Point Light Inside': 'pointInside',
        'Spot Lights': 'spot',
        Ambient: 'ambient',
        All: 'all',
        None: 'none',
      },
      {
        environment: [],
        sunHemi: [sun, hemiLight],
        dir: [sun],
        hemi: [hemiLight],
        point: [orbitPointLight, topPointLight],
        pointInside: [insidePointLight],
        spot: [orbitSpotLight, topSpotLight],
        ambient: [ambientLight],
        all: allLights,
        none: [],
      },
      [...allLights, insidePointLight],
    ),
    {
      id: 'lightColor',
      name: 'Light Color',
      defaultValue: '#ff00ff',
      onChange: (value) => {
        coloredLights
          .filter((light) => light !== sun)
          .forEach((light) => light.color.set(value));
        lightHelpers.forEach((helper) => helper.material.color.copy(helper.parent.color));
      },
    },
    {
      id: 'lightIntensity',
      name: 'Light Intensity',
      defaultValue: 1.0,
      min: 0.0,
      max: 5.0,
      onChange: (value) => {
        // NOTE Point and spot lights have decay 2. Distance squared keeps the volumes lit.
        coloredLights.forEach((light) => {
          light.intensity = light.isDirectionalLight
            ? value
            : value * light.position.lengthSq();
        });
      },
    },
    {
      id: 'hemiIntensity',
      name: 'Hemisphere Intensity',
      defaultValue: hemiLight.intensity,
      min: 0.0,
      max: 5.0,
      onChange: (value) => {
        hemiLight.intensity = value;
      },
    },
    {
      id: 'ambientIntensity',
      name: 'Ambient Intensity',
      defaultValue: ambientLight.intensity,
      min: 0.0,
      max: 5.0,
      onChange: (value) => {
        ambientLight.intensity = value;
      },
    },
  ];

  // NOTE The point and spot light orbits. They move when the field is on.
  const animateLightsField = {
    id: 'animateLights',
    name: 'Animate Lights',
    defaultValue: animateLights,
    onChange: (value) => {
      animateLights = value;
    },
  };

  return {
    sun,
    coloredLights,
    lightFields,
    animateLightsField,
    dispose: () => clearInterval(lightInterval),
  };
};
