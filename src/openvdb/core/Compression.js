export class Compression {
  static tagCompression(target, version) {
    target.compression = version;

    return target;
  }

  static getCompression(target) {
    return target.compression;
  }
}
