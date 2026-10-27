import { createLibraryConfigs } from '../../rollup.shared.js';

export default createLibraryConfigs({
  name: 'three-openvdb',
  external: ['three', /^three\//, 'openvdb'],
});
