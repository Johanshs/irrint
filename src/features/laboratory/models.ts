import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ComponentKind } from './components';
type Point = [number, number, number];
export const material = (color: string, metalness = 0, roughness = 0.65) =>
  new T.MeshStandardMaterial({ color, metalness, roughness });
export function mesh(parent: T.Object3D, geometry: T.BufferGeometry, mat: T.Material, position: Point) {
  const object = new T.Mesh(geometry, mat);
  object.position.set(...position);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
export const box = (parent: T.Object3D, size: Point, position: Point, mat: T.Material) =>
  mesh(parent, new T.BoxGeometry(...size), mat, position);
export function tube(parent: T.Object3D, from: Point, to: Point, radius: number, mat: T.Material) {
  const a = new T.Vector3(...from),
    b = new T.Vector3(...to),
    delta = b.clone().sub(a);
  const object = mesh(parent, new T.CylinderGeometry(radius, radius, delta.length(), 10), mat, [0, 0, 0]);
  object.position.copy(a.add(b).multiplyScalar(0.5));
  object.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
  return object;
}
function wire(parent: T.Object3D, points: Point[], color: string) {
  mesh(
    parent,
    new T.TubeGeometry(new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))), 20, 0.012, 6, false),
    material(color),
    [0, 0, 0],
  );
}
function lettering(parent: T.Object3D, text: string, position: Point, width: number, color = '#f0f5df') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext('2d')!;
  context.fillStyle = color;
  context.font = 'bold 30px monospace';
  context.textAlign = 'center';
  context.fillText(text, 128, 43);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  const label = mesh(
    parent,
    new T.PlaneGeometry(width, width / 4),
    new T.MeshBasicMaterial({ map, transparent: true, depthWrite: false }),
    position,
  );
  label.rotation.x = -Math.PI / 2;
}

/** Original procedural illustrations. Proportions are enlarged for inspection, not engineering drawings. */
export function createComponent(kind: ComponentKind): T.Group {
  const group = new T.Group();
  const black = material('#202c30'),
    silver = material('#bbc7c9', 0.8, 0.3),
    gold = material('#cfa951', 0.7, 0.35);
  const pcb = material('#153c38'),
    blue = material('#357f9a', 0.3),
    white = material('#e6e6d9');
  if (kind === 'controller') {
    box(group, [0.72, 0.055, 1.35], [0, 0, 0], pcb);
    for (const x of [-0.32, 0.32]) {
      box(group, [0.08, 0.1, 1.18], [x, 0.075, 0], black);
      for (let i = 0; i < 19; i++) {
        const z = -0.55 + i * 0.061;
        box(group, [0.022, 0.24, 0.022], [x, -0.035, z], gold);
        box(group, [0.027, 0.015, 0.027], [x, 0.132, z], silver);
      }
    }
    box(group, [0.45, 0.045, 0.69], [0, 0.053, -0.25], black);
    box(group, [0.41, 0.12, 0.44], [0, 0.13, -0.17], silver);
    lettering(group, 'ESP32', [0, 0.193, -0.17], 0.32, '#314449');
    for (let i = 0; i < 5; i++) {
      box(group, [0.29, 0.008, 0.013], [0, 0.082, -0.61 + i * 0.036], gold);
      box(group, [0.013, 0.008, 0.039], [i % 2 ? -0.14 : 0.14, 0.082, -0.592 + i * 0.036], gold);
    }
    box(group, [0.15, 0.045, 0.17], [0, 0.064, 0.24], black);
    for (let i = 0; i < 6; i++) {
      box(
        group,
        [0.075, 0.02, 0.026],
        [i % 2 ? 0.18 : -0.18, 0.046, 0.04 + Math.floor(i / 2) * 0.12],
        silver,
      );
    }
    box(group, [0.23, 0.12, 0.18], [0, 0.084, 0.59], silver);
    box(group, [0.18, 0.073, 0.012], [0, 0.083, 0.686], black);
    for (const x of [-0.22, 0.22]) {
      box(group, [0.105, 0.05, 0.105], [x, 0.057, 0.48], silver);
      mesh(group, new T.CylinderGeometry(0.036, 0.036, 0.04, 12), black, [x, 0.1, 0.48]);
    }
    lettering(group, 'EN     BOOT', [0, 0.04, 0.37], 0.52);
    mesh(group, new T.SphereGeometry(0.022, 8, 6), material('#ee775d'), [0.19, 0.052, 0.26]);
    // Driver module is visibly separate from the controller board.
    box(group, [0.43, 0.04, 0.68], [0.67, 0, 0.18], pcb);
    box(group, [0.33, 0.25, 0.3], [0.67, 0.145, 0.11], blue);
    lettering(group, 'RELAY', [0.67, 0.275, 0.11], 0.27);
    box(group, [0.34, 0.13, 0.14], [0.67, 0.09, 0.42], material('#49a27e'));
    for (let i = 0; i < 3; i++)
      mesh(group, new T.CylinderGeometry(0.035, 0.035, 0.02, 12), silver, [0.56 + i * 0.11, 0.165, 0.42]);
    wire(
      group,
      [
        [0.25, 0.05, 0.18],
        [0.42, 0.23, 0.24],
        [0.57, 0.05, -0.08],
      ],
      '#dcba5d',
    );
  } else if (kind === 'sensor') {
    const shape = new T.Shape();
    shape.moveTo(-0.17, 0.58);
    shape.lineTo(0.17, 0.58);
    shape.lineTo(0.17, -0.54);
    shape.lineTo(0.08, -0.82);
    shape.quadraticCurveTo(0, -0.94, -0.08, -0.82);
    shape.lineTo(-0.17, -0.54);
    shape.closePath();
    mesh(
      group,
      new T.ExtrudeGeometry(shape, {
        depth: 0.035,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.008,
        bevelThickness: 0.005,
      }),
      black,
      [0, 0, 0],
    );
    // Copper electrodes below the insertion mark, electronics kept above it.
    for (const x of [-0.1, 0.1]) box(group, [0.025, 0.7, 0.012], [x, -0.28, 0.045], gold);
    for (let i = 0; i < 8; i++)
      box(group, [0.17, 0.017, 0.012], [i % 2 ? -0.025 : 0.025, -0.58 + i * 0.075, 0.045], gold);
    box(group, [0.33, 0.017, 0.012], [0, 0.13, 0.047], white);
    box(group, [0.12, 0.11, 0.035], [0, 0.28, 0.055], silver);
    box(group, [0.065, 0.075, 0.028], [-0.095, 0.44, 0.055], black);
    box(group, [0.25, 0.12, 0.12], [0, 0.56, 0.08], white);
    for (const x of [-0.075, 0, 0.075]) {
      box(group, [0.025, 0.03, 0.04], [x, 0.58, 0.15], black);
      wire(
        group,
        [
          [x, 0.6, 0.1],
          [x, 0.86, 0.02],
          [x + 0.2, 0.87, -0.18],
        ],
        x < 0 ? '#cd5844' : x > 0 ? '#d0a744' : '#334448',
      );
    }
    const screw = mesh(group, new T.TorusGeometry(0.035, 0.012, 6, 12), gold, [0.1, 0.43, 0.044]);
    screw.rotation.z = 0.2;
  } else if (kind === 'valve') {
    tube(group, [-0.43, 0, 0], [0.43, 0, 0], 0.115, gold);
    for (const x of [-0.3, 0.3]) {
      const nut = mesh(group, new T.CylinderGeometry(0.17, 0.17, 0.16, 6), gold, [x, 0, 0]);
      nut.rotation.z = Math.PI / 2;
      for (let i = 0; i < 4; i++) {
        const ring = mesh(group, new T.TorusGeometry(0.119, 0.009, 5, 16), silver, [
          Math.sign(x) * (0.36 + i * 0.025),
          0,
          0,
        ]);
        ring.rotation.y = Math.PI / 2;
      }
    }
    mesh(group, new T.CylinderGeometry(0.18, 0.22, 0.17, 16), gold, [0, 0.12, 0]);
    box(group, [0.3, 0.31, 0.3], [0, 0.35, 0], black);
    mesh(group, new T.CylinderGeometry(0.055, 0.055, 0.08, 12), silver, [0, 0.54, 0]);
    box(group, [0.14, 0.15, 0.24], [0, 0.36, 0.22], black);
    wire(
      group,
      [
        [0, 0.34, 0.34],
        [0.12, 0.3, 0.5],
        [0.36, -0.04, 0.46],
      ],
      '#5c7072',
    );
  } else if (kind === 'pump') {
    box(group, [1.05, 0.1, 0.85], [0, -0.27, 0], silver);
    const motor = mesh(group, new T.CylinderGeometry(0.26, 0.26, 0.65, 24), blue, [0, 0, 0]);
    motor.rotation.z = Math.PI / 2;
    for (let i = 0; i < 8; i++) {
      const ring = mesh(group, new T.TorusGeometry(0.268, 0.018, 5, 24), silver, [-0.29 + i * 0.085, 0, 0]);
      ring.rotation.y = Math.PI / 2;
    }
    const head = mesh(group, new T.CylinderGeometry(0.31, 0.31, 0.23, 24), blue, [0.43, 0, 0]);
    head.rotation.z = Math.PI / 2;
    tube(group, [0.43, 0, 0], [0.43, 0.48, 0], 0.095, gold);
    tube(group, [0.53, 0, 0], [0.76, 0, 0], 0.095, gold);
    box(group, [0.32, 0.14, 0.27], [-0.05, 0.28, 0], black);
    for (const x of [-0.4, 0.4])
      for (const z of [-0.3, 0.3])
        mesh(group, new T.CylinderGeometry(0.04, 0.04, 0.02, 6), gold, [x, -0.21, z]);
  } else if (kind === 'reservoir') {
    mesh(group, new T.CylinderGeometry(0.68, 0.72, 1.65, 40), blue, [0, 0.825, 0]);
    for (const y of [0.15, 0.48, 1.04, 1.5]) {
      const ring = mesh(group, new T.TorusGeometry(0.706, 0.024, 6, 40), silver, [0, y, 0]);
      ring.rotation.x = Math.PI / 2;
    }
    mesh(group, new T.CylinderGeometry(0.71, 0.71, 0.08, 40), material('#286678'), [0, 1.68, 0]);
    mesh(group, new T.CylinderGeometry(0.2, 0.2, 0.07, 24), black, [0, 1.755, 0]);
    tube(group, [0, 0.18, 0.66], [0, 0.18, 0.96], 0.09, gold);
  } else {
    tube(group, [-0.36, 0, 0], [0.36, 0, 0], 0.04, black);
    mesh(group, new T.CylinderGeometry(0.095, 0.065, 0.09, 16), black, [0, 0.07, 0]);
    mesh(group, new T.CylinderGeometry(0.077, 0.077, 0.03, 16), material('#59a7c3'), [0, 0.13, 0]);
    tube(group, [0, 0.075, 0], [0, 0.075, 0.14], 0.026, black);
    tube(group, [0, 0.075, 0.14], [0, -0.055, 0.14], 0.025, black);
  }
  // Batch the many pins, fittings and traces per material while retaining one selectable component.
  group.updateMatrixWorld(true);
  const batches = new Map<T.Material, T.BufferGeometry[]>();
  group.traverse((object) => {
    if (!(object instanceof T.Mesh)) return;
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    const batch = batches.get(object.material) ?? [];
    batch.push(geometry);
    batches.set(object.material, batch);
    object.geometry.dispose();
  });
  group.clear();
  for (const [mat, geometries] of batches) {
    const merged = mergeGeometries(geometries);
    if (merged) mesh(group, merged, mat, [0, 0, 0]);
    geometries.forEach((geometry) => geometry.dispose());
  }
  return group;
}

export function disposeScene(scene: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>(),
    textures = new Set<T.Texture>();
  scene.traverse((object) => {
    if (!(object instanceof T.Mesh)) return;
    geometries.add(object.geometry);
    for (const mat of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(mat);
      for (const value of Object.values(mat)) if (value instanceof T.Texture) textures.add(value);
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}
