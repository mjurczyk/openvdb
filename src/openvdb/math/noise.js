// NOTE Ported from https://github.com/josephg/noisejs/blob/master/perlin.js (by Stefan Gustavson)

import * as Three from 'three';

class Grad {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  dot2(x, y) {
    return this.x * x + this.y * y;
  }

  dot3(x, y, z) {
    return this.x * x + this.y * y + this.z * z;
  }
}

const grad3 = [
  new Grad(1,1,0), new Grad(-1,1,0), new Grad(1,-1,0), new Grad(-1,-1,0),
  new Grad(1,0,1), new Grad(-1,0,1), new Grad(1,0,-1), new Grad(-1,0,-1),
  new Grad(0,1,1), new Grad(0,-1,1), new Grad(0,1,-1), new Grad(0,-1,-1)
];

const p = [
  151,160,137,91,90,15,
  131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
  88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,
  77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,
  135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,
  5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
  223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,
  129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,
  251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,
  49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
];

const perm = new Array(512);
const gradP = new Array(512);

// NOTE Generate noise seed
((seed) => {
  if(seed > 0 && seed < 1) {
    seed *= 65536;
  }

  seed = Math.floor(seed);
  if(seed < 256) {
    seed |= seed << 8;
  }

  for(let i = 0; i < 256; i++) {
    let v;

    if (i & 1) {
      v = p[i] ^ (seed & 255);
    } else {
      v = p[i] ^ ((seed>>8) & 255);
    }

    perm[i] = perm[i + 256] = v;
    gradP[i] = gradP[i + 256] = grad3[v % 12];
  }
})(0);

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

const F3 = 1 / 3;
const G3 = 1 / 6;

const simplex2Noise = (xin, yin) => {
  var n0, n1, n2; // Noise contributions from the three corners
  // Skew the input space to determine which simplex cell we're in
  var s = (xin+yin)*F2; // Hairy factor for 2D
  var i = Math.floor(xin+s);
  var j = Math.floor(yin+s);
  var t = (i+j)*G2;
  var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
  var y0 = yin-j+t;
  // For the 2D case, the simplex shape is an equilateral triangle.
  // Determine which simplex we are in.
  var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
  if(x0>y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
    i1=1; j1=0;
  } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
    i1=0; j1=1;
  }
  // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
  // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
  // c = (3-sqrt(3))/6
  var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
  var y1 = y0 - j1 + G2;
  var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
  var y2 = y0 - 1 + 2 * G2;
  // Work out the hashed gradient indices of the three simplex corners
  i &= 255;
  j &= 255;
  var gi0 = gradP[i+perm[j]];
  var gi1 = gradP[i+i1+perm[j+j1]];
  var gi2 = gradP[i+1+perm[j+1]];
  // Calculate the contribution from the three corners
  var t0 = 0.5 - x0*x0-y0*y0;
  if(t0<0) {
    n0 = 0;
  } else {
    t0 *= t0;
    n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
  }
  var t1 = 0.5 - x1*x1-y1*y1;
  if(t1<0) {
    n1 = 0;
  } else {
    t1 *= t1;
    n1 = t1 * t1 * gi1.dot2(x1, y1);
  }
  var t2 = 0.5 - x2*x2-y2*y2;
  if(t2<0) {
    n2 = 0;
  } else {
    t2 *= t2;
    n2 = t2 * t2 * gi2.dot2(x2, y2);
  }
  // Add contributions from each corner to get the final noise value.
  // The result is scaled to return values in the interval [-1,1].
  return 70 * (n0 + n1 + n2);
};

const simplex3Noise = (xin, yin, zin) => {
  var n0, n1, n2, n3; // Noise contributions from the four corners

  // Skew the input space to determine which simplex cell we're in
  var s = (xin+yin+zin)*F3; // Hairy factor for 2D
  var i = Math.floor(xin+s);
  var j = Math.floor(yin+s);
  var k = Math.floor(zin+s);

  var t = (i+j+k)*G3;
  var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
  var y0 = yin-j+t;
  var z0 = zin-k+t;

  // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
  // Determine which simplex we are in.
  var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
  var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
  if(x0 >= y0) {
    if(y0 >= z0)      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
    else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
    else              { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
  } else {
    if(y0 < z0)      { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
    else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
    else             { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
  }
  // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
  // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
  // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
  // c = 1/6.
  var x1 = x0 - i1 + G3; // Offsets for second corner
  var y1 = y0 - j1 + G3;
  var z1 = z0 - k1 + G3;

  var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
  var y2 = y0 - j2 + 2 * G3;
  var z2 = z0 - k2 + 2 * G3;

  var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
  var y3 = y0 - 1 + 3 * G3;
  var z3 = z0 - 1 + 3 * G3;

  // Work out the hashed gradient indices of the four simplex corners
  i &= 255;
  j &= 255;
  k &= 255;
  var gi0 = gradP[i+   perm[j+   perm[k   ]]];
  var gi1 = gradP[i+i1+perm[j+j1+perm[k+k1]]];
  var gi2 = gradP[i+i2+perm[j+j2+perm[k+k2]]];
  var gi3 = gradP[i+ 1+perm[j+ 1+perm[k+ 1]]];

  // Calculate the contribution from the four corners
  var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
  if(t0<0) {
    n0 = 0;
  } else {
    t0 *= t0;
    n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
  }
  var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
  if(t1<0) {
    n1 = 0;
  } else {
    t1 *= t1;
    n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
  }
  var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
  if(t2<0) {
    n2 = 0;
  } else {
    t2 *= t2;
    n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
  }
  var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
  if(t3<0) {
    n3 = 0;
  } else {
    t3 *= t3;
    n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
  }
  // Add contributions from each corner to get the final noise value.
  // The result is scaled to return values in the interval [-1,1].
  return 32 * (n0 + n1 + n2 + n3);
};

const fade = (t) => t*t*t*(t*(t*6-15)+10);
const lerp = (a, b, t) => (1-t)*a + t*b;

const perlin2Noise = (x, y) => {
  // Find unit grid cell containing point
  var X = Math.floor(x), Y = Math.floor(y);
  // Get relative xy coordinates of point within that cell
  x = x - X; y = y - Y;
  // Wrap the integer cells at 255 (smaller integer period can be introduced here)
  X = X & 255; Y = Y & 255;

  // Calculate noise contributions from each of the four corners
  var n00 = gradP[X+perm[Y]].dot2(x, y);
  var n01 = gradP[X+perm[Y+1]].dot2(x, y-1);
  var n10 = gradP[X+1+perm[Y]].dot2(x-1, y);
  var n11 = gradP[X+1+perm[Y+1]].dot2(x-1, y-1);

  // Compute the fade curve value for x
  var u = fade(x);

  // Interpolate the four results
  return lerp(
      lerp(n00, n10, u),
      lerp(n01, n11, u),
     fade(y));
};

const perlin3Noise = (x, y, z) => {
  // Find unit grid cell containing point
  var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
  // Get relative xyz coordinates of point within that cell
  x = x - X; y = y - Y; z = z - Z;
  // Wrap the integer cells at 255 (smaller integer period can be introduced here)
  X = X & 255; Y = Y & 255; Z = Z & 255;

  // Calculate noise contributions from each of the eight corners
  var n000 = gradP[X+  perm[Y+  perm[Z  ]]].dot3(x,   y,     z);
  var n001 = gradP[X+  perm[Y+  perm[Z+1]]].dot3(x,   y,   z-1);
  var n010 = gradP[X+  perm[Y+1+perm[Z  ]]].dot3(x,   y-1,   z);
  var n011 = gradP[X+  perm[Y+1+perm[Z+1]]].dot3(x,   y-1, z-1);
  var n100 = gradP[X+1+perm[Y+  perm[Z  ]]].dot3(x-1,   y,   z);
  var n101 = gradP[X+1+perm[Y+  perm[Z+1]]].dot3(x-1,   y, z-1);
  var n110 = gradP[X+1+perm[Y+1+perm[Z  ]]].dot3(x-1, y-1,   z);
  var n111 = gradP[X+1+perm[Y+1+perm[Z+1]]].dot3(x-1, y-1, z-1);

  // Compute the fade curve value for x, y, z
  var u = fade(x);
  var v = fade(y);
  var w = fade(z);

  // Interpolate
  return lerp(
      lerp(
        lerp(n000, n100, u),
        lerp(n001, n101, u), w),
      lerp(
        lerp(n010, n110, u),
        lerp(n011, n111, u), w),
     v);
};

// Worley noise (based on: https://github.com/Erkaman/glsl-worley/blob/master/worley3D.glsl)

class Worley {
  constructor(seed = 3000) {
      this._seedValue = seed;

      this.setSeed = this.setSeed.bind(this);
      this.noise = this.noise.bind(this);
      this.Euclidean = this.Euclidean.bind(this);
      this.Manhattan = this.Manhattan.bind(this);
  }

  static xorshift(value) {
      let x = value ^ (value >> 12);
      x = x ^ (x << 25);
      x = x ^ (x >> 27);
      return x * 2;
  }

  static hash(i, j, k) {
      return (((((2166136261 ^ i) * 16777619) ^ j) * 16777619) ^ k) * 16777619 & 0xffffffff;
  }

  static d(p1, p2) {
      return [p1.x - p2.x, p1.y - p2.y, p1.z - p2.z];
  }

  static EuclideanDistance(p1, p2) {
      return Worley.d(p1, p2).reduce((sum, x) => sum + (x * x), 0);
  }

  static ManhattanDistance(p1, p2) {
      return Worley.d(p1, p2).reduce((sum, x) => sum + Math.abs(x), 0)
  }

  static probLookup(value) {
      value = value & 0xffffffff;
      if (value < 393325350) return 1;
      if (value < 1022645910) return 2;
      if (value < 1861739990) return 3;
      if (value < 2700834071) return 4;
      if (value < 3372109335) return 5;
      if (value < 3819626178) return 6;
      if (value < 4075350088) return 7;
      if (value < 4203212043) return 8;
      return 9;
  }

  static insert(arr, value) {
      let temp;
      for (let i = arr.length - 1; i >= 0; i--) {
          if (value > arr[i]) break;
          temp = arr[i];
          arr[i] = value;
          if (i + 1 < arr.length) arr[i + 1] = temp;
      }
  }

  noise(input, distanceFunc) {
      let lastRandom,
          numberFeaturePoints,
          randomDiff = { x: 0, y: 0, z: 0 },
          featurePoint = { x: 0, y: 0, z: 0 };
      let cubeX, cubeY, cubeZ;
      let distanceArray = [9999999, 9999999, 9999999];

      for (let i = -1; i < 2; ++i)
          for (let j = -1; j < 2; ++j)
              for (let k = -1; k < 2; ++k) {
                  cubeX = Math.floor(input.x) + i;
                  cubeY = Math.floor(input.y) + j;
                  cubeZ = Math.floor(input.z) + k;
                  lastRandom = Worley.xorshift(
                      Worley.hash(
                          (cubeX + this._seedValue) & 0xffffffff,
                          (cubeY) & 0xffffffff,
                          (cubeZ) & 0xffffffff
                      )
                  );
                  numberFeaturePoints = Worley.probLookup(lastRandom);
                  for (let l = 0; l < numberFeaturePoints; ++l) {
                      lastRandom = Worley.xorshift(lastRandom);
                      randomDiff.X = lastRandom / 0x100000000;

                      lastRandom = Worley.xorshift(lastRandom);
                      randomDiff.Y = lastRandom / 0x100000000;

                      lastRandom = Worley.xorshift(lastRandom);
                      randomDiff.Z = lastRandom / 0x100000000;

                      featurePoint = {
                          x: randomDiff.X + cubeX,
                          y: randomDiff.Y + cubeY,
                          z: randomDiff.Z + cubeZ
                      };
                      Worley.insert(distanceArray, distanceFunc(input, featurePoint));
                  }
              }

      return distanceArray.map(x => x < 0 ? 0 : x > 1 ? 1 : x );
  }

  setSeed(seed = 3000) {
      this._seedValue = seed;
  }

  Euclidean(x, y, z) {
      return this.noise({ x:x, y:y, z:z }, Worley.EuclideanDistance)[0];
  }

  Manhattan(x, y, z) {
      return this.noise({ x:x, y:y, z:z }, Worley.ManhattanDistance)[0];
  }
}

// Exports

const _Worley = new Worley();
export const worley3Noise = _Worley.Euclidean;

export {
  simplex2Noise,
  simplex3Noise,
  perlin2Noise,
  perlin3Noise,
};
