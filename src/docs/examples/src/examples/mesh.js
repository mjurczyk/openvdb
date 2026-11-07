import * as Three from 'three';
import * as OpenVDB from 'three-openvdb';
import { gui, setGuiFields } from '../utils/gui';
import { loaders, setEnvironmentLights } from '../utils/resources';
import { setLoading } from '../utils/loading';
import { createTransformFolder } from '../utils/transform';

// NOTE Longest side of the mesh and of the volume in scene units
const displaySize = 100.0;

// NOTE The mesh is on the left, the volume is on the right
const displaySpacing = displaySize * 1.25;

const models = {
  car: './assets/car.glb',
  airbus: './assets/airbus.glb',
  shuttle: './assets/shuttle.glb',
  lighthouse: './assets/lighthouse.glb',
  damaged_helmet: './assets/damaged_helmet.glb',
};

const loadModel = (id) =>
  new Promise((resolve, reject) => {
    loaders.gltf.load(models[id], ({ scene: model }) => resolve(model), null, reject);
  });

// NOTE Noise cycles across the volume box
const edgeNoiseFrequency = 10.0;

// NOTE Demo only. MeshVolume gives 0 or 1, so edges show voxel steps.
// Noise moves each sample, and random samples in each voxel give values between 0 and 1.
class SoftMeshVolume extends OpenVDB.MeshVolume {
  sample = new Three.Vector3();

  constructor(mesh, { resolution, noise, samples }) {
    super(mesh);

    this.voxelSize = 1.0 / resolution;
    this.noise = noise;
    this.samples = samples;
  }

  getValue(position) {
    const { sample, voxelSize } = this;
    const x = position.x * edgeNoiseFrequency;
    const y = position.y * edgeNoiseFrequency;
    const z = position.z * edgeNoiseFrequency;

    // NOTE Offsets keep the three noise channels different
    const offsetX = OpenVDB.simplex3Noise(x, y, z) * this.noise * voxelSize;
    const offsetY = OpenVDB.simplex3Noise(x + 31.7, y, z) * this.noise * voxelSize;
    const offsetZ = OpenVDB.simplex3Noise(x, y + 47.3, z) * this.noise * voxelSize;

    const jitter = this.samples > 1 ? voxelSize : 0.0;
    let value = 0.0;

    for (let i = 0; i < this.samples; i++) {
      sample.set(
        position.x + offsetX + (Math.random() - 0.5) * jitter,
        position.y + offsetY + (Math.random() - 0.5) * jitter,
        position.z + offsetZ + (Math.random() - 0.5) * jitter,
      );

      value += super.getValue(sample);
    }

    return value / this.samples;
  }
}

const getController = (id) =>
  gui.controllersRecursive().find((controller) => controller.property === id);

export const exampleMesh = ({ scene }) => {
  const params = {
    model: 'damaged_helmet',
    resolution: 100,
    edgeNoise: 4.0,
    edgeSamples: 1,
    showMesh: true,
    upAxis: 'y',
  };

  let entry = null;
  let buildId = 0;
  // NOTE The GUI calls onChange with default values. Build one time after that.
  let ready = false;

  const sun = new Three.DirectionalLight(0xffffff, 1.0);
  sun.position.set(100.0, 200.0, 100.0);
  scene.add(sun);
  const hemiLight = new Three.HemisphereLight(0x88aaff, 0x443322, 0.5);
  scene.add(hemiLight);

  const setStatus = (text) => {
    getController('status')?.setValue(text);
  };

  // NOTE Z-up turns each half -90 degrees on X around its center
  const applyUpAxis = () => {
    entry?.pivot.children.forEach((slot) => {
      slot.rotation.x = params.upAxis === 'z' ? -Math.PI / 2.0 : 0.0;
    });
  };

  const removeVolume = () => {
    if (!entry) {
      return;
    }

    entry.volume?.dispose();
    scene.remove(entry.pivot);
    entry = null;
  };

  const rebuild = () => {
    const currentBuildId = ++buildId;
    // NOTE A demo change clears the scene. Then old callbacks must not change the GUI of the next demo.
    const isCurrent = () => currentBuildId === buildId && scene.children.includes(entry?.pivot);
    // NOTE A newer build shows its own loading indicator
    const stopLoading = () => {
      if (currentBuildId === buildId) {
        setLoading('mesh', false);
      }
    };

    removeVolume();

    entry = { pivot: new Three.Group(), volume: null };
    scene.add(entry.pivot);

    setLoading('mesh', true);
    setStatus('Loading...');

    loadModel(params.model)
      .then((model) => {
        if (!isCurrent()) {
          stopLoading();
          return;
        }

        const startTime = performance.now();
        const meshVolume = new SoftMeshVolume(model, {
          resolution: params.resolution,
          noise: params.edgeNoise,
          samples: params.edgeSamples,
        });
        const bvhTime = Math.round(performance.now() - startTime);

        // NOTE MeshVolume uses the model without its root transform. The two halves use the same frame.
        const modelBox = new Three.Box3().setFromObject(model);
        const modelSize = modelBox.getSize(new Three.Vector3());
        const scale = displaySize / Math.max(modelSize.x, modelSize.y, modelSize.z);
        const offset = modelBox.getCenter(new Three.Vector3()).multiplyScalar(-scale);

        const meshHalf = new Three.Group();
        meshHalf.scale.setScalar(scale);
        meshHalf.position.copy(offset);
        meshHalf.visible = params.showMesh;
        meshHalf.add(model);

        // NOTE The volume box is the MeshVolume sampler box: size and center in model space
        const volume = new OpenVDB.FrameVolume(
          meshVolume,
          { resolution: params.resolution, progressive: true, extinction: 350.0 },
          () => {
            stopLoading();

            if (!isCurrent()) {
              return;
            }

            const convertTime = Math.round(performance.now() - startTime);

            setStatus(`BVH: ${bvhTime} ms, volume: ${convertTime} ms`);
          },
          ({ convertedVoxels, totalVoxels }) => {
            if (!isCurrent()) {
              return;
            }

            setStatus(`Converting: ${Math.round((convertedVoxels / totalVoxels) * 100.0)}%`);
          },
        );
        volume.scale.copy(meshVolume.size);
        volume.position.copy(meshVolume.center);

        const volumeHalf = new Three.Group();
        volumeHalf.scale.setScalar(scale);
        volumeHalf.position.copy(offset);
        volumeHalf.add(volume);

        entry.volume = volume;
        entry.meshHalf = meshHalf;

        // NOTE Each half has a slot at its center. The up axis turns the slots.
        const meshSlot = new Three.Group();
        const volumeSlot = new Three.Group();

        meshSlot.position.x = -displaySpacing / 2.0;
        volumeSlot.position.x = displaySpacing / 2.0;
        meshSlot.add(meshHalf);
        volumeSlot.add(volumeHalf);
        entry.pivot.add(meshSlot, volumeSlot);
        applyUpAxis();
      })
      .catch((error) => {
        stopLoading();

        if (!isCurrent()) {
          return;
        }

        console.error('MeshVolume', { error });
        setStatus('Could not load the model.');
      });
  };

  setGuiFields([
    {
      folder: 'Mesh Volume',
      children: [
        {
          id: 'model',
          name: 'Model',
          defaultValue: params.model,
          options: {
            'Damaged Helmet': 'damaged_helmet',
            Car: 'car',
            Airbus: 'airbus',
            Shuttle: 'shuttle',
            Lighthouse: 'lighthouse',
          },
          onChange: (value) => {
            params.model = value;

            if (ready) {
              rebuild();
            }
          },
        },
        {
          id: 'resolution',
          name: 'Resolution',
          defaultValue: params.resolution,
          options: { 32: 32, 64: 64, 100: 100, 128: 128 },
          onChange: (value) => {
            params.resolution = value;

            if (ready) {
              rebuild();
            }
          },
        },
        {
          id: 'edgeNoise',
          name: 'Edge Noise (voxels)',
          defaultValue: params.edgeNoise,
          options: { 0: 0.0, 1: 1.0, 2: 2.0, 4: 4.0 },
          onChange: (value) => {
            params.edgeNoise = value;

            if (ready) {
              rebuild();
            }
          },
        },
        {
          id: 'edgeSamples',
          name: 'Edge Samples',
          defaultValue: params.edgeSamples,
          options: { 1: 1, 4: 4, 8: 8 },
          onChange: (value) => {
            params.edgeSamples = value;

            if (ready) {
              rebuild();
            }
          },
        },
        {
          id: 'showMesh',
          name: 'Show Mesh',
          defaultValue: params.showMesh,
          onChange: (value) => {
            params.showMesh = value;

            if (entry?.meshHalf) {
              entry.meshHalf.visible = value;
            }
          },
        },
        {
          id: 'status',
          name: 'Status',
          defaultValue: '',
        },
      ],
    },
    {
      folder: 'Scene',
      children: [
        createTransformFolder({
          upAxis: params.upAxis,
          onUpAxisChange: (value) => {
            params.upAxis = value;

            applyUpAxis();
          },
        }),
        {
          id: 'lightSetup',
          name: 'Lights',
          defaultValue: 'environment',
          // NOTE environment: the lights of the environment map (utils/resources.js)
          options: {
            Environment: 'environment',
            'Sun + Hemisphere': 'sunHemi',
          },
          onChange: (value) => {
            setEnvironmentLights(scene, value === 'environment');
            sun.visible = value === 'sunHemi';
            hemiLight.visible = value === 'sunHemi';
          },
        },
      ],
    },
  ]);

  getController('status')?.disable();

  ready = true;
  rebuild();
};
