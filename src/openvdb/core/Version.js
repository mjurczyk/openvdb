
export class Version {
  static tagVersion(target, version) {
    target.version = version;

    return target;
  }

  static getVersion(target) {
    return target.version;
  }

  static greater(target, min) {
    return target.version > min;
  }

  static greaterEq(target, min) {
    return target.version >= min;
  }

  static less(target, max) {
    return target.version < max;
  }

  static lessEq(target, max) {
    return target.version <= max;
  }

  static eq(target, exact) {
    return target.version === exact;
  }

  static between(target, min, max, includeMin, includeMax) {
    if (includeMin && includeMax) {
      return target.version >= min && target <= max;
    } else if (includeMin) {
      return target.version >= min && target < max;
    } else if (includeMax) {
      return target.version > min && target <= max;
    } else {
      return target.version > min && target < max;
    }
  }
}
