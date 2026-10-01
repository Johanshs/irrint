import * as T from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Cel-shading for the didactic model: a 4-step light ramp plus an inverted-hull ink line.
 * Purely visual. Nothing here reads or changes simulation state.
 */
let ramp: T.DataTexture | undefined;
export function toonRamp() {
  if (ramp) return ramp;
  const steps = [96, 168, 222, 255];
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((value, i) => data.set([value, value, value, 255], i * 4));
  ramp = new T.DataTexture(data, steps.length, 1, T.RGBAFormat);
  ramp.minFilter = T.NearestFilter;
  ramp.magFilter = T.NearestFilter;
  ramp.generateMipmaps = false;
  ramp.needsUpdate = true;
  // Shared between scenes; disposeScene must not release it.
  ramp.userData.shared = true;
  return ramp;
}

export interface ToonOptions {
  /** Skip the ink line for this material (thin roots, translucent effects). */
  noInk?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  map?: T.Texture;
  side?: T.Side;
}

export function toon(color: string, options: ToonOptions = {}) {
  const mat = new T.MeshToonMaterial({
    color,
    gradientMap: toonRamp(),
    emissive: options.emissive ?? '#000000',
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    map: options.map ?? null,
    side: options.side ?? T.FrontSide,
  });
  if (options.noInk) mat.userData.noInk = true;
  return mat;
}

const inkVertex = /* glsl */ `
  uniform float width;
  void main() {
    vec4 local = vec4(position, 1.0);
    vec3 n = normal;
    #ifdef USE_INSTANCING
      local = instanceMatrix * local;
      n = mat3(instanceMatrix) * n;
    #endif
    vec4 mv = modelViewMatrix * local;
    vec3 nv = normalize(normalMatrix * n);
    // Grows with distance so the stroke keeps a near-constant thickness on screen.
    mv.xyz += nv * width * clamp(-mv.z, 1.5, 28.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const inkFragment = /* glsl */ `
  uniform vec3 color;
  void main() {
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

export function inkMaterial(width = 0.0022, color = '#2a2622') {
  return new T.ShaderMaterial({
    uniforms: { width: { value: width }, color: { value: new T.Color(color) } },
    vertexShader: inkVertex,
    fragmentShader: inkFragment,
    side: T.BackSide,
  });
}

/** Smooth normals keep the hull closed at hard corners (boxes, extrusions). */
function hullGeometry(geometry: T.BufferGeometry) {
  const plain = new T.BufferGeometry();
  plain.setAttribute('position', geometry.getAttribute('position').clone());
  if (geometry.index) plain.setIndex(geometry.index.clone());
  const merged = mergeVertices(plain, 1e-4);
  plain.dispose();
  merged.computeVertexNormals();
  return merged;
}

/** Adds an ink outline as a child of the mesh. Returns the outline for optional tuning. */
export function ink(object: T.Mesh, width?: number, color?: string) {
  const geometry = hullGeometry(object.geometry);
  const line =
    object instanceof T.InstancedMesh
      ? new T.InstancedMesh(geometry, inkMaterial(width, color), object.count)
      : new T.Mesh(geometry, inkMaterial(width, color));
  if (line instanceof T.InstancedMesh && object instanceof T.InstancedMesh)
    line.instanceMatrix = object.instanceMatrix;
  line.castShadow = false;
  line.receiveShadow = false;
  line.raycast = () => {};
  line.userData.ink = true;
  object.add(line);
  return line;
}

/**
 * Merges static meshes of a group by material (fewer draw calls on phones),
 * then inks each batch unless its material opts out.
 */
export function bake(group: T.Group, options: { ink?: boolean; width?: number } = {}) {
  group.updateMatrixWorld(true);
  const inverse = group.matrixWorld.clone().invert();
  const batches = new Map<T.Material, T.BufferGeometry[]>();
  const shadows = new Map<T.Material, boolean>();
  group.traverse((object) => {
    if (!(object instanceof T.Mesh) || object instanceof T.InstancedMesh) return;
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    const material = object.material as T.Material;
    if (!(material as T.MeshBasicMaterial).map) geometry.deleteAttribute('uv');
    geometry.applyMatrix4(inverse.clone().multiply(object.matrixWorld));
    const batch = batches.get(material) ?? [];
    batch.push(geometry);
    batches.set(material, batch);
    shadows.set(material, (shadows.get(material) ?? false) || object.castShadow);
    object.geometry.dispose();
  });
  group.clear();
  for (const [mat, geometries] of batches) {
    const merged = mergeGeometries(geometries);
    geometries.forEach((geometry) => geometry.dispose());
    if (!merged) continue;
    const object = new T.Mesh(merged, mat);
    object.castShadow = shadows.get(mat) ?? true;
    object.receiveShadow = true;
    group.add(object);
    if (options.ink !== false && !mat.userData.noInk && !(mat as T.MeshBasicMaterial).transparent)
      ink(object, options.width);
  }
  return group;
}
