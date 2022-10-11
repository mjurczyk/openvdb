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

// NOTE https://www.appinf.com/download/FPIssues.pdf
export const floatingPointPrecisionLUT = {
  [doubleType]: {
    exp: 11,
    bias: (1 << (11 - 1)) - 1,
    size: doubleSize,
  },
  [floatType]: {
    exp: 8,
    bias: (1 << (8 - 1)) - 1,
    size: uint32Size,
  },
  [int32Type]: {
    size: uint32Size,
  },
  [int64Type]: {
    size: uint64Size,
  },
  [pointDataIndex32]: {
    size: uint32Size,
  },
  [pointDataIndex64]: {
    size: uint64Size,
  },
  [halfFloatType]: {
    size: uint32Size / 2,
    exp: 5,
    bias: (1 << (5 - 1)) - 1,
  },
};
