// NOTE Three.js-style VDB Loader
import * as Three from 'three';
import { loadVDB } from '../index';

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
        onError(error);
      });
  }
}

export { VDBLoader };
