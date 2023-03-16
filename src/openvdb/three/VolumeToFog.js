import * as Three from 'three';
import { MathUtils } from 'three';
import { GridDescriptor } from '../core/GridDescriptor';
import { Bbox } from '../math/bbox';
import { Vector3 } from '../math/vector';

export class VolumeToFog extends Three.Group {
  processes = [];

  constructor(
    source,
    material,
    {
      resolution,
      progressive,
      absorbance,
      opacity,
      steps,
      noise,
      color,
      emissiveGrid
    },
    onConverted,
    onProgress
  ) {
    super();

    this.frustumCulled = false;

    let grids;

    if (source instanceof Array) {
      // NOTE Treat first argument as set of grids
      grids = source;
    } else if (typeof source.grids !== 'undefined') {
      // NOTE Treat first argument as VDB source
      grids = Object.values(source.grids);
    } else {
      // NOTE Hope for the best
      grids = [source];
    }

    // NOTE Material

    let baseMaterial;
    const isValidMaterial = [
      'MeshBasicMaterial',
      'MeshLambertMaterial',
      'MeshMatcapMaterial',
      'MeshPhongMaterial',
      'MeshStandardMaterial',
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
        color: new Three.Color(0x000000),
        side: Three.DoubleSide,
      });
    } else {
      baseMaterial = material;
    }

    baseMaterial.customProgramCacheKey = () => Math.random();

    // NOTE Shader properties (grids influencing color output)

    let emissiveTexture3D, probeEmissiveValue;

    if (emissiveGrid) {
      grids = grids.filter(match => match !== emissiveGrid);

      const emissiveData = new Uint8Array(Math.pow(resolution, 3));
      emissiveTexture3D = new Three.Data3DTexture(emissiveData, resolution, resolution, resolution);
      emissiveTexture3D.format = Three.RedFormat;
      emissiveTexture3D.minFilter = Three.LinearFilter;
      emissiveTexture3D.magFilter = Three.LinearFilter;
      emissiveTexture3D.unpackAlignment = 1;
      emissiveTexture3D.needsUpdate = true;

      probeEmissiveValue = (index, target, x, y, z) => {
        const xr = x / resolution;
        const yr = y / resolution;
        const zr = z / resolution;

        emissiveData[index] = emissiveGrid.getValue(target) * 255.;
        
        // emissiveData[index] = (1. - yr + .3) * ((1. - Math.abs((xr + 0.5) - 1.0)) * (1. - Math.abs((zr + 0.5) - 1.0))) * 100.;
      };
    }

    // NOTE Parse grids

    let convertedGrids = 0;
    let convertedVoxels = 0;

    const totalGrids = grids.length;
    const totalVoxels = totalGrids * Math.pow(resolution, 3);

    grids.forEach((grid, gridIndex) => {
      if (!(grid instanceof GridDescriptor)) {
        return;
      }

      const data = new Uint8Array(Math.pow(resolution, 3));
      const volumeTexture3D = new Three.Data3DTexture(data, resolution, resolution, resolution);
      volumeTexture3D.format = Three.RedFormat;
      volumeTexture3D.minFilter = Three.LinearFilter;
      volumeTexture3D.magFilter = Three.LinearFilter;
      volumeTexture3D.unpackAlignment = 1;
      volumeTexture3D.needsUpdate = true;

      const geometry = new Three.SphereGeometry(1.0);

      const material = baseMaterial.clone();
      material.transparent = true;
      material.opacity = typeof opacity === 'undefined' ? 1.0 : opacity;

      material.onBeforeCompile = (shader) => {
        shader.uniforms.baseColor = { value: new Three.Color(color || 0x000000) };
        shader.uniforms.volumeMap = { value: volumeTexture3D };
        shader.uniforms.emissiveMap = { value: emissiveTexture3D };
        shader.uniforms.opacity = { value: material.opacity };
        shader.uniforms.steps = { value: typeof steps === 'undefined' ? 100 : steps };
        shader.uniforms.absorbanceFactor = {
          value: typeof absorbance === 'undefined' ? 1.0 : absorbance,
        };
        shader.uniforms.resolution = { value: resolution };
        shader.isVolumetricFogMaterial = true;

        const shaderProperties = `
          #define VOLUME_BBOX_SPAN 0.5
          ${emissiveTexture3D ? '#define USE_EMISSIVE_GRID' : ''}
        `;

        const shaderVaryings = `
           varying mat4 mA;
           varying mat4 mD;
           varying mat3 mI;
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
          mD = inverse(modelViewMatrix);
          mI = inverse(normalMatrix);
        `
          );

        const volumeLightsConfig = `
          // NOTE For absorbanceFactor closer to 1.0, we want high lightMarchLimit and lower volumeSteps
          //      For absorbanceFactor closer to 0.1, we want lower lightMarchLimit and higher volumeSteps
          float lightMarchLimit = mix(5.0, resolution / 5.0, absorbanceFactor);

          vec3 vUnit = (mA * vec4(1., 0., 0., 0.)).xyz;
          
          geometry.position = vPoint;
        `;

        const volumePointLights = `
          PointLight pointLight;

          for (int lightIndex = 0; lightIndex < NUM_POINT_LIGHTS; lightIndex++) {
            pointLight = pointLights[lightIndex];
            getPointLightInfo(pointLight, geometry, directLight);

            vec3 vLightProbe = vec3(vPoint);
            float absorbance = 0.0;

            vec3 lightDirection = vPoint - (mD * vec4(pointLight.position, 1.)).xyz;
            float lightDistance = length(lightDirection) * length(vUnit);
            lightDirection = normalize(lightDirection);
            vec3 vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

            for (int lightMarch = 0; lightMarch < int(lightMarchLimit); lightMarch++) {
              vLightProbe -= vLightStep;

              if (isOutsideVolume(vLightProbe + VOLUME_BBOX_SPAN)) {
                break;
              }

              float lightSample = texture(volumeMap, vLightProbe + VOLUME_BBOX_SPAN).r;
              
              absorbance += exp(-1. / absorbanceFactor) * lightSample;

              if (absorbance >= 1.) {
                absorbance = 1.0;

                break;
              }
            }

            albedo += ((volumeSample * pointLight.color * pow(1. / lightDistance, 2.)) * (1. - absorbance)) * (baseColor.rgb * RECIPROCAL_PI);
          }
        `;

        const volumeDirLights = `
          DirectionalLight directionalLight;

          #pragma unroll_loop_start
          for (int lightIndex = 0; lightIndex < NUM_DIR_LIGHTS; lightIndex++) {
            directionalLight = directionalLights[lightIndex];
            getDirectionalLightInfo(directionalLight, geometry, directLight);

            vec3 vLightProbe = vec3(vPoint);
            float absorbance = 0.0;

            vec3 lightDirection = -normalize((vec4(directionalLight.direction, 1.) * viewMatrix).xyz);
            vec3 vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

            for (int lightMarch = 0; lightMarch < int(lightMarchLimit); lightMarch++) {
              vLightProbe -= vLightStep;

              if (isOutsideVolume(vLightProbe + VOLUME_BBOX_SPAN)) {
                break;
              }

              float lightSample = texture(volumeMap, vLightProbe + VOLUME_BBOX_SPAN).r;
              
              absorbance += exp(-1. / absorbanceFactor) * lightSample;

              if (absorbance >= 1.) {
                absorbance = 1.0;

                break;
              }
            }

            // NOTE No idea why 0.01 yet
            albedo += ((volumeSample * directionalLight.color * 0.01) * (1. - absorbance)) * (baseColor.rgb * RECIPROCAL_PI);
          }
          #pragma unroll_loop_end
        `;

        const volumeSpotLights = `
          SpotLight spotLight;

          for (int lightIndex = 0; lightIndex < NUM_SPOT_LIGHTS; lightIndex++) {
            spotLight = spotLights[lightIndex];
            getSpotLightInfo(spotLight, geometry, directLight);

            vec3 vLightProbe = vec3(vPoint);
            float absorbance = 0.0;

            vec3 lightDirection = vPoint - (mD * vec4(spotLight.position, 1.)).xyz;
            float lightDistance = length(lightDirection) * length(vUnit);
            lightDirection = normalize(lightDirection);
            vec3 vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

            float angleCos = dot(normalize(-lightDirection), normalize(mI * spotLight.direction));
            float spotAttenuation = smoothstep(spotLight.coneCos, spotLight.penumbraCos, angleCos);

            if (spotAttenuation > 0.) {
              for (int lightMarch = 0; lightMarch < int(lightMarchLimit); lightMarch++) {
                vLightProbe -= vLightStep;
                
                if (isOutsideVolume(vLightProbe + VOLUME_BBOX_SPAN)) {
                  break;
                }

                float lightSample = texture(volumeMap, vLightProbe + VOLUME_BBOX_SPAN).r;
                
                absorbance += exp(-1. / absorbanceFactor) * lightSample;

                if (absorbance >= 1.) {
                  absorbance = 1.0;

                  break;
                }
              }
            }

            albedo += spotAttenuation * ((volumeSample * spotLight.color * pow(1. / lightDistance, 2.)) * (1. - absorbance)) * (baseColor.rgb * RECIPROCAL_PI);
          }
        `;

        const volumeHemiLights = `
          #pragma unroll_loop_start
          for (int lightIndex = 0; lightIndex < NUM_HEMI_LIGHTS; lightIndex++) {
            HemisphereLight hemiLight = hemisphereLights[lightIndex];

            vec3 vLightProbe = vec3(vPoint);
            float absorbanceUp = 0.0;
            float absorbanceDown = 0.0;

            vec3 lightDirection = -normalize((vec4(hemiLight.direction, 1.) * viewMatrix).xyz);
            vec3 vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;
            float lightSample;

            for (int lightMarch = 1; lightMarch < int(lightMarchLimit / 2.); lightMarch++) {
              vec3 textureProbe = vLightProbe + VOLUME_BBOX_SPAN - float(lightMarch) * vLightStep;
 
              if (!isOutsideVolume(textureProbe)) {
                lightSample = texture(volumeMap, textureProbe).r;
              
                if (absorbanceUp < 1.) {
                  absorbanceUp += exp(-1. / absorbanceFactor) * lightSample;
                }
              }

              textureProbe = vLightProbe + VOLUME_BBOX_SPAN + float(lightMarch) * vLightStep;

              if (!isOutsideVolume(textureProbe)) {
                lightSample = texture(volumeMap, textureProbe).r;
                
                if (absorbanceDown < 1.) {
                  absorbanceDown += exp(-1. / absorbanceFactor) * lightSample;
                }
              }
            }

            absorbanceUp = min(1., absorbanceUp);
            absorbanceDown = min(1., absorbanceDown);

            vec3 colorMix = mix(hemiLight.skyColor * (1. - absorbanceUp), hemiLight.groundColor * (1. - absorbanceDown), .5) / 2.0;

            albedo += ((volumeSample * colorMix)) * (baseColor.rgb * RECIPROCAL_PI);
          }
          #pragma unroll_loop_end
        `;

        const volumeAmbientLight = `
          albedo += (ambientLightColor) * (baseColor.rgb * RECIPROCAL_PI);
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
          uniform sampler3D emissiveMap;

          uniform float steps;
          uniform float absorbanceFactor;
          uniform vec3 baseColor;
          uniform float resolution;

          ${shaderProperties}
          ${shaderVaryings}

          bool isOutsideVolume(vec3 source) {
            return (
              source.x >= 1. ||
              source.y >= 1. ||
              source.z >= 1. ||
              source.x <= 0. ||
              source.y <= 0. ||
              source.z <= 0.
            );
          }

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

          vec3 radiation = vec3(0.);
          vec3 getBlackBodyRadiation(float temperature) {
            if (temperature == 0.) {
              return vec3(0.);
            }

            #ifndef USE_EMISSIVE_GRID
              return vec3(0.);
            #endif

            // NOTE Blackbody radiation source - https://www.shadertoy.com/view/4tdGWM
            float temperatureScaled = temperature * 16000.;

            radiation.r += 1. / (exp(19E3 * 1. / temperatureScaled) - 1.);
            radiation.g += 3.375 / (exp(19E3 * 1.5 / temperatureScaled) - 1.);
            radiation.b += 8. / (exp(19E3 * 2. / temperatureScaled) - 1.);

            return (radiation / max(radiation.r,max(radiation.g,radiation.b)));
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

            float delta = min(vPointStep.x, min(vPointStep.y, vPointStep.z)) / mix(steps, resolution, absorbanceFactor);
            vec3 vDirectionDeltaStep = vRayDirection * delta;

            float density = 0.0;
            vec3 albedo = vec3(0.);
            vec3 emissive = vec3(0.);

            ${volumeLightsConfig}

            for (float i = vBounds.x; i < vBounds.y; i += delta) {
              float volumeSample = texture(volumeMap, vPoint + VOLUME_BBOX_SPAN).r;
              
              density += volumeSample * (1. / sqrt(steps));

              if (volumeSample > 0. && density <= exp(-1. + 1. / absorbanceFactor)) {

                #ifdef USE_EMISSIVE_GRID
                  float emissiveSample = texture(emissiveMap, vPoint + VOLUME_BBOX_SPAN).r;
                  emissive = max(emissive, vec3(emissiveSample));
                #endif
               
                volumeSample *= exp(-1. + absorbanceFactor);

                ${volumeAmbientLight}

                #if NUM_HEMI_LIGHTS > 0
                  ${volumeHemiLights}
                #endif

                #if NUM_POINT_LIGHTS > 0
                  ${volumePointLights}
                #endif

                #if NUM_DIR_LIGHTS > 0
                  ${volumeDirLights}
                #endif

                #if NUM_SPOT_LIGHTS > 0
                  ${volumeSpotLights}
                #endif

                // TODO Emissive based on temperature
                // TODO Light probes
                // TODO RectArea lights
              }

              vPoint += vDirectionDeltaStep;
            }

            density = clamp(density, 0.0, 1.0);
            emissive = getBlackBodyRadiation(emissive.r);

            outgoingLight.rgb = max(albedo, emissive);
            // NOTE This is not physically correct - multiply by exp(-1. + absorbanceFactor) to "fake" Beer's law
            diffuseColor.a = min(1.0, density * exp(-1. + absorbanceFactor)) * opacity;

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
            probeEmissiveValue = null;
            emissiveTexture3D.needsUpdate = true;

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

          const noiseSeed = MathUtils.clamp(255.0 * (noise || 0.0), 0.0, 255.0);
          const index = x + y * resolution + z * resolutionPow2;

          data[index] = grid.getValue(target) * (255.0 - noiseSeed + Math.random() * noiseSeed);
          probeEmissiveValue && probeEmissiveValue(index, target, x, y, z);

          convertedVoxels++;

          if (progressive) {
            volumeTexture3D.needsUpdate = true;

            if (emissiveTexture3D) {
              emissiveTexture3D.needsUpdate = true;
            }
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
    if (!this.processes) {
      return;
    }

    this.processes.forEach((task, taskIndex) => {
      cancelAnimationFrame(task);
      delete this.processes[taskIndex];
    });

    this.processes = null;
  }
}
