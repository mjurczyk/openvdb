export class Version {
  static greater(version, min) {
    return version > min;
  }

  static greaterEq(version, min) {
    return version >= min;
  }

  static less(version, max) {
    return version < max;
  }

  static lessEq(version, max) {
    return version <= max;
  }

  static eq(version, exact) {
    return version === exact;
  }

  static between(version, min, max, includeMin, includeMax) {
    if (includeMin && includeMax) {
      return version >= min && version <= max;
    } else if (includeMin) {
      return version >= min && version < max;
    } else if (includeMax) {
      return version > min && version <= max;
    } else {
      return version > min && version < max;
    }
  }
}
