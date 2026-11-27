export class Version {
  static greaterEq(version, min) {
    return version >= min;
  }

  static less(version, max) {
    return version < max;
  }
}
