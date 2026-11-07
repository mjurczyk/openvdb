import * as Three from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { camera, controls, renderer, scene } from '../main';
import { gui } from './gui';

// NOTE In transform mode the camera goes to this position and looks at the scene origin
const transformViewPosition = new Three.Vector3(-250.0, 200.0, 250.0);
const transformViewTarget = new Three.Vector3(0.0, 0.0, 0.0);
const viewMoveDuration = 1000.0;

// NOTE All modes show at the same time: scale handles inside, move arrows in the middle, rotate rings outside.
// The first gizmo in the list wins when handles overlap.
const gizmoModes = [
  { mode: 'scale', size: 0.6 },
  { mode: 'translate', size: 1.0 },
  { mode: 'rotate', size: 1.5 },
];

let target = null;
let gizmos = [];
let active = false;
// NOTE The camera position and rotation before transform mode. The camera goes back to it.
let savedView = null;
let viewMove = null;

const getController = (id) =>
  gui.controllersRecursive().find((controller) => controller.property === id);

const getButtonName = () => (active ? 'Transform Mode: On' : 'Transform Mode: Off');

// NOTE Only one gizmo shows a hovered handle: the first one in gizmoModes that has a handle under the pointer
const onPointerHover = () => {
  gizmos.forEach((gizmo, index) => {
    if (!gizmo.dragging && gizmos.slice(0, index).some((other) => other.axis !== null)) {
      gizmo.axis = null;
    }
  });
};

// NOTE All scale handles scale the VDB on all axes. The axis with the largest change gives the factor.
const applyUniformScale = (object, startScale) => {
  const factor = [
    object.scale.x / startScale.x,
    object.scale.y / startScale.y,
    object.scale.z / startScale.z,
  ].reduce((largest, each) => (Math.abs(each - 1.0) > Math.abs(largest - 1.0) ? each : largest));

  object.scale.copy(startScale).multiplyScalar(factor);
};

const removeGizmos = () => {
  renderer.domElement.removeEventListener('pointermove', onPointerHover);

  gizmos.forEach((gizmo) => {
    gizmo.detach();
    gizmo.getHelper().removeFromParent();
    gizmo.dispose();
  });

  gizmos = [];
};

const addGizmos = () => {
  gizmos = gizmoModes.map(({ mode, size }) => {
    const gizmo = new TransformControls(camera, renderer.domElement);

    gizmo.setMode(mode);
    gizmo.setSize(size);
    // NOTE No plane handles. The move and scale gizmos keep the axis and center handles.
    gizmo.showXY = false;
    gizmo.showYZ = false;
    gizmo.showXZ = false;

    // NOTE The helper lines along the drag axis are hidden. Only the colored handles show.
    Object.values(gizmo._gizmo.helper).forEach((helper) => {
      helper.traverse((child) => {
        if (child.material) {
          child.material.visible = false;
        }
      });
    });
    gizmo.setColors(0xff6666, 0x66ff66, 0x6666ff, 0xffff00);
    scene.add(gizmo.getHelper());

    if (mode === 'scale') {
      const startScale = new Three.Vector3();

      gizmo.addEventListener('mouseDown', () => startScale.copy(gizmo.object.scale));
      gizmo.addEventListener('objectChange', () => applyUniformScale(gizmo.object, startScale));
    }

    if (target) {
      gizmo.attach(target);
    }

    return gizmo;
  });

  // NOTE All gizmos get the same pointer events. A drag on one gizmo stops the others until the pointer is up.
  gizmos.forEach((gizmo) => {
    gizmo.addEventListener('mouseDown', () => {
      gizmos.filter((other) => other !== gizmo).forEach((other) => (other.enabled = false));
    });
    gizmo.addEventListener('mouseUp', () => {
      gizmos.forEach((other) => (other.enabled = true));
    });
  });

  // NOTE Added after the gizmo listeners, so it runs after their hover tests
  renderer.domElement.addEventListener('pointermove', onPointerHover);
};

const moveView = (position, quaternion, onDone) => {
  viewMove = {
    startTime: performance.now(),
    fromPosition: camera.position.clone(),
    fromQuaternion: camera.quaternion.clone(),
    toPosition: position,
    toQuaternion: quaternion,
    onDone,
  };
};

const enableTransformMode = () => {
  active = true;
  controls.enabled = false;

  // NOTE A new enable during the move back keeps the first saved view
  savedView = savedView || { position: camera.position.clone(), quaternion: camera.quaternion.clone() };

  addGizmos();

  const lookAt = new Three.Matrix4().lookAt(transformViewPosition, transformViewTarget, camera.up);

  moveView(transformViewPosition.clone(), new Three.Quaternion().setFromRotationMatrix(lookAt));
};

const disableTransformMode = () => {
  active = false;

  removeGizmos();

  // NOTE The orbit controls start again when the camera is back
  moveView(savedView.position, savedView.quaternion, () => {
    savedView = null;
    controls.enabled = true;
  });
};

// NOTE Called in each frame. Moves the camera with ease in and ease out.
export const updateTransformMode = () => {
  if (!viewMove) {
    return;
  }

  const progress = Math.min((performance.now() - viewMove.startTime) / viewMoveDuration, 1.0);
  const t = Three.MathUtils.smootherstep(progress, 0.0, 1.0);

  camera.position.lerpVectors(viewMove.fromPosition, viewMove.toPosition, t);
  camera.quaternion.slerpQuaternions(viewMove.fromQuaternion, viewMove.toQuaternion, t);

  if (progress === 1.0) {
    const { onDone } = viewMove;

    viewMove = null;
    onDone?.();
  }
};

// NOTE The gizmo moves this object. Null removes the gizmo, transform mode stays on.
export const setTransformTarget = (object) => {
  target = object;

  gizmos.forEach((gizmo) => (object ? gizmo.attach(object) : gizmo.detach()));
};

// NOTE A demo change stops transform mode at once. The camera goes back without a move.
export const resetTransformMode = () => {
  removeGizmos();

  if (savedView) {
    camera.position.copy(savedView.position);
    camera.quaternion.copy(savedView.quaternion);
  }

  active = false;
  target = null;
  savedView = null;
  viewMove = null;
  controls.enabled = true;
};

// NOTE The Transform folder of the Scene folder. Transform mode is enabled only when the demo can use it.
export const createTransformFolder = ({ upAxis, onUpAxisChange, enabled = false }) => ({
  folder: 'Transform',
  closed: true,
  children: [
    {
      id: 'upAxis',
      name: 'Up Axis',
      defaultValue: upAxis,
      options: {
        Y: 'y',
        Z: 'z',
      },
      onChange: onUpAxisChange,
    },
    {
      id: 'transformMode',
      name: getButtonName(),
      disabled: !enabled,
      onClick: () => {
        if (active) {
          disableTransformMode();
        } else {
          enableTransformMode();
        }

        getController('transformMode')?.name(getButtonName());
      },
    },
  ],
});
