// NOTE Same fields and formulas as the three.js Vector3 (MIT). Three.js code can read these vectors and pass its vectors in.
export class Vector3 {
  constructor(x = 0.0, y = 0.0, z = 0.0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  }

  setScalar(scalar) {
    return this.set(scalar, scalar, scalar);
  }

  copy(v) {
    return this.set(v.x, v.y, v.z);
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  add(v) {
    return this.set(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  addScalar(scalar) {
    return this.set(this.x + scalar, this.y + scalar, this.z + scalar);
  }

  addVectors(a, b) {
    return this.set(a.x + b.x, a.y + b.y, a.z + b.z);
  }

  sub(v) {
    return this.set(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  subScalar(scalar) {
    return this.set(this.x - scalar, this.y - scalar, this.z - scalar);
  }

  subVectors(a, b) {
    return this.set(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  multiply(v) {
    return this.set(this.x * v.x, this.y * v.y, this.z * v.z);
  }

  multiplyScalar(scalar) {
    return this.set(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  divide(v) {
    return this.set(this.x / v.x, this.y / v.y, this.z / v.z);
  }

  divideScalar(scalar) {
    return this.multiplyScalar(1 / scalar);
  }

  min(v) {
    return this.set(Math.min(this.x, v.x), Math.min(this.y, v.y), Math.min(this.z, v.z));
  }

  max(v) {
    return this.set(Math.max(this.x, v.x), Math.max(this.y, v.y), Math.max(this.z, v.z));
  }

  floor() {
    return this.set(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
  }

  ceil() {
    return this.set(Math.ceil(this.x), Math.ceil(this.y), Math.ceil(this.z));
  }

  round() {
    return this.set(Math.round(this.x), Math.round(this.y), Math.round(this.z));
  }

  negate() {
    return this.set(-this.x, -this.y, -this.z);
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length() {
    return Math.sqrt(this.lengthSq());
  }

  normalize() {
    return this.divideScalar(this.length() || 1);
  }

  // NOTE Matrix elements are column-major
  applyMatrix3(m) {
    const { x, y, z } = this;
    const e = m.elements;

    return this.set(
      e[0] * x + e[3] * y + e[6] * z,
      e[1] * x + e[4] * y + e[7] * z,
      e[2] * x + e[5] * y + e[8] * z
    );
  }

  applyMatrix4(m) {
    const { x, y, z } = this;
    const e = m.elements;
    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

    return this.set(
      (e[0] * x + e[4] * y + e[8] * z + e[12]) * w,
      (e[1] * x + e[5] * y + e[9] * z + e[13]) * w,
      (e[2] * x + e[6] * y + e[10] * z + e[14]) * w
    );
  }

  fromArray(array, offset = 0) {
    return this.set(array[offset], array[offset + 1], array[offset + 2]);
  }

  toArray() {
    return [this.x, this.y, this.z];
  }
}
