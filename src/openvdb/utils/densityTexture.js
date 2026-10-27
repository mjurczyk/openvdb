import * as Three from 'three';

export const textureTypes = {
  uint8: 'uint8',
  half: 'half',
  float: 'float',
};

const textureTypeMap = {
  [textureTypes.uint8]: Three.UnsignedByteType,
  [textureTypes.half]: Three.HalfFloatType,
  [textureTypes.float]: Three.FloatType,
};

// NOTE Uint8 textures store density * 255. Half and float textures store density.
export const getTextureScale = (textureType) =>
  textureType === textureTypes.half || textureType === textureTypes.float ? 1.0 : 255.0;

export const createTextureData = (textureType, count) => {
  if (textureType === textureTypes.half) {
    return new Uint16Array(count);
  }

  if (textureType === textureTypes.float) {
    return new Float32Array(count);
  }

  return new Uint8Array(count);
};

export const readTexel = (data, index) =>
  data instanceof Uint16Array ? Three.DataUtils.fromHalfFloat(data[index]) : data[index];

export const writeTexel = (data, index, value) => {
  data[index] = data instanceof Uint16Array ? Three.DataUtils.toHalfFloat(value) : value;
};

export const createScalarTexture3D = (data, resolution, textureType) => {
  const texture3D = new Three.Data3DTexture(data, resolution, resolution, resolution);
  texture3D.format = Three.RedFormat;
  texture3D.type = textureTypeMap[textureType] || Three.UnsignedByteType;
  texture3D.minFilter = Three.LinearFilter;
  texture3D.magFilter = Three.LinearFilter;
  texture3D.unpackAlignment = 1;
  texture3D.needsUpdate = true;

  return texture3D;
};
