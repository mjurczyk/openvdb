import './debug';
import './dependencies';
import { DEBUG, print, assert, unsupported } from './debug';
import {
  charSize,
  uint32Size,
  uint64Size,
  doubleSize,
} from './math/memory';
import {
  Vector3
} from './math/vector';
import { BufferIterator } from './core/BufferIterator';
import { OpenVDBReader } from './core/OpenVDBReader';

const parseVDB = (url) => new Promise((resolve) => {
  fetch(url).then(async (vdb) => {
    const source = new Uint8Array(await vdb.arrayBuffer());
    const openVDBReader = new OpenVDBReader();
    openVDBReader.read(source);

    resolve(openVDBReader.grids);
  });
});

window.parseVDB = parseVDB;
