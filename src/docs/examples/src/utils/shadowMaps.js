// NOTE three.js draws all shadow maps in each frame. Here they are drawn only when a shadow light or a shadow mesh changes.
let signature = [];
let nextSignature = [];
const shadowLights = [];

const pushElements = (values, elements) => {
  for (let i = 0; i < elements.length; i++) {
    values.push(elements[i]);
  }
};

// NOTE Call before renderer.render(). It updates the world matrices, so a change shows in the same frame.
export const updateShadowMaps = (scene) => {
  scene.updateMatrixWorld();

  const values = nextSignature;

  values.length = 0;
  shadowLights.length = 0;

  scene.traverseVisible((object) => {
    if (object.isLight && object.castShadow && object.shadow) {
      const { shadow } = object;

      shadow.autoUpdate = false;
      shadowLights.push(object);

      values.push(object.id, shadow.mapSize.x, shadow.mapSize.y, shadow.bias, shadow.normalBias, shadow.radius);
      pushElements(values, object.matrixWorld.elements);
      pushElements(values, shadow.camera.projectionMatrix.elements);

      if (object.target) {
        object.target.updateMatrixWorld();
        pushElements(values, object.target.matrixWorld.elements);
      }
    } else if (object.castShadow && (object.isMesh || object.isLine || object.isPoints)) {
      values.push(object.id, object.geometry.id, object.count ?? 1);
      pushElements(values, object.matrixWorld.elements);
    }
  });

  const same = values.length === signature.length && values.every((value, index) => value === signature[index]);

  if (!same) {
    shadowLights.forEach((light) => {
      light.shadow.needsUpdate = true;
    });

    nextSignature = signature;
    signature = values;
  }
};
