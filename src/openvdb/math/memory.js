export const charSize = 1;
export const boolSize = 1;
export const uint32Size = 4;
export const uint64Size = 8;
export const uint128Size = 8;
export const floatSize = uint32Size;
export const doubleSize = uint64Size;

export const stringType = 'string';
export const int32Type = 'int32';
export const int64Type = 'int64';
export const boolType = 'bool';
export const halfFloatType = 'half';
export const floatType = 'float';
export const doubleType = 'double';
export const vec3iType = 'vec3i';
export const vec3sType = 'vec3s';
export const vec3dType = 'vec3d';
export const pointDataIndex32 = 'ptdataidx32';
export const pointDataIndex64 = 'ptdataidx64';
export const vec3hType = 'vec3h';

export const valueTypeSizeMap = {
  [halfFloatType]: 2,
  [floatType]: floatSize,
  [doubleType]: doubleSize,
  [int32Type]: uint32Size,
  [int64Type]: uint64Size,
  [vec3hType]: 3 * 2,
  [vec3sType]: 3 * floatSize,
  [vec3iType]: 3 * uint32Size,
  [vec3dType]: 3 * doubleSize,
};

// NOTE Real value types that "_HalfFloat" grids save as half
export const halfValueTypeMap = {
  [floatType]: halfFloatType,
  [doubleType]: halfFloatType,
  [vec3sType]: vec3hType,
  [vec3dType]: vec3hType,
};

const valueBufferMap = {
  [floatType]: Float32Array,
  [doubleType]: Float64Array,
  [int32Type]: Int32Array,
  [int64Type]: Float64Array,
};

export const createValueBuffer = (valueType, count) =>
  new (valueBufferMap[valueType] || Array)(count);
