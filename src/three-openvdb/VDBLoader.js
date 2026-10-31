// NOTE Three.js-style VDB Loader
import * as Three from 'three';
import { loadVDB } from 'openvdb';

class VDBLoader extends Three.Loader {
  constructor(manager) {
    super(manager);
  }

  load(url, onLoad, _onProgress_ /* NOTE Unused */, onError) {
    loadVDB(url)
      .then((vdb) => {
        onLoad(vdb);
      })
      .catch((error) => {
        if (onError) {
          onError(error);
        } else {
          console.error(error);
        }
      });
  }
}

export { VDBLoader };
