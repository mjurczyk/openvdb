import { createLibraryConfigs } from '../../rollup.shared.js';

// NOTE No external modules. openvdb has no dependencies.
export default createLibraryConfigs({ name: 'openvdb' });
