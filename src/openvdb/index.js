import './debug';
import './dependencies';
import { VDBReader } from './core/VDBReader';

const parseVDB = (url) => new Promise((resolve) => {
  fetch(url).then(async (vdb) => {
    const source = new Uint8Array(await vdb.arrayBuffer());
    const vdbReader = new VDBReader();
    vdbReader.read(source);

    resolve(vdbReader.grids);
  });
});

window.parseVDB = parseVDB;
