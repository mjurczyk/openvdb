import { createLibraryConfigs } from '../../rollup.shared.js';

export default createLibraryConfigs({
  name: 'three-openvdb',
  external: ['three', /^three\//, 'openvdb'],
  // NOTE webgl is the WebGLRenderer entry point (three-openvdb/webgl)
  entries: ['index', 'webgl'],
});
