import * as T from 'three';
import { bake, ink, toon } from './toon';
import { mesh, roundedSlab } from './models';

/**
 * Decorative surroundings inspired by Roraima: lavrado (savanna) grass, buriti palms in a
 * vereda and a flat-topped tepui on the horizon. Static and non-interactive.
 */
export const skyHorizon = '#cdeaf3';

export function createSky() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#4fa8ea');
  gradient.addColorStop(0.55, '#9fd6f4');
  gradient.addColorStop(0.8, skyHorizon);
  gradient.addColorStop(1, '#eef6df');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 4, 256);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

function random(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function fanGeometry() {
  // Buriti palm leaf: a round fan with many pointed segments, opening along +z.
  const shape = new T.Shape();
  shape.moveTo(0, 0);
  const tips = 11;
  for (let i = 0; i <= tips * 2; i++) {
    const a = -1.5 + (i / (tips * 2)) * 3;
    const r = i % 2 ? 0.78 : 1;
    shape.lineTo(Math.sin(a) * r, Math.cos(a) * r);
  }
  shape.lineTo(0, 0);
  const geometry = new T.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false });
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export function buriti(height: number, seed: number, detailed = true) {
  const rnd = random(seed);
  const group = new T.Group();
  const trunk = toon('#8f8172'),
    rings = toon('#6f6458'),
    frond = toon('#4f9e45'),
    frondLight = toon('#6db751'),
    petiole = toon('#7aa04a'),
    dry = toon('#b98d4f'),
    fruit = toon('#8a3b22');
  mesh(group, new T.CylinderGeometry(0.1, 0.13, height, 10), trunk, [0, height / 2, 0]);
  for (let y = 0.25; y < height - 0.2; y += detailed ? 0.22 : 0.4) {
    const ring = mesh(group, new T.TorusGeometry(0.115, 0.022, 4, 8), rings, [0, y, 0]);
    ring.rotation.x = Math.PI / 2;
  }
  const fan = fanGeometry();
  const crown = new T.Vector3(0, height, 0);
  const place = (object: T.Object3D, yaw: number, pitch: number) => {
    object.rotation.order = 'YXZ';
    object.rotation.set(-pitch, yaw, 0);
  };
  for (let i = 0; i < 11; i++) {
    const yaw = (i / 11) * Math.PI * 2 + rnd() * 0.3;
    const pitch = 0.35 + rnd() * 0.6;
    const length = 0.55 + rnd() * 0.25;
    const stalk = mesh(
      group,
      new T.CylinderGeometry(0.018, 0.026, length, 5).translate(0, length / 2, 0),
      petiole,
      [0, height, 0],
    );
    stalk.quaternion.setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      new T.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)),
    );
    const tip = crown
      .clone()
      .add(
        new T.Vector3(
          Math.sin(yaw) * Math.cos(pitch),
          Math.sin(pitch),
          Math.cos(yaw) * Math.cos(pitch),
        ).multiplyScalar(length),
      );
    const leaf = mesh(group, fan, i % 2 ? frond : frondLight, [tip.x, tip.y, tip.z]);
    place(leaf, yaw, pitch - 0.55);
    leaf.scale.setScalar(0.62 + rnd() * 0.2);
  }
  // Skirt of dry leaves and two hanging fruit bunches, typical of buriti.
  for (let i = 0; i < 6; i++) {
    const yaw = (i / 6) * Math.PI * 2 + 0.3;
    const leaf = mesh(group, fan, dry, [Math.sin(yaw) * 0.12, height - 0.1, Math.cos(yaw) * 0.12]);
    place(leaf, yaw, -1.25);
    leaf.scale.setScalar(0.45);
  }
  for (const yaw of [0.8, 3.6]) {
    for (let k = 0; k < (detailed ? 8 : 4); k++) {
      const a = k * 2.4;
      mesh(group, new T.SphereGeometry(0.045, 5, 4), fruit, [
        Math.sin(yaw) * 0.2 + Math.cos(a) * 0.05,
        height - 0.12 - k * 0.025,
        Math.cos(yaw) * 0.2 + Math.sin(a) * 0.05,
      ]);
    }
  }
  return bake(group, { width: 0.0014, ink: detailed });
}

function tepui(width: number, height: number, depth: number, seed: number) {
  const rnd = random(seed);
  const shape = new T.Shape();
  shape.moveTo(-width / 2 - 3, 0);
  const steps = 9;
  const left = -width / 2,
    right = width / 2;
  shape.lineTo(left - 1.2, height * 0.35);
  shape.lineTo(left - 0.4, height * 0.45);
  shape.lineTo(left, height);
  for (let i = 1; i < steps; i++) shape.lineTo(left + (i / steps) * width, height - rnd() * 0.25);
  shape.lineTo(right, height);
  shape.lineTo(right + 0.6, height * 0.5);
  shape.lineTo(right + 1.4, height * 0.38);
  shape.lineTo(right + 3, 0);
  shape.lineTo(-width / 2 - 3, 0);
  const group = new T.Group();
  const rock = mesh(
    group,
    new T.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.4,
      bevelThickness: 0.6,
      bevelSegments: 1,
    }),
    toon('#8a9aad'),
    [0, 0, -depth / 2],
  );
  rock.castShadow = false;
  const top = mesh(group, new T.BoxGeometry(width - 0.4, 0.3, depth - 0.6), toon('#729f78'), [
    0,
    height + 0.1,
    0,
  ]);
  top.castShadow = false;
  // Waterfall ribbon on the cliff.
  const fall = mesh(group, new T.PlaneGeometry(0.5, height * 0.8), toon('#e8f6ff', { noInk: true }), [
    width * 0.18,
    height * 0.55,
    depth / 2 + 0.62,
  ]);
  fall.castShadow = false;
  return group;
}

function cloud(seed: number) {
  const rnd = random(seed);
  const group = new T.Group();
  const white = toon('#ffffff', { noInk: true, emissive: '#d8ecf7', emissiveIntensity: 0.55 });
  const puffs = 5 + Math.floor(rnd() * 3);
  for (let i = 0; i < puffs; i++) {
    const r = 0.9 + rnd() * 0.9;
    const puff = mesh(group, new T.SphereGeometry(r, 10, 7), white, [
      i * 1.1 - puffs * 0.55,
      rnd() * 0.6,
      rnd() * 0.8,
    ]);
    puff.scale.y = 0.75;
    puff.castShadow = false;
  }
  return bake(group, { ink: false });
}

/** Builds plain, island (diorama base), grass, palms, mountains and clouds. */
export function createScenery(scene: T.Scene) {
  const rnd = random(2026);
  const static_ = new T.Group();
  scene.add(static_);
  // Lavrado plain far below the plot, and the raised diorama plot itself.
  const plain = mesh(scene, new T.CircleGeometry(80, 48), toon('#c4c97c'), [0, -1.6, 0]);
  plain.rotation.x = -Math.PI / 2;
  plain.castShadow = false;
  mesh(static_, roundedSlab(10.9, 7.7, 0.14, 0.45), toon('#7cc35a'), [0, -0.77, 0]);
  mesh(static_, roundedSlab(10.7, 7.5, 0.83, 0.4), toon('#9a6b43'), [0, -1.6, 0]);
  mesh(static_, roundedSlab(10.76, 7.56, 0.12, 0.43), toon('#7c5233'), [0, -1.3, 0]);
  // Stepping stones on the walkway between the two beds.
  const stone = toon('#c5c2b6');
  for (let i = 0; i < 7; i++) {
    const s = mesh(static_, new T.SphereGeometry(0.15 + rnd() * 0.04, 10, 6), stone, [
      -1.8 + i * 0.83,
      -0.63,
      (rnd() - 0.5) * 0.12,
    ]);
    s.scale.y = 0.25;
  }
  for (const [x, z, r] of [
    [4.9, 3.2, 0.28],
    [5.0, 2.8, 0.17],
    [-5.2, -3.4, 0.22],
    [4.3, -1.2, 0.2],
  ]) {
    const rock = mesh(static_, new T.DodecahedronGeometry(r, 0), toon('#a7a294'), [x, -0.63 + r * 0.4, z]);
    rock.rotation.set(rnd(), rnd() * 3, rnd());
  }
  bake(static_);

  // Grass tufts: on the plot edges and across the plain.
  const blade = new T.ConeGeometry(0.035, 0.28, 4).translate(0, 0.14, 0);
  const tufts = new Map<string, T.Matrix4[]>();
  const add = (color: string, m: T.Matrix4) => {
    const list = tufts.get(color) ?? [];
    list.push(m);
    tufts.set(color, list);
  };
  const tuft = (x: number, y: number, z: number, scale: number) => {
    for (let i = 0; i < 4; i++) {
      const q = new T.Quaternion().setFromEuler(
        new T.Euler((rnd() - 0.5) * 0.7, rnd() * 3, (rnd() - 0.5) * 0.7),
      );
      add(
        i % 2 ? '#8fc04f' : '#c9c35b',
        new T.Matrix4().compose(
          new T.Vector3(x + (rnd() - 0.5) * 0.08 * scale, y, z + (rnd() - 0.5) * 0.08 * scale),
          q,
          new T.Vector3(scale, scale * (0.7 + rnd() * 0.6), scale),
        ),
      );
    }
  };
  const blocked = (x: number, z: number) =>
    (x > -5.15 && x < -2.8) || (x > -2.5 && x < 3.8 && Math.abs(z) < 3.12);
  for (let i = 0; i < 70; i++) {
    const x = -5.2 + rnd() * 10.4,
      z = -3.6 + rnd() * 7.2;
    if (!blocked(x, z)) tuft(x, -0.63, z, 0.9 + rnd() * 0.5);
  }
  for (let i = 0; i < 260; i++) {
    const a = rnd() * Math.PI * 2,
      r = 7 + rnd() * 26;
    tuft(Math.cos(a) * r, -1.6, Math.sin(a) * r * 0.9, 1.4 + rnd() * 1.4);
  }
  const flowers = new T.InstancedMesh(new T.SphereGeometry(0.05, 6, 4), toon('#fff3a6'), 24);
  for (let i = 0; i < 24; i++) {
    let x = 0,
      z = 0;
    do {
      x = -5.2 + rnd() * 10.4;
      z = -3.6 + rnd() * 7.2;
    } while (blocked(x, z));
    flowers.setMatrixAt(i, new T.Matrix4().makeTranslation(x, -0.55, z));
  }
  flowers.userData.decor = true;
  scene.add(flowers);
  for (const [color, matrices] of tufts) {
    const grass = new T.InstancedMesh(blade, toon(color), matrices.length);
    matrices.forEach((m, i) => grass.setMatrixAt(i, m));
    grass.receiveShadow = true;
    grass.computeBoundingSphere();
    grass.userData.decor = true;
    scene.add(grass);
  }

  // Buriti palms: two on the plot, a vereda on the plain.
  const palms: [number, number, number, number][] = [
    [4.6, -0.63, -3.0, 3.3],
    [-5.0, -0.63, 3.15, 2.4],
    [-9, -1.6, -11, 3.6],
    [-7.2, -1.6, -13.5, 4.2],
    [-11.5, -1.6, -14, 3.1],
    [9.5, -1.6, -12.5, 3.8],
    [12, -1.6, -9, 3.2],
    [14.5, -1.6, -15, 4.4],
    [-15, -1.6, -6, 3.5],
  ];
  palms.forEach(([x, y, z, h], i) => {
    const palm = buriti(h, 11 + i * 7, i < 2);
    palm.position.set(x, y, z);
    palm.rotation.y = i * 1.3;
    if (i > 1) {
      palm.traverse((o) => (o.castShadow = false));
      palm.userData.decor = true;
    }
    scene.add(palm);
  });
  // Low rolling hills, then the tepuis (Monte Roraima-like silhouettes) on the horizon.
  const hill = toon('#9dbd5f');
  for (const [x, z, sx, sy] of [
    [-20, -24, 9, 2.2],
    [-4, -27, 11, 1.8],
    [14, -23, 8, 2.4],
    [26, -15, 7, 1.6],
    [-28, -10, 8, 2],
  ]) {
    const h = mesh(scene, new T.SphereGeometry(1, 20, 10), hill, [x, -1.6, z]);
    h.scale.set(sx, sy, sx * 0.6);
    h.castShadow = false;
    ink(h, 0.0008, '#5a7240');
  }
  const big = tepui(22, 8, 6, 5);
  big.position.set(-8, -1.6, -44);
  scene.add(big);
  const small = tepui(10, 6, 4, 9);
  small.position.set(20, -1.6, -40);
  scene.add(small);
  for (const group of [big, small]) {
    const meshes: T.Mesh[] = [];
    group.traverse((o) => {
      if (o instanceof T.Mesh && !(o.material as T.Material).userData.noInk) meshes.push(o);
    });
    meshes.forEach((o) => ink(o, 0.0007, '#4f5a68'));
  }
  for (const [x, y, z, s, seed] of [
    [-14, 11, -30, 1.4, 3],
    [6, 13, -34, 1.8, 8],
    [22, 10, -26, 1.2, 15],
    [-30, 9, -18, 1.5, 21],
  ]) {
    const c = cloud(seed);
    c.position.set(x, y, z);
    c.scale.setScalar(s);
    c.userData.decor = true;
    scene.add(c);
  }
}
