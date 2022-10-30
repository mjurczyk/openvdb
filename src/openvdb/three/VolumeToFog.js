import * as Three from 'three';
import { Bbox } from '../math/bbox';
import { Vector3 } from '../math/vector';

const sampleColors = [0xff0000, 0x00ff00, 0x0000ff];

export class VolumeToFog extends Three.Group {
  processes = [];

  constructor(
    vdb,
    material,
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

    // NOTE Material

    let baseMaterial;
    const isValidMaterial = [
      'MeshBasicMaterial',
      'MeshLambertMaterial',
      'MeshMatcapMaterial',
      'MeshPhongMaterial',
      'MeshPhysicalMaterial',
      'MeshToonMaterial',
    ].includes(material?.type);

    if (material && !isValidMaterial) {
      console.warn(
        'VolumeToFog',
        'unsupported material type for volume',
        material.type,
        'use MeshBasicMaterial, MeshLambertMaterial, MeshMatcapMaterial, MeshPhongMaterial, MeshPhysicalMaterial, or MeshToonMaterial'
      );
    }

    if (!material || !isValidMaterial) {
      baseMaterial = new Three.MeshStandardMaterial({
        color: new Three.Color(0xffffff),
      });
    } else {
      baseMaterial = material;
    }

    baseMaterial.customProgramCacheKey = () => Math.random();

    // NOTE Parse grids

    grids.forEach((grid, gridIndex) => {
      const data = new Uint8Array(Math.pow(resolution, 3));
      const data3dTexture = new Three.Data3DTexture(data, resolution, resolution, resolution);
      data3dTexture.format = Three.RedFormat;
      data3dTexture.minFilter = Three.LinearFilter;
      data3dTexture.magFilter = Three.LinearFilter;
      data3dTexture.unpackAlignment = 1;
      data3dTexture.needsUpdate = true;

      const geometry = new Three.BoxGeometry(1.1, 1.1, 1.1);
      // const geometry = new Three.SphereGeometry(1.0, 32, 32);

      const material = baseMaterial.clone();
      material.side = Three.DoubleSide;
      // material.depthTest = false;
      // material.depthWrite = false;
      material.transparent = true;
      material.color.set(sampleColors[gridIndex]);

      material.onBeforeCompile = (shader) => {
        shader.uniforms.volumeMap = { value: data3dTexture };
        shader.uniforms.threshold = { value: typeof threshold === 'undefined' ? 0.01 : threshold };
        shader.uniforms.opacity = { value: typeof opacity === 'undefined' ? 1.0 : opacity };
        shader.uniforms.range = { value: typeof range === 'undefined' ? 0.01 : range };
        shader.uniforms.steps = { value: typeof steps === 'undefined' ? 100 : steps };
        shader.isVolumetricFogMaterial = true;

        const shaderVaryings = `
           varying mat4 mA;
           varying mat4 mB;
           varying mat4 mC;
           varying mat4 mD;
           varying mat4 mE;
        `;

        shader.vertexShader = shader.vertexShader
          .replace(
            `#include <common>`,
            `

          ${shaderVaryings}

          out vec3 vOrigin;
          out vec3 vDirection;

          #include <common>
        `
          )
          .replace(
            `#include <worldpos_vertex>`,
            `
            #include <worldpos_vertex>

          vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPosition, 1.0 ) ).xyz;
          vDirection = position - vOrigin;

          mA = modelMatrix;
          mB = inverse(modelMatrix);
          mC = modelViewMatrix;
          mD = inverse(modelViewMatrix);
          mE = projectionMatrix;
        `
          );

        const volumeLightsConfig = `
          float absorbanceFactor = .75; // NOTE Put into uniforms
          float lightMarchLimit = 10.0;
          vec3 vUnit = (mA * vec4(1., 0., 0., 0.)).xyz;
          
          geometry.position = vPoint;
        `;

        const volumePointLights = `
          PointLight pointLight;

          float pointLightsLimit = float(NUM_POINT_LIGHTS + 1);

          for (int lightIndex = 0; lightIndex < NUM_POINT_LIGHTS; lightIndex++) {
            pointLight = pointLights[lightIndex];
            getPointLightInfo(pointLight, geometry, directLight);

            vec3 vLightProbe = vec3(vPoint);
            float absorbance = 0.0;

            vec3 lightDirection = vPoint - (mD * vec4(pointLight.position, 1.)).xyz;
            float lightDistance = length(lightDirection) * length(vUnit);
            lightDirection = normalize(lightDirection);
            vec3 vLightStep = (lightDirection / VOLUME_BBOX_SPAN) / lightMarchLimit;

            for (int lightMarch = 0; lightMarch < int(lightMarchLimit); lightMarch++) {
              vLightProbe -= vLightStep;

              float lightSample = texture(volumeMap, vLightProbe + VOLUME_BBOX_SPAN).r;
              
              absorbance += exp(-1. / (absorbanceFactor * lightSample));

              if (absorbance >= 1.) {
                absorbance = 1.0;

                break;
              }
            }

            albedo += saturate((volumeSample * pointLight.color * pow(1. / lightDistance, 2.)) * (1. - absorbance));
          }
        `;

        const volumeDirLights = `
          DirectionalLight directionalLight;

          float dirLightsLimit = float(NUM_DIR_LIGHTS + 1);

          #pragma unroll_loop_start
          for (int lightIndex = 0; lightIndex < NUM_DIR_LIGHTS; lightIndex++) {
            directionalLight = directionalLights[lightIndex];
            getDirectionalLightInfo(directionalLight, geometry, directLight);

            vec3 vLightProbe = vec3(vPoint);
            float absorbance = 0.0;

            vec3 lightDirection = -( vec4(directLight.direction, 0.0) * viewMatrix ).xyz;
            float lightDistance = exp(4.); // NOTE I don't know why 4, but it works for all models and I'm too scared to touch it 🥲
            lightDirection = normalize(lightDirection);
            vec3 vLightStep = lightDirection * (lightDistance / lightMarchLimit);

            for (int lightMarch = 0; lightMarch < int(lightMarchLimit); lightMarch++) {
              vLightProbe -= vLightStep;

              float lightSample = texture(volumeMap, vLightProbe + VOLUME_BBOX_SPAN).r;
              
              if (lightSample != 0.) {
                // absorbance += absorbanceFactor;
                absorbance += exp(1. - absorbanceFactor) / (lightMarchLimit / dirLightsLimit);
              }

              if (absorbance >= 1.0) {
                absorbance = 1.0;

                break;
              }
            }

            albedo += RECIPROCAL_PI * ((volumeSample * directionalLight.color * pow(1. / lightDistance, 2.))) * exp(1. - absorbance);
          }
          #pragma unroll_loop_end
        `;

        const volumeSpotLights = `
        
        `;

        const volumeAmbientLights = `
        
        `;

        const volumeHemisphereLights = `
        
        `;

        shader.fragmentShader = shader.fragmentShader
          .replace(
            `#include <common>`,
            `
          precision highp float;
          precision highp sampler3D;

          in vec3 vOrigin;
          in vec3 vDirection;

          uniform sampler3D volumeMap;
          uniform float threshold;
          uniform float range;
          uniform float steps;

          ${shaderVaryings}

          #define VOLUME_BBOX_SPAN 0.5

          vec2 getVolumeBbox(vec3 vPointOfReference) {
            const vec3 vBoxMin = vec3(-0.5);
            const vec3 vBoxMax = vec3(0.5);
            vec3 vInvPointOfReference = 1.0 / vPointOfReference;
            
            vec3 vMinRange = (-vOrigin - VOLUME_BBOX_SPAN) * vInvPointOfReference;
            vec3 vMaxRange = (-vOrigin + VOLUME_BBOX_SPAN) * vInvPointOfReference;
            
            vec3 vMin = min(vMinRange, vMaxRange);
            vec3 vMax = max(vMinRange, vMaxRange);

            return vec2(
              max(vMin.x, max(vMin.y, vMin.z)),
              min(vMax.x, min(vMax.y, vMax.z))
            );
          }

          #include <common>
        `
          )
          .replace(`#include <lights_fragment_begin>`, `// NOTE Override light calculations`)
          .replace(`#include <lights_fragment_end>`, `// NOTE Override light calculations`)
          .replace(
            `#include <output_fragment>`,
            `
            vec3 vWorld = -vViewPosition;

            GeometricContext geometry;

            IncidentLight directLight;

            vec3 vRayDirection = normalize(vDirection);
            vec2 vBounds = getVolumeBbox(vRayDirection);
            
            if (vBounds.x > vBounds.y) {
              discard;
            }

            vBounds.x = max(vBounds.x, 0.0);

            vec3 vPoint = vOrigin + vBounds.x * vRayDirection;
            vec3 vPointStep = 1.0 / abs(vRayDirection);

            float delta = min(vPointStep.x, min(vPointStep.y, vPointStep.z)) / steps;
            vec3 vDirectionDeltaStep = vRayDirection * delta;

            float density = 0.0;
            vec3 albedo = vec3(0., 0., 0.);

            ${volumeLightsConfig}

            for (float i = vBounds.x; i < vBounds.y; i += delta) {
              float volumeSample = texture(volumeMap, vPoint + VOLUME_BBOX_SPAN).r;
              density += (volumeSample / 1028.) * steps;

              if (density >= 1.) {
                break;
              }

              if (volumeSample > 0.) {
                #if (NUM_POINT_LIGHTS > 0)
                  ${volumePointLights}
                #endif

                #if ( NUM_DIR_LIGHTS > 0 )
                  /* ${volumeDirLights} */
                #endif
              }

              vPoint += vDirectionDeltaStep;
            }

            outgoingLight.rgb = saturate(albedo / density);
            diffuseColor.a = saturate(density * opacity);

            if (density == 0.) {
              discard;
            }

            #include <output_fragment>
        `
          );
      };

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

          data[x + y * resolution + z * resolutionPow2] = grid.getValue(target)
            ? // ? 220.0 + Math.random() * (255.0 - 220.0)
              255.0
            : 0.0;

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
