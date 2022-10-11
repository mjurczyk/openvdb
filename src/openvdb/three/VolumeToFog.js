import * as Three from 'three';
import { Bbox } from '../math/bbox';
import { Vector3 } from '../math/vector';

const sampleColors = [0xff0000, 0x00ff00, 0x0000ff];

export class VolumeToFog extends Three.Group {
  processes = [];

  constructor(
    vdb,
    { resolution, progressive, threshold, opacity, range, steps },
    onConverted,
    onProgress
  ) {
    super();

    this.frustumCulled = false;

    const grids = Object.values(vdb.grids);

    let convertedGrids = 0;
    let convertedVoxels = 0;

    const totalGrids = grids.length;
    const totalVoxels = totalGrids * Math.pow(resolution, 3);

    grids.forEach((grid, gridIndex) => {
      const data = new Uint8Array(Math.pow(resolution, 3));
      const data3dTexture = new Three.Data3DTexture(data, resolution, resolution, resolution);
      data3dTexture.format = Three.RedFormat;
      data3dTexture.minFilter = Three.LinearFilter;
      data3dTexture.magFilter = Three.LinearFilter;
      data3dTexture.unpackAlignment = 1;
      data3dTexture.needsUpdate = true;

      const geometry = new Three.BoxGeometry(1.1, 1.1, 1.1);
      const material = new Three.ShaderMaterial({
        glslVersion: Three.GLSL3,
        uniforms: {
          base: {
            value: new Three.Color(sampleColors[gridIndex]),
          },
          map: {
            value: data3dTexture,
          },
          threshold: { value: typeof threshold === 'undefined' ? 0.01 : threshold },
          opacity: { value: typeof opacity === 'undefined' ? 0.01 : opacity },
          range: { value: typeof range === 'undefined' ? 0.01 : range },
          steps: { value: typeof steps === 'undefined' ? 100 : steps },
        },
        vertexShader: volumeShaders.vertex,
        fragmentShader: volumeShaders.fragment,
        side: Three.BackSide,
        depthTest: false,
        depthWrite: false,
        transparent: true,
      });
      material.isVolumetricFogMaterial = true;
      const fog = new Three.Mesh(geometry, material);
      fog.frustumCulled = false;

      const resolutionInv = 1.0 / resolution;
      const resolutionPow2 = Math.pow(resolution, 2);
      const resolutionPow3 = Math.pow(resolution, 3);

      const target = new Vector3(0.0, 0.0, 0.0);
      const size = new Vector3(0.0, 0.0, 0.0);
      const step = new Vector3(0.0, 0.0, 0.0);
      const bbox = new Bbox();

      bbox.set(...grid.getPreciseWorldBbox());
      bbox.getCenter(fog.position);
      bbox.getSize(fog.scale);

      bbox.getCenter(target);
      bbox.getSize(size);

      step.copy(size).multiplyScalar(resolutionInv);
      grid.transform.applyInverseTransformMap(step);

      target.sub(size.clone().multiplyScalar(0.5));
      grid.transform.applyInverseTransformMap(target);
      target.add(step.clone().multiplyScalar(0.5));

      let x = 0;
      let y = 0;
      let z = 0;

      function* probeValue() {
        for (let i = 0; i < resolutionPow3; i++) {
          if (z >= resolution) {
            return;
          }

          x++;
          target.x += step.x;

          if (x >= resolution) {
            x = 0;
            target.x -= step.x * resolution;

            y++;
            target.y += step.y;
          }

          if (y >= resolution) {
            y = 0;
            target.y -= step.y * resolution;

            z++;
            target.z += step.z;
          }

          data[x + y * resolution + z * resolutionPow2] = grid.getValue(target) ? 1.0 : 0.0;

          convertedVoxels++;

          if (progressive) {
            data3dTexture.needsUpdate = true;
          }

          yield;
        }
      }

      let probe = probeValue();

      const onAnimationFrame = () => {
        // NOTE Unblocking conversion
        // REF https://github.com/gkjohnson/three-mesh-bvh/blob/master/example/voxelize.js#L326
        if (probe) {
          this.processes[gridIndex] = requestAnimationFrame(onAnimationFrame);
        }

        let startTime = window.performance.now();
        while (window.performance.now() - startTime < 16 && probe) {
          const { done } = probe.next();

          if (onProgress) {
            onProgress({ convertedVoxels, totalVoxels, convertedGrids, totalGrids });
          }

          if (done) {
            convertedGrids++;
            probe = null;
            delete this.processes[gridIndex];

            if (convertedGrids === totalGrids) {
              if (!progressive) {
                this.add(fog);
              }

              if (onConverted) {
                onConverted();
              }
            }
          }
        }
      };
      onAnimationFrame();

      if (progressive) {
        this.add(fog);
      }
    });
  }

  dispose() {
    this.processes.forEach((task, taskIndex) => {
      cancelAnimationFrame(task);
      delete this.processes[taskIndex];
    });

    this.processes = null;
  }
}

export const volumeShaders = {
  vertex: `
  out vec3 vOrigin;
  out vec3 vDirection;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPosition, 1.0 ) ).xyz;
    vDirection = position - vOrigin;
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  fragment: `
  precision highp float;
  precision highp sampler3D;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  in vec3 vOrigin;
  in vec3 vDirection;
  out vec4 color;
  uniform vec3 base;
  uniform sampler3D map;
  uniform float threshold;
  uniform float range;
  uniform float opacity;
  uniform float steps;
  uint wang_hash(uint seed)
  {
      seed = (seed ^ 61u) ^ (seed >> 16u);
      seed *= 9u;
      seed = seed ^ (seed >> 4u);
      seed *= 0x27d4eb2du;
      seed = seed ^ (seed >> 15u);
      return seed;
  }
  float randomFloat(inout uint seed)
  {
      return float(wang_hash(seed)) / 4294967296.;
  }
  vec2 hitBox( vec3 orig, vec3 dir ) {
    const vec3 box_min = vec3( - 0.5 );
    const vec3 box_max = vec3( 0.5 );
    vec3 inv_dir = 1.0 / dir;
    vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
    vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
    vec3 tmin = min( tmin_tmp, tmax_tmp );
    vec3 tmax = max( tmin_tmp, tmax_tmp );
    float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
    float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
    return vec2( t0, t1 );
  }
  float sample1( vec3 p ) {
    return texture( map, p ).r;
  }
  float shading( vec3 coord ) {
    float step = 0.01;
    return sample1( coord + vec3( - step ) ) - sample1( coord + vec3( step ) );
  }
  void main(){
    vec3 rayDir = normalize( vDirection );
    vec2 bounds = hitBox( vOrigin, rayDir );
    if ( bounds.x > bounds.y ) discard;
    bounds.x = max( bounds.x, 0.0 );
    vec3 p = vOrigin + bounds.x * rayDir;
    vec3 inc = 1.0 / abs( rayDir );
    float delta = min( inc.x, min( inc.y, inc.z ) );
    delta /= steps;
    // Nice little seed from
    // https://blog.demofox.org/2020/05/25/casual-shadertoy-path-tracing-1-basic-camera-diffuse-emissive/
    uint seed = uint( gl_FragCoord.x ) * uint( 1973 ) + uint( gl_FragCoord.y ) * uint( 9277 );
    vec3 size = vec3( textureSize( map, 0 ) );
    float randNum = randomFloat( seed ) * 2.0 - 1.0;
    p += rayDir * randNum * ( 1.0 / size );
    vec4 ac = vec4( base, 0.0 );
    for ( float t = bounds.x; t < bounds.y; t += delta ) {
      float d = sample1( p + 0.5 );
      d = smoothstep( threshold - range, threshold + range, d ) * opacity;
      float col = shading( p + 0.5 ) * 3.0 + ( ( p.x + p.y ) * 0.25 ) + 0.2;
      ac.rgb += ( 1.0 - ac.a ) * d * col;
      ac.a += ( 1.0 - ac.a ) * d;
      if ( ac.a >= 0.95 ) break;
      p += rayDir * delta;
    }
    color = ac;
    if ( color.a == 0.0 ) discard;
  }
  `,
};
