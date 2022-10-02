import './debug';
import './dependencies';
import { OpenVDBReader } from './core/OpenVDBReader';

export const loadVDB = (url) => new Promise((resolve) => {
  fetch(url).then(async (vdb) => {
    const source = new Uint8Array(await vdb.arrayBuffer());
    const vdbReader = new OpenVDBReader();
    vdbReader.read(source);

    resolve(vdbReader);
  });
});
