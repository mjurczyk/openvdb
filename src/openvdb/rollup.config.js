import { createLibraryConfigs } from '../../rollup.shared.js';

// NOTE No external modules. openvdb has no dependencies.
// NOTE openvdb has third-party code (dependencies.js, math/noise.js). See THIRD_PARTY_NOTICES.
export default createLibraryConfigs({ name: 'openvdb', thirdPartyNotices: true });
