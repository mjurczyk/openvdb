import { createLibraryConfigs } from '../../rollup.shared.js';

export default createLibraryConfigs({
  name: 'three-wvdb-loader',
  external: ['three', 'openvdb'],
});
