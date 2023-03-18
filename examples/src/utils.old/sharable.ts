import * as Three from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

export const loaders = {
  texture: new Three.TextureLoader(),
  rgbe: new RGBELoader()
};