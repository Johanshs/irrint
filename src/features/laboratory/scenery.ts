import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { bake, ink, toon } from './toon';
import { mesh, roundedSlab } from './models';
import {
  clusterTexture,
  fanTexture,
  foliageDepth,
  foliageMaterial,
  groundTexture,
  leafCore,
  leafFillTexture,
  leafMass,
  palettes,
  random,
} from './foliage';

/**
 * Decorative surroundings inspired by Roraima: lavrado (savanna) with caimbé trees,
 * buriti palms along a vereda, a gallery-forest tree line and a flat-topped tepui on the
 * horizon. Static and non-interactive; tagged `decor` parts are dropped in light mode.
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

/** Flat colour used instead of the texture in light mode (texture sampling is costly on CPU renderers). */
function lite<M extends T.Material>(material: M, color: string) {
  material.userData.liteColor = color;
  return material;
}

/** Collects leaf cards and cores of several crowns so a whole tree is two draw calls. */
class Crown {
  cards: T.BufferGeometry[] = [];
  cores: T.BufferGeometry[] = [];
  mass(center: T.Vector3, radius: T.Vector3, cards: number, rnd: () => number) {
    this.cards.push(leafMass(center, radius, cards, rnd));
    this.cores.push(leafCore(center, radius));
  }
  build(parent: T.Object3D, palette: keyof typeof palettes, shadows: boolean) {
    const cardTexture = clusterTexture(palette);
    const cards = new T.Mesh(mergeGeometries(this.cards)!, foliageMaterial(cardTexture));
    cards.customDepthMaterial = foliageDepth(cardTexture);
    const cores = new T.Mesh(
      mergeGeometries(this.cores)!,
      toon('#ffffff', { map: leafFillTexture(palette), noInk: true }),
    );
    this.cards.concat(this.cores).forEach((g) => g.dispose());
    for (const part of [cards, cores]) {
      part.castShadow = shadows;
      part.receiveShadow = true;
      parent.add(part);
    }
  }
}

/** Twisted trunk as a tube along a curve, with bark texture. */
function limb(points: T.Vector3[], radius: number, bark: T.Material, parent: T.Object3D) {
  const curve = new T.CatmullRomCurve3(points);
  const geometry = new T.TubeGeometry(curve, 10, radius, 7, false);
  // Taper towards the tip.
  const position = geometry.getAttribute('position');
  const v = new T.Vector3(),
    p = new T.Vector3();
  for (let i = 0; i < position.count; i++) {
    const t = Math.floor(i / 8) / 10;
    v.fromBufferAttribute(position, i);
    curve.getPointAt(Math.min(1, t), p);
    v.sub(p)
      .multiplyScalar(1 - t * 0.55)
      .add(p);
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return mesh(parent, geometry, bark, [0, 0, 0]);
}

/** Caimbé (Curatella americana), the twisted, round-crowned tree of the lavrado. */
export function caimbe(seed: number, size = 1, detailed = true) {
  const rnd = random(seed);
  const group = new T.Group();
  const bark = toon('#ffffff', { map: groundTexture('bark', 1) });
  const lean = rnd() * Math.PI * 2;
  const dir = new T.Vector3(Math.cos(lean), 0, Math.sin(lean));
  const top = new T.Vector3(0, 1.15 * size, 0).addScaledVector(dir, 0.18 * size);
  limb(
    [
      new T.Vector3(0, 0, 0),
      new T.Vector3(0, 0.45 * size, 0).addScaledVector(dir, -0.08 * size),
      new T.Vector3(0, 0.85 * size, 0).addScaledVector(dir, 0.12 * size),
      top,
    ],
    0.09 * size,
    bark,
    group,
  );
  const crown = new Crown();
  const branches = detailed ? 3 : 2;
  for (let i = 0; i < branches; i++) {
    const a = lean + (i / branches) * Math.PI * 2 + rnd() * 0.6;
    const out = new T.Vector3(Math.cos(a), 0, Math.sin(a));
    const end = top
      .clone()
      .addScaledVector(out, (0.45 + rnd() * 0.15) * size)
      .add(new T.Vector3(0, (0.3 + rnd() * 0.2) * size, 0));
    limb(
      [
        top,
        top
          .clone()
          .lerp(end, 0.5)
          .add(new T.Vector3(0, 0.08 * size, 0)),
        end,
      ],
      0.045 * size,
      bark,
      group,
    );
    const r = (0.48 + rnd() * 0.12) * size;
    crown.mass(
      end.clone().add(new T.Vector3(0, 0.12 * size, 0)),
      new T.Vector3(r, r * 0.72, r),
      detailed ? 22 : 10,
      rnd,
    );
  }
  crown.mass(
    top.clone().add(new T.Vector3(0, 0.62 * size, 0)),
    new T.Vector3(0.55 * size, 0.42 * size, 0.55 * size),
    detailed ? 22 : 10,
    rnd,
  );
  bake(group, { ink: detailed, width: 0.0012 });
  crown.build(group, 'savanna', detailed);
  return group;
}

/** Low leafy shrub (murici-like). */
export function shrub(seed: number, size = 1) {
  const rnd = random(seed);
  const group = new T.Group();
  const crown = new Crown();
  const masses = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < masses; i++) {
    const a = rnd() * Math.PI * 2;
    const r = (0.26 + rnd() * 0.1) * size;
    crown.mass(
      new T.Vector3(Math.cos(a) * 0.2 * size, r * 0.7, Math.sin(a) * 0.2 * size),
      new T.Vector3(r, r * 0.8, r),
      14,
      rnd,
    );
  }
  crown.build(group, 'bush', true);
  return group;
}

/** Buriti (Mauritia flexuosa): tall smooth trunk, crown of pleated fan leaves, dry skirt. */
export function buriti(height: number, seed: number, detailed = true) {
  const rnd = random(seed);
  const group = new T.Group();
  const bark = groundTexture('bark', 1).clone();
  bark.repeat.set(1, height * 1.5);
  bark.userData.shared = false;
  bark.needsUpdate = true;
  const trunk = mesh(group, new T.CylinderGeometry(0.09, 0.12, height, 9), toon('#ffffff', { map: bark }), [
    0,
    height / 2,
    0,
  ]);
  trunk.castShadow = detailed;
  const crown = new T.Vector3(0, height, 0);
  // Boot of old leaf bases under the crown.
  mesh(group, new T.CylinderGeometry(0.16, 0.1, 0.32, 9), toon('#8a7350'), [0, height - 0.1, 0]);
  const petioles: T.BufferGeometry[] = [],
    fans: T.BufferGeometry[] = [],
    dry: T.BufferGeometry[] = [];
  const fan = (target: T.BufferGeometry[], yaw: number, pitch: number, length: number, scale: number) => {
    const d = new T.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    );
    const tip = crown.clone().addScaledVector(d, length);
    if (length > 0.05) {
      const stalk = new T.CylinderGeometry(0.016, 0.024, length, 5).translate(0, length / 2, 0);
      stalk.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d));
      stalk.translate(crown.x, crown.y, crown.z);
      petioles.push(stalk);
    }
    // Curved blade (bends back along its length) with a random roll around its own axis,
    // so the crown keeps volume from every viewing angle instead of reading as flat discs.
    const blade = new T.PlaneGeometry(scale, scale, 2, 5).translate(0, scale / 2, 0);
    const bend = blade.getAttribute('position');
    for (let k = 0; k < bend.count; k++) {
      const t = bend.getY(k) / scale;
      bend.setZ(k, -0.45 * t * t * scale + Math.abs(bend.getX(k)) * 0.35);
    }
    blade.rotateY((rnd() - 0.5) * 1.8);
    const droop = pitch - 0.35;
    blade.applyQuaternion(new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2 - droop, yaw, 0, 'YXZ')));
    blade.translate(tip.x, tip.y, tip.z);
    const position = blade.getAttribute('position'),
      normal = blade.getAttribute('normal');
    const v = new T.Vector3();
    for (let k = 0; k < position.count; k++) {
      v.fromBufferAttribute(position, k).sub(crown).normalize();
      v.y = v.y * 0.6 + 0.4;
      v.normalize();
      normal.setXYZ(k, v.x, v.y, v.z);
    }
    target.push(blade);
  };
  const leaves = detailed ? 13 : 9;
  for (let i = 0; i < leaves; i++) {
    const yaw = (i / leaves) * Math.PI * 2 + rnd() * 0.35;
    const upright = i % 3 === 0;
    fan(fans, yaw, upright ? 0.9 + rnd() * 0.3 : 0.25 + rnd() * 0.35, 0.45 + rnd() * 0.2, 1.05 + rnd() * 0.3);
  }
  for (let i = 0; i < (detailed ? 6 : 3); i++) fan(dry, (i / 6) * Math.PI * 2 + 0.4, -1.05, 0.05, 0.85);
  const fanTex = fanTexture(false),
    dryTex = fanTexture(true);
  const leafMesh = new T.Mesh(mergeGeometries(fans)!, foliageMaterial(fanTex));
  leafMesh.customDepthMaterial = foliageDepth(fanTex);
  const dryMesh = new T.Mesh(mergeGeometries(dry)!, foliageMaterial(dryTex));
  dryMesh.customDepthMaterial = foliageDepth(dryTex);
  const stalks = new T.Mesh(mergeGeometries(petioles)!, toon('#7aa04a', { noInk: true }));
  [...fans, ...dry, ...petioles].forEach((g) => g.dispose());
  for (const part of [leafMesh, dryMesh, stalks]) {
    part.castShadow = detailed;
    part.receiveShadow = true;
    group.add(part);
  }
  if (detailed)
    for (const yaw of [0.8, 3.6])
      for (let k = 0; k < 7; k++) {
        const a = k * 2.4;
        mesh(group, new T.SphereGeometry(0.042, 6, 4), toon('#8a3b22', { noInk: true }), [
          Math.sin(yaw) * 0.18 + Math.cos(a) * 0.05,
          height - 0.2 - k * 0.025,
          Math.cos(yaw) * 0.18 + Math.sin(a) * 0.05,
        ]);
      }
  return group;
}

function tepui(width: number, height: number, depth: number, seed: number) {
  const rnd = random(seed);
  const shape = new T.Shape();
  const left = -width / 2,
    right = width / 2;
  shape.moveTo(left - 3, 0);
  shape.lineTo(left - 1.2, height * 0.35);
  shape.lineTo(left - 0.4, height * 0.45);
  shape.lineTo(left, height);
  for (let i = 1; i < 9; i++) shape.lineTo(left + (i / 9) * width, height - rnd() * 0.25);
  shape.lineTo(right, height);
  shape.lineTo(right + 0.6, height * 0.5);
  shape.lineTo(right + 1.4, height * 0.38);
  shape.lineTo(right + 3, 0);
  shape.lineTo(left - 3, 0);
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
    toon('#ffffff', { map: groundTexture('rock', 0.18) }),
    [0, 0, -depth / 2],
  );
  const top = mesh(
    group,
    new T.BoxGeometry(width - 0.4, 0.3, depth - 0.6),
    toon('#ffffff', { map: groundTexture('lawn', 0.4) }),
    [0, height + 0.1, 0],
  );
  for (const part of [rock, top]) part.castShadow = false;
  ink(rock, 0.0006, '#55606f');
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

/** Grass tuft texture: blades fanning out from the bottom centre (alpha-tested). */
function tuftTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const rnd = random(77);
  for (let i = 0; i < 22; i++) {
    const a = -0.9 + (i / 21) * 1.8 + (rnd() - 0.5) * 0.2;
    const h = 70 + rnd() * 50;
    const x = 64 + (rnd() - 0.5) * 16;
    context.fillStyle = ['#6fae45', '#8cc552', '#a9c95a', '#c9c868'][i % 4];
    context.beginPath();
    context.moveTo(x - 4, 128);
    context.quadraticCurveTo(x + Math.sin(a) * h * 0.4, 128 - h * 0.6, x + Math.sin(a) * h, 128 - h);
    context.quadraticCurveTo(x + Math.sin(a) * h * 0.4 + 4, 128 - h * 0.55, x + 4, 128);
    context.fill();
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

/** Island and plain layout. Footprints kept clear so nothing intersects the equipment. */
const islandTrees: [number, number, number, number][] = [[4.75, -3.15, 1.0, 41]];
const islandShrubs: [number, number, number, number][] = [
  [-5.05, 3.3, 1.0, 5],
  [-5.1, -3.35, 0.85, 9],
  [4.95, 1.0, 0.8, 12],
  [1.0, -3.5, 0.75, 17],
  [0.3, 3.5, 0.7, 23],
];
const rocks: [number, number, number][] = [
  [4.95, 3.25, 0.26],
  [5.15, 2.85, 0.16],
  [-5.2, -1.4, 0.18],
  [4.35, -1.25, 0.19],
];

export function createScenery(scene: T.Scene) {
  const rnd = random(2026);
  const static_ = new T.Group();
  scene.add(static_);
  // Lavrado plain below, and the raised diorama plot with a lawn top and layered earth sides.
  const plain = mesh(
    scene,
    new T.CircleGeometry(80, 48),
    lite(toon('#ffffff', { map: groundTexture('lavrado', 36) }), '#b3c072'),
    [0, -1.6, 0],
  );
  plain.rotation.x = -Math.PI / 2;
  plain.castShadow = false;
  mesh(
    static_,
    roundedSlab(10.9, 7.7, 0.14, 0.45),
    lite(toon('#ffffff', { map: groundTexture('lawn', 0.45) }), '#79c257'),
    [0, -0.77, 0],
  );
  mesh(
    static_,
    roundedSlab(10.7, 7.5, 0.83, 0.4),
    lite(toon('#ffffff', { map: groundTexture('dirt', 0.5) }), '#9a6b43'),
    [0, -1.6, 0],
  );
  mesh(static_, roundedSlab(10.76, 7.56, 0.1, 0.43), toon('#7c5233'), [0, -1.3, 0]);
  // Stepping stones on the walkway between the two beds.
  const stone = toon('#c5c2b6');
  for (let i = 0; i < 7; i++) {
    const s = mesh(static_, new T.SphereGeometry(0.15 + rnd() * 0.03, 10, 6), stone, [
      -1.8 + i * 0.83,
      -0.63,
      (rnd() - 0.5) * 0.08,
    ]);
    s.scale.y = 0.22;
  }
  for (const [x, z, r] of rocks) {
    const rock = mesh(static_, new T.DodecahedronGeometry(r, 0), toon('#a7a294'), [x, -0.63 + r * 0.35, z]);
    rock.rotation.set(rnd(), rnd() * 3, rnd());
  }
  bake(static_, { width: 0.0012 });

  for (const [x, z, s, seed] of islandTrees) {
    const tree = caimbe(seed, s);
    tree.position.set(x, -0.63, z);
    tree.userData.decor = true;
    scene.add(tree);
  }
  for (const [x, z, s, seed] of islandShrubs) {
    const bush = shrub(seed, s);
    bush.position.set(x, -0.63, z);
    bush.userData.decor = true;
    scene.add(bush);
  }

  // Keep-out zones: equipment pad, beds, signs, rocks, trees and shrubs.
  const clear = (x: number, z: number, margin: number) =>
    !(x > -5.1 - margin && x < -2.85 + margin) &&
    !(x > -2.45 - margin && x < 3.75 + margin && Math.abs(z) < 3.1 + margin) &&
    ![...rocks.map(([rx, rz, r]) => [rx, rz, r]), ...islandShrubs.map(([sx, sz, s]) => [sx, sz, 0.5 * s])]
      .concat(islandTrees.map(([tx, tz]) => [tx, tz, 0.25]))
      .concat([
        [4.05, -0.75, 0.3],
        [4.05, 2.65, 0.3],
      ])
      .some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + margin);

  // Grass tufts as crossed alpha cards (two draw calls for the whole scene).
  const tuft = new T.PlaneGeometry(0.4, 0.4).translate(0, 0.2, 0);
  const crossed = mergeGeometries([tuft.clone(), tuft.clone().rotateY(Math.PI / 2)])!;
  tuft.dispose();
  const normals = crossed.getAttribute('normal');
  for (let i = 0; i < normals.count; i++) normals.setXYZ(i, 0, 1, 0);
  const grassTexture = tuftTexture();
  const matrices: T.Matrix4[] = [];
  const place = (x: number, y: number, z: number, s: number) =>
    matrices.push(
      new T.Matrix4().compose(
        new T.Vector3(x, y, z),
        new T.Quaternion().setFromEuler(new T.Euler(0, rnd() * 3, 0)),
        new T.Vector3(s, s * (0.8 + rnd() * 0.4), s),
      ),
    );
  for (let i = 0; i < 160 && matrices.length < 60; i++) {
    const x = -5.3 + rnd() * 10.6,
      z = -3.7 + rnd() * 7.4;
    if (clear(x, z, 0.12)) place(x, -0.63, z, 0.6 + rnd() * 0.35);
  }
  // Small clumps on the plain, denser near the plot, sparse towards the horizon.
  for (let i = 0; i < 130; i++) {
    const a = rnd() * Math.PI * 2,
      r = 7.2 + Math.pow(rnd(), 1.6) * 26;
    const cx = Math.cos(a) * r,
      cz = Math.sin(a) * r * 0.9;
    for (let k = 0; k < 3; k++)
      place(cx + (rnd() - 0.5) * 0.7, -1.6, cz + (rnd() - 0.5) * 0.7, 0.75 + rnd() * 0.5);
  }
  const grass = new T.InstancedMesh(crossed, foliageMaterial(grassTexture), matrices.length);
  matrices.forEach((m, i) => grass.setMatrixAt(i, m));
  grass.receiveShadow = true;
  grass.computeBoundingSphere();
  grass.userData.decor = true;
  scene.add(grass);

  // Plain: scattered caimbés, a vereda of buritis and a gallery-forest line behind it.
  const plainTrees: [number, number, number, number][] = [
    [-9.5, 2.5, 1.5, 3],
    [11, -4, 1.3, 7],
    [-12, -8, 1.6, 11],
    [8.5, 7, 1.2, 19],
    [-7.5, 9.5, 1.4, 29],
    [15, 3, 1.5, 31],
  ];
  for (const [x, z, s, seed] of plainTrees) {
    const tree = caimbe(seed, s, false);
    tree.position.set(x, -1.6, z);
    tree.userData.decor = true;
    scene.add(tree);
  }
  const palms: [number, number, number][] = [
    [-9, -11.5, 3.6],
    [-6.6, -13.5, 4.2],
    [-11.8, -14, 3.1],
    [-3.5, -14.8, 3.8],
    [9.5, -12.5, 3.8],
    [12.4, -10, 3.2],
    [14.8, -14.5, 4.4],
    [5.8, -15.5, 3.4],
  ];
  palms.forEach(([x, z, h], i) => {
    const palm = buriti(h, 11 + i * 7, i % 2 === 0);
    palm.position.set(x, -1.6, z);
    palm.rotation.y = i * 1.3;
    palm.traverse((o) => (o.castShadow = false));
    palm.userData.decor = true;
    scene.add(palm);
  });
  const forest = new Crown();
  const forestRnd = random(404);
  for (let i = 0; i < 26; i++) {
    const x = -24 + i * 1.9 + (forestRnd() - 0.5),
      z = -19 - Math.sin(i * 0.7) * 1.6 - forestRnd() * 1.5;
    const r = 1.3 + forestRnd() * 0.7;
    forest.mass(new T.Vector3(x, -1.6 + r * 0.9, z), new T.Vector3(r, r * 0.9, r), 7, forestRnd);
  }
  const treeline = new T.Group();
  forest.build(treeline, 'canopy', false);
  treeline.userData.decor = true;
  scene.add(treeline);

  // Tepuis (Monte Roraima-like silhouettes) on the horizon, then clouds.
  const big = tepui(22, 8, 6, 5);
  big.position.set(-8, -1.6, -46);
  scene.add(big);
  const small = tepui(10, 6, 4, 9);
  small.position.set(20, -1.6, -42);
  scene.add(small);
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
