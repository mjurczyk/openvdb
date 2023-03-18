import * as OpenVDB from '../../../src/openvdb/three';

export const vdbList = {};

export const loadAndCacheVDB = async (name, file) => {
  if (!vdbList[file]) {
    const vdb = await new Promise(resolve => {
      new OpenVDB.VDBLoader().load('./assets/bunny_cloud.vdb', (vdb) => {
        resolve(vdb);  
      }, null, () => {
        alert('Could not load the VDB file.');
        console.error('Could not load the VDB file.', { name, file });
      });
    });

    vdbList[file] = {
      name,
      vdb
    };
  }

  return vdbList[file].vdb;
};
