import './debug';
import './dependencies';
import { OpenVDBReader } from './core/OpenVDBReader';

export const loadVDB = (url) =>
  new Promise((resolve, reject) => {
    fetch(url).then(async (vdb) => {
      const source = new Uint8Array(await vdb.arrayBuffer());
      const vdbReader = new OpenVDBReader();

      try {
        await vdbReader.read(source);
        resolve(vdbReader);
      } catch (error) {
        console.error({ error });
        reject('VDB could not be parsed.');
      }
    });
  });
