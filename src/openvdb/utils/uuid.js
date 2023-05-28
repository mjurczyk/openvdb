
export const getUuid = (material = {}) => {
  return [
    'VolumeMaterial',
    material.lights,
    material.wrap3D,
    !!material.emissiveMap3D,
    !!material.baseColorMap3D,
    !!material.maskMap3D,
  ].join(',')
};
