import * as T from 'three';
import type { ComponentKind } from './components';
import { bake, toon, type ToonOptions } from './toon';
export type Point = [number, number, number];

/**
 * Cel-shaded material. `metalness`/`roughness` are kept in the signature for compatibility,
 * but the toon ramp ignores them: metals read through color and small highlight pieces instead.
 */
export const material = (color: string, _metalness = 0, _roughness = 0.65, options?: ToonOptions) =>
  toon(color, options);
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
export function tube(
  parent: T.Object3D,
  from: Point,
  to: Point,
  radius: number,
  mat: T.Material,
  sides = 10,
) {
  const a = new T.Vector3(...from),
    b = new T.Vector3(...to),
    delta = b.clone().sub(a);
  const object = mesh(parent, new T.CylinderGeometry(radius, radius, delta.length(), sides), mat, [0, 0, 0]);
  object.position.copy(a.add(b).multiplyScalar(0.5));
  object.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
  return object;
}
/** Ring around an axis ('x' | 'y' | 'z'). */
export function ring(
  parent: T.Object3D,
  radius: number,
  thickness: number,
  position: Point,
  axis: 'x' | 'y' | 'z',
  mat: T.Material,
  segments = 20,
) {
  const object = mesh(parent, new T.TorusGeometry(radius, thickness, 5, segments), mat, position);
  if (axis === 'x') object.rotation.y = Math.PI / 2;
  if (axis === 'y') object.rotation.x = Math.PI / 2;
  return object;
}
function wire(parent: T.Object3D, points: Point[], color: string, radius = 0.014) {
  mesh(
    parent,
    new T.TubeGeometry(new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))), 20, radius, 6, false),
    material(color),
    [0, 0, 0],
  );
}
export function lettering(
  parent: T.Object3D,
  text: string,
  position: Point,
  width: number,
  color = '#f4f7e6',
  font = 'bold 30px monospace',
) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext('2d')!;
  context.fillStyle = color;
  context.font = font;
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
  label.castShadow = false;
  return label;
}
/** Hexagonal nut/bolt head standing on the given axis. */
function hex(
  parent: T.Object3D,
  radius: number,
  height: number,
  position: Point,
  mat: T.Material,
  axis = 'y',
) {
  const nut = mesh(parent, new T.CylinderGeometry(radius, radius, height, 6), mat, position);
  if (axis === 'x') nut.rotation.z = Math.PI / 2;
  if (axis === 'z') nut.rotation.x = Math.PI / 2;
  return nut;
}

/**
 * Original procedural illustrations in a cartoon style (cel shading + ink line).
 * Proportions are enlarged for inspection, not engineering drawings.
 * Connection points (pipe ends, drip outlet, probe tip) are kept where the field expects them.
 */
export function createComponent(kind: ComponentKind): T.Group {
  const group = new T.Group();
  const black = material('#2c3438'),
    graphite = material('#454f55'),
    silver = material('#d3dde0'),
    gold = material('#e8b84f'),
    brass = material('#dba23f'),
    brassDark = material('#b07a26');
  const pcb = material('#1f6b60'),
    blue = material('#3a8fd6'),
    white = material('#f1f2ea'),
    red = material('#e0533d'),
    pvc = material('#e9ede6');
  const led = (color: string) => material(color, 0, 0, { emissive: color, emissiveIntensity: 0.9 });
  if (kind === 'controller') {
    // ESP32-style dev board.
    mesh(group, roundedSlab(0.72, 1.35, 0.05, 0.05), pcb, [0, -0.025, 0]);
    for (const x of [-0.32, 0.32]) {
      box(group, [0.08, 0.1, 1.18], [x, 0.075, 0], black);
      for (let i = 0; i < 19; i++) {
        const z = -0.55 + i * 0.061;
        box(group, [0.022, 0.24, 0.022], [x, -0.035, z], gold);
        box(group, [0.03, 0.016, 0.03], [x, 0.132, z], silver);
      }
    }
    box(group, [0.45, 0.045, 0.69], [0, 0.053, -0.25], black);
    mesh(group, roundedSlab(0.41, 0.44, 0.12, 0.025), silver, [0, 0.07, -0.17]);
    lettering(group, 'ESP32', [0, 0.193, -0.17], 0.32, '#38505a');
    // Printed antenna zigzag.
    for (let i = 0; i < 5; i++) {
      box(group, [0.29, 0.008, 0.013], [0, 0.082, -0.61 + i * 0.036], gold);
      box(group, [0.013, 0.008, 0.039], [i % 2 ? -0.14 : 0.14, 0.082, -0.592 + i * 0.036], gold);
    }
    box(group, [0.15, 0.045, 0.17], [0, 0.064, 0.24], black);
    for (let i = 0; i < 6; i++)
      box(
        group,
        [0.075, 0.02, 0.026],
        [i % 2 ? 0.18 : -0.18, 0.046, 0.04 + Math.floor(i / 2) * 0.12],
        silver,
      );
    // USB connector and the two tactile buttons.
    box(group, [0.23, 0.12, 0.18], [0, 0.084, 0.59], silver);
    box(group, [0.18, 0.073, 0.012], [0, 0.083, 0.686], black);
    for (const x of [-0.22, 0.22]) {
      box(group, [0.105, 0.05, 0.105], [x, 0.057, 0.48], silver);
      mesh(group, new T.CylinderGeometry(0.036, 0.036, 0.045, 12), black, [x, 0.1, 0.48]);
    }
    lettering(group, 'EN     BOOT', [0, 0.04, 0.37], 0.52);
    mesh(group, new T.SphereGeometry(0.026, 10, 8), led('#ff7a52'), [0.19, 0.055, 0.26]);
    mesh(group, new T.SphereGeometry(0.022, 10, 8), led('#58e0ff'), [-0.19, 0.055, 0.26]);
    // Separate relay/driver module.
    mesh(group, roundedSlab(0.43, 0.68, 0.04, 0.03), pcb, [0.67, -0.02, 0.18]);
    mesh(group, roundedSlab(0.33, 0.3, 0.25, 0.03), blue, [0.67, 0.02, 0.11]);
    lettering(group, 'RELAY', [0.67, 0.275, 0.11], 0.27);
    box(group, [0.34, 0.13, 0.14], [0.67, 0.09, 0.42], material('#4cb38a'));
    for (let i = 0; i < 3; i++) {
      mesh(group, new T.CylinderGeometry(0.035, 0.035, 0.022, 12), silver, [0.56 + i * 0.11, 0.165, 0.42]);
      box(group, [0.012, 0.01, 0.05], [0.56 + i * 0.11, 0.18, 0.42], graphite);
    }
    mesh(group, new T.SphereGeometry(0.02, 8, 6), led('#ff5a5a'), [0.82, 0.04, -0.08]);
    wire(
      group,
      [
        [0.25, 0.05, 0.18],
        [0.42, 0.23, 0.24],
        [0.57, 0.05, -0.08],
      ],
      '#e3bd57',
    );
    wire(
      group,
      [
        [0.27, 0.05, 0.05],
        [0.42, 0.2, 0.0],
        [0.6, 0.04, -0.12],
      ],
      '#d9533f',
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
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.012,
        bevelThickness: 0.008,
      }),
      material('#303a45'),
      [0, 0, 0],
    );
    // Sensing surface below the insertion mark; electronics stay above it.
    for (const x of [-0.1, 0.1]) box(group, [0.025, 0.7, 0.012], [x, -0.28, 0.047], gold);
    for (let i = 0; i < 8; i++)
      box(group, [0.17, 0.017, 0.012], [i % 2 ? -0.025 : 0.025, -0.58 + i * 0.075, 0.047], gold);
    box(group, [0.34, 0.03, 0.014], [0, 0.13, 0.048], white);
    box(group, [0.12, 0.11, 0.035], [0, 0.28, 0.058], silver);
    box(group, [0.065, 0.075, 0.028], [-0.095, 0.44, 0.058], black);
    mesh(group, new T.SphereGeometry(0.018, 8, 6), led('#7dff9a'), [0.1, 0.34, 0.06]);
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
        x < 0 ? '#e0533d' : x > 0 ? '#e8b84f' : '#38474d',
      );
    }
    const screw = mesh(group, new T.TorusGeometry(0.035, 0.012, 6, 12), gold, [0.1, 0.43, 0.047]);
    screw.rotation.z = 0.2;
  } else if (kind === 'valve') {
    // Brass body with threaded ends (pipe ends stay at x = ±0.43).
    tube(group, [-0.43, 0, 0], [0.43, 0, 0], 0.115, brass, 16);
    for (const x of [-0.3, 0.3]) {
      hex(group, 0.17, 0.16, [x, 0, 0], brassDark, 'x');
      for (let i = 0; i < 4; i++)
        ring(group, 0.119, 0.01, [Math.sign(x) * (0.36 + i * 0.022), 0, 0], 'x', brassDark, 16);
    }
    mesh(group, new T.SphereGeometry(0.2, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), brass, [0, 0.02, 0]);
    // Bonnet bolts and flow arrow.
    for (const [x, z] of [
      [-0.13, -0.13],
      [0.13, -0.13],
      [-0.13, 0.13],
      [0.13, 0.13],
    ])
      hex(group, 0.028, 0.03, [x, 0.17, z], silver);
    box(group, [0.22, 0.02, 0.05], [0, -0.02, 0.118], material('#f6f1e0'));
    mesh(group, new T.ConeGeometry(0.05, 0.08, 3), material('#f6f1e0'), [0.14, -0.02, 0.118]).rotation.z =
      -Math.PI / 2;
    // Solenoid coil with ribs, nut and DIN connector.
    mesh(group, new T.CylinderGeometry(0.14, 0.14, 0.32, 20), black, [0, 0.37, 0]);
    for (const y of [0.25, 0.49]) ring(group, 0.142, 0.014, [0, y, 0], 'y', graphite, 20);
    hex(group, 0.07, 0.07, [0, 0.56, 0], silver);
    mesh(group, new T.SphereGeometry(0.03, 10, 6), silver, [0, 0.6, 0]);
    box(group, [0.15, 0.17, 0.2], [0, 0.37, 0.2], graphite);
    box(group, [0.1, 0.06, 0.06], [0, 0.29, 0.3], black);
    // Manual bleed lever (red tab) on the bonnet.
    box(group, [0.06, 0.035, 0.16], [0.17, 0.18, -0.05], red);
    wire(
      group,
      [
        [0, 0.28, 0.32],
        [0.12, 0.22, 0.5],
        [0.36, -0.04, 0.46],
      ],
      '#56686c',
      0.02,
    );
  } else if (kind === 'pump') {
    // Base plate with feet and bolts.
    mesh(group, roundedSlab(1.1, 0.85, 0.08, 0.06), graphite, [0, -0.33, 0]);
    for (const x of [-0.4, 0.4])
      for (const z of [-0.3, 0.3]) {
        hex(group, 0.045, 0.04, [x, -0.23, z], silver);
        box(group, [0.12, 0.08, 0.6], [x, -0.21, 0], graphite);
      }
    // Motor body with cooling fins.
    tube(group, [-0.33, 0, 0], [0.33, 0, 0], 0.26, blue, 24);
    for (let i = 0; i < 8; i++)
      ring(group, 0.265, 0.02, [-0.29 + i * 0.08, 0, 0], 'x', material('#2c6fae'), 18);
    // Fan cover with grill at the back.
    tube(group, [-0.48, 0, 0], [-0.33, 0, 0], 0.25, graphite, 24);
    for (let i = 1; i < 4; i++) ring(group, i * 0.06, 0.01, [-0.485, 0, 0], 'x', silver, 20);
    // Volute head and pump connections (outlet top at x = 0.43, inlet ends at x = 0.76).
    tube(group, [0.33, 0, 0], [0.55, 0, 0], 0.31, blue, 28);
    ring(group, 0.31, 0.025, [0.33, 0, 0], 'x', silver, 28);
    ring(group, 0.31, 0.025, [0.55, 0, 0], 'x', silver, 28);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      hex(group, 0.025, 0.03, [0.56, Math.cos(a) * 0.26, Math.sin(a) * 0.26], silver, 'x');
    }
    tube(group, [0.43, 0, 0], [0.43, 0.48, 0], 0.095, pvc);
    ring(group, 0.11, 0.025, [0.43, 0.32, 0], 'y', pvc);
    tube(group, [0.53, 0, 0], [0.76, 0, 0], 0.095, pvc);
    ring(group, 0.11, 0.025, [0.68, 0, 0], 'x', pvc);
    hex(group, 0.05, 0.04, [0.47, 0.31, 0.2], brass, 'z');
    // Terminal box and switch.
    mesh(group, roundedSlab(0.32, 0.27, 0.16, 0.03), material('#e8e3cf'), [-0.05, 0.22, 0]);
    box(group, [0.08, 0.04, 0.06], [-0.05, 0.4, 0.06], red);
    mesh(group, new T.SphereGeometry(0.022, 8, 6), led('#7dff9a'), [-0.12, 0.39, 0.06]);
  } else if (kind === 'reservoir') {
    // Polyethylene tank with ribs, dome lid and outlet valve (outlet end at z = 0.96, y = 0.18).
    const body = new T.LatheGeometry(
      [
        new T.Vector2(0.001, 0),
        new T.Vector2(0.62, 0),
        new T.Vector2(0.69, 0.06),
        new T.Vector2(0.72, 0.4),
        new T.Vector2(0.72, 1.45),
        new T.Vector2(0.68, 1.6),
        new T.Vector2(0.45, 1.66),
        new T.Vector2(0.001, 1.66),
      ],
      40,
    );
    mesh(group, body, blue, [0, 0, 0]);
    for (const y of [0.32, 0.68, 1.04, 1.38])
      ring(group, 0.722, 0.03, [0, y, 0], 'y', material('#2e78ba'), 40);
    const dome = mesh(
      group,
      new T.SphereGeometry(0.46, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      material('#5aa9e6'),
      [0, 1.62, 0],
    );
    dome.scale.y = 0.38;
    mesh(group, new T.CylinderGeometry(0.2, 0.22, 0.08, 24), material('#2e78ba'), [0, 1.8, 0]);
    box(group, [0.26, 0.05, 0.06], [0, 1.86, 0], material('#2e78ba'));
    // Outlet: bulkhead, ball valve with red lever, PVC stub.
    tube(group, [0, 0.18, 0.66], [0, 0.18, 0.96], 0.09, pvc);
    hex(group, 0.13, 0.05, [0, 0.18, 0.72], material('#c8ccc4'), 'z');
    tube(group, [0, 0.18, 0.78], [0, 0.18, 0.9], 0.12, brass, 6);
    box(group, [0.05, 0.12, 0.05], [0, 0.29, 0.84], silver);
    box(group, [0.07, 0.04, 0.3], [0, 0.36, 0.94], red);
  } else {
    // Inline button dripper on a black PE lateral; drip outlet at (0, -0.055, 0.14).
    tube(group, [-0.36, 0, 0], [0.36, 0, 0], 0.04, black, 8);
    ring(group, 0.043, 0.008, [-0.12, 0, 0], 'x', graphite, 8);
    ring(group, 0.043, 0.008, [0.12, 0, 0], 'x', graphite, 8);
    mesh(group, new T.CylinderGeometry(0.1, 0.07, 0.07, 12), material('#2f5f9e'), [0, 0.065, 0]);
    mesh(group, new T.CylinderGeometry(0.105, 0.105, 0.035, 12), material('#4aa3e8'), [0, 0.115, 0]);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      box(
        group,
        [0.02, 0.012, 0.05],
        [Math.cos(a) * 0.07, 0.137, Math.sin(a) * 0.07],
        material('#2f5f9e'),
      ).rotation.y = -a;
    }
    tube(group, [0, 0.075, 0], [0, 0.075, 0.14], 0.026, black, 6);
    tube(group, [0, 0.075, 0.14], [0, -0.04, 0.14], 0.025, black, 6);
    mesh(group, new T.ConeGeometry(0.03, 0.03, 8), material('#4aa3e8'), [0, -0.055, 0.14]).rotation.x =
      Math.PI;
  }
  return bake(group, { width: 0.0014 });
}

/** Box with rounded vertical edges, sitting on y = 0. */
function roundedSlab(width: number, depth: number, height: number, radius: number) {
  const shape = new T.Shape();
  const w = width / 2 - radius,
    d = depth / 2 - radius;
  shape.moveTo(-w, -d - radius);
  shape.lineTo(w, -d - radius);
  shape.quadraticCurveTo(w + radius, -d - radius, w + radius, -d);
  shape.lineTo(w + radius, d);
  shape.quadraticCurveTo(w + radius, d + radius, w, d + radius);
  shape.lineTo(-w, d + radius);
  shape.quadraticCurveTo(-w - radius, d + radius, -w - radius, d);
  shape.lineTo(-w - radius, -d);
  shape.quadraticCurveTo(-w - radius, -d - radius, -w, -d - radius);
  const geometry = new T.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 4 });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}
export { roundedSlab };

export function disposeScene(scene: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>(),
    textures = new Set<T.Texture>();
  scene.traverse((object) => {
    if (!(object instanceof T.Mesh)) return;
    geometries.add(object.geometry);
    for (const mat of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(mat);
      for (const value of Object.values(mat))
        if (value instanceof T.Texture && !value.userData.shared) textures.add(value);
    }
  });
  if (scene instanceof T.Scene && scene.background instanceof T.Texture) textures.add(scene.background);
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}
