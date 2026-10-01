import * as T from 'three';
import { ink, toon } from './toon';

/**
 * Illustrative crops common in Roraima. They are decoration only: the simulation does not
 * model plant growth, species, uptake or yield, and the zone's `crop` text may differ.
 *
 * - Hortaliças (área N): cheiro-verde, pimenta-de-cheiro and melancia.
 * - Mudas (área S): bananeira, açaizeiro and cupuaçuzeiro.
 */
export type CropKind = 'cheiro-verde' | 'pimenta' | 'melancia' | 'banana' | 'acai' | 'cupuacu';
export const zoneCrops: Record<string, CropKind[]> = {
  north: ['cheiro-verde', 'pimenta', 'melancia'],
  south: ['banana', 'acai', 'cupuacu'],
};
export const cropNames: Record<CropKind, string> = {
  'cheiro-verde': 'cheiro-verde',
  pimenta: 'pimenta-de-cheiro',
  melancia: 'melancia',
  banana: 'bananeira',
  acai: 'açaí',
  cupuacu: 'cupuaçu',
};

type GeometryKey = 'leaf' | 'lobed' | 'blade' | 'stem' | 'ball';
type MaterialKey =
  | 'leaf'
  | 'leafDark'
  | 'leafLight'
  | 'banana'
  | 'pseudostem'
  | 'flush'
  | 'wood'
  | 'vine'
  | 'melon'
  | 'red'
  | 'yellow'
  | 'orange'
  | 'flower';

function leafGeometry() {
  // Lens-shaped blade: length 1 along +z, width 1 across x, thickness 0.1.
  const shape = new T.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.55, 0.2, 0.45, 0.75, 0, 1);
  shape.bezierCurveTo(-0.45, 0.75, -0.55, 0.2, 0, 0);
  // Low segment count on purpose: hundreds of these are instanced (and drawn again for ink/shadow).
  const geometry = new T.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false, curveSegments: 3 });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0.05, 0);
  return geometry;
}
function lobedGeometry() {
  // Watermelon leaf: deeply lobed, lying flat.
  const shape = new T.Shape();
  const lobes = 5;
  shape.moveTo(0, 0);
  for (let i = 0; i <= lobes; i++) {
    const a = -1.25 + (i / lobes) * 2.5;
    const tip = new T.Vector2(Math.sin(a) * 0.95, Math.cos(a) * 0.95 + 0.05);
    const notch = (i / lobes) * 2.5 - 1.25 + 1.25 / lobes;
    shape.quadraticCurveTo(Math.sin(a - 0.2) * 0.6, Math.cos(a - 0.2) * 0.6, tip.x, tip.y);
    if (i < lobes)
      shape.quadraticCurveTo(
        Math.sin(notch) * 0.6,
        Math.cos(notch) * 0.6,
        Math.sin(notch) * 0.38,
        Math.cos(notch) * 0.38,
      );
  }
  shape.lineTo(0, 0);
  const geometry = new T.ExtrudeGeometry(shape, { depth: 0.09, bevelEnabled: false, curveSegments: 2 });
  geometry.rotateX(Math.PI / 2);
  return geometry;
}
function stripes() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 16;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#86c653';
  context.fillRect(0, 0, 128, 16);
  context.fillStyle = '#2f6e2e';
  for (let i = 0; i < 10; i++) {
    const x = i * 12.8;
    context.beginPath();
    context.moveTo(x, 0);
    context.bezierCurveTo(x + 4, 5, x - 2, 11, x + 3, 16);
    context.lineTo(x + 8, 16);
    context.bezierCurveTo(x + 3, 11, x + 9, 5, x + 6, 0);
    context.fill();
  }
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = T.RepeatWrapping;
  return map;
}

/** Deterministic variation, so the field looks the same on every visit. */
function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGarden(scene: T.Object3D) {
  const geometries: Record<GeometryKey, T.BufferGeometry> = {
    leaf: leafGeometry(),
    lobed: lobedGeometry(),
    blade: new T.ConeGeometry(0.5, 1, 6).translate(0, 0.5, 0),
    stem: new T.CylinderGeometry(0.5, 0.5, 1, 6).translate(0, 0.5, 0),
    ball: new T.SphereGeometry(1, 10, 6),
  };
  const materials: Record<MaterialKey, T.Material> = {
    leaf: toon('#5db347'),
    leafDark: toon('#3f8f3d'),
    leafLight: toon('#9bd25c'),
    banana: toon('#7cc653'),
    pseudostem: toon('#a8be5a'),
    flush: toon('#e0907c'),
    wood: toon('#8a6340'),
    vine: toon('#5f9a42'),
    melon: toon('#ffffff', { map: stripes() }),
    red: toon('#e5432f'),
    yellow: toon('#f4c531'),
    orange: toon('#f08a2c'),
    flower: toon('#ffe14d', { emissive: '#ffd21a', emissiveIntensity: 0.15 }),
  };
  const buckets = new Map<string, T.Matrix4[]>();
  const matrix = new T.Matrix4(),
    quaternion = new T.Quaternion(),
    euler = new T.Euler(0, 0, 0, 'YXZ'),
    up = new T.Vector3(0, 1, 0);
  function put(
    geometry: GeometryKey,
    mat: MaterialKey,
    position: T.Vector3,
    q: T.Quaternion,
    scale: T.Vector3,
  ) {
    const key = `${geometry}|${mat}`;
    const list = buckets.get(key) ?? [];
    list.push(matrix.clone().compose(position, q, scale));
    buckets.set(key, list);
  }
  /** Places a geometry with yaw (around y) and pitch (positive = tip up). */
  function place(
    geometry: GeometryKey,
    mat: MaterialKey,
    position: T.Vector3,
    yaw: number,
    pitch: number,
    scale: [number, number, number],
    roll = 0,
  ) {
    euler.set(-pitch, yaw, roll, 'YXZ');
    put(geometry, mat, position, quaternion.setFromEuler(euler), new T.Vector3(...scale));
  }
  function segment(mat: MaterialKey, a: T.Vector3, b: T.Vector3, radius: number) {
    const delta = b.clone().sub(a);
    put(
      'stem',
      mat,
      a,
      new T.Quaternion().setFromUnitVectors(up, delta.clone().normalize()),
      new T.Vector3(radius * 2, delta.length(), radius * 2),
    );
  }
  /** Leaf whose base is at `from`, pointing along `direction`. */
  function leafAlong(mat: MaterialKey, from: T.Vector3, direction: T.Vector3, length: number, width: number) {
    const d = direction.clone().normalize();
    place('leaf', mat, from, Math.atan2(d.x, d.z), Math.asin(Math.max(-1, Math.min(1, d.y))), [
      width,
      0.12,
      length,
    ]);
  }

  const builders: Record<CropKind, (x: number, y: number, z: number, rnd: () => number) => void> = {
    'cheiro-verde'(x, y, z, rnd) {
      // Cebolinha clump with a few coentro sprigs.
      for (let i = 0; i < 9; i++) {
        const a = rnd() * Math.PI * 2,
          r = rnd() * 0.035;
        const position = new T.Vector3(x - 0.05 + Math.cos(a) * r, y, z + Math.sin(a) * r);
        euler.set((rnd() - 0.5) * 0.35, 0, (rnd() - 0.5) * 0.35, 'YXZ');
        put(
          'blade',
          i % 3 ? 'leaf' : 'leafDark',
          position,
          quaternion.setFromEuler(euler),
          new T.Vector3(0.026, 0.2 + rnd() * 0.1, 0.026),
        );
      }
      for (let i = 0; i < 4; i++) {
        const a = 0.6 + i * 1.3 + rnd() * 0.4;
        const base = new T.Vector3(x + 0.07, y, z);
        const tip = base.clone().add(new T.Vector3(Math.sin(a) * 0.07, 0.1, Math.cos(a) * 0.07));
        segment('leaf', base, tip, 0.006);
        for (let k = 0; k < 3; k++)
          place(
            'ball',
            'leafLight',
            tip.clone().add(new T.Vector3((k - 1) * 0.022, 0.006, (rnd() - 0.5) * 0.02)),
            0,
            0,
            [0.022, 0.009, 0.022],
          );
      }
    },
    pimenta(x, y, z, rnd) {
      segment('wood', new T.Vector3(x, y, z), new T.Vector3(x, y + 0.13, z), 0.012);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + rnd();
        const r = i === 0 ? 0 : 0.07 + rnd() * 0.02;
        place(
          'ball',
          i % 2 ? 'leafDark' : 'leaf',
          new T.Vector3(x + Math.cos(a) * r, y + 0.2 + (i === 0 ? 0.06 : rnd() * 0.05), z + Math.sin(a) * r),
          a,
          0,
          [0.075, 0.06, 0.075],
        );
      }
      const colors: MaterialKey[] = ['red', 'yellow', 'orange', 'red', 'yellow'];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + rnd() * 0.5;
        place(
          'ball',
          colors[i],
          new T.Vector3(x + Math.cos(a) * 0.12, y + 0.17 + rnd() * 0.08, z + Math.sin(a) * 0.12),
          a,
          0,
          [0.03, 0.026, 0.03],
        );
      }
    },
    melancia(x, y, z, rnd) {
      // Running vine with lobed leaves, a flower and one fruit resting on the soil.
      let previous = new T.Vector3(x, y + 0.01, z);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + rnd() * 0.5;
        const reach = 0.12 + rnd() * 0.1;
        const node = new T.Vector3(x + Math.cos(a) * reach, y + 0.012, z + Math.sin(a) * reach * 0.8);
        segment('vine', new T.Vector3(x, y + 0.012, z), node, 0.008);
        place(
          'lobed',
          i % 2 ? 'leaf' : 'leafDark',
          node.clone().setY(y + 0.035),
          -a + Math.PI / 2,
          0.3 + rnd() * 0.25,
          [0.13, 0.15, 0.13],
        );
        previous = node;
      }
      place('lobed', 'leafLight', new T.Vector3(x, y + 0.07, z), rnd() * 6, 0.6, [0.1, 0.15, 0.1]);
      place('ball', 'flower', previous.clone().setY(y + 0.06), 0, 0, [0.022, 0.012, 0.022]);
      const side = rnd() > 0.5 ? 1 : -1;
      place(
        'ball',
        'melon',
        new T.Vector3(x + side * 0.17, y + 0.07, z + 0.14),
        Math.PI / 2 + (rnd() - 0.5) * 0.6,
        0,
        [0.075, 0.066, 0.115],
      );
    },
    banana(x, y, z, rnd) {
      // Young banana sucker: pseudostem, arching paddle leaves and a rolled "cigar" leaf.
      segment('pseudostem', new T.Vector3(x, y, z), new T.Vector3(x, y + 0.24, z), 0.034);
      place('ball', 'wood', new T.Vector3(x, y + 0.01, z), 0, 0, [0.045, 0.025, 0.045]);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + rnd() * 0.6;
        const base = new T.Vector3(x, y + 0.2 + i * 0.012, z);
        const petioleEnd = base.clone().add(new T.Vector3(Math.sin(a) * 0.05, 0.08, Math.cos(a) * 0.05));
        segment('pseudostem', base, petioleEnd, 0.009);
        place(
          'leaf',
          i % 2 ? 'banana' : 'leaf',
          petioleEnd,
          a,
          0.35 + rnd() * 0.25,
          [0.15, 0.12, 0.34],
          (rnd() - 0.5) * 0.4,
        );
      }
      segment('leafLight', new T.Vector3(x, y + 0.22, z), new T.Vector3(x + 0.01, y + 0.42, z), 0.013);
    },
    acai(x, y, z, rnd) {
      // Açaí seedling clump: slender stems with pinnate, drooping fronds.
      for (let stem = 0; stem < 2; stem++) {
        const sx = x + (stem ? 0.04 : -0.03),
          sz = z + (stem ? -0.02 : 0.02);
        const top = new T.Vector3(sx, y + 0.1 + stem * 0.04, sz);
        segment('wood', new T.Vector3(sx, y, sz), top, 0.011);
        for (let frond = 0; frond < 3; frond++) {
          const yaw = frond * 2.1 + stem * 1 + rnd() * 0.4;
          const horizontal = new T.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
          const length = 0.24 + rnd() * 0.06;
          const at = (t: number) =>
            top
              .clone()
              .addScaledVector(horizontal, length * t)
              .add(new T.Vector3(0, length * (0.9 * t - 0.75 * t * t), 0));
          for (let k = 0; k < 4; k++) segment('vine', at(k / 4), at((k + 1) / 4), 0.004);
          const side = new T.Vector3(horizontal.z, 0, -horizontal.x);
          for (let k = 1; k <= 5; k++) {
            const t = k / 6;
            const point = at(t);
            for (const s of [-1, 1]) {
              const direction = side
                .clone()
                .multiplyScalar(s)
                .addScaledVector(horizontal, 0.5)
                .add(new T.Vector3(0, -0.45, 0));
              leafAlong(k % 2 ? 'leaf' : 'leafDark', point, direction, 0.09 - t * 0.03, 0.022);
            }
          }
        }
      }
    },
    cupuacu(x, y, z, rnd) {
      // Woody seedling with broad leaves and a pinkish new flush hanging at the top.
      const top = new T.Vector3(x, y + 0.32, z);
      segment('wood', new T.Vector3(x, y, z), top, 0.013);
      for (let tier = 0; tier < 3; tier++) {
        const height = y + 0.11 + tier * 0.08;
        for (let i = 0; i < 2; i++) {
          const a = tier * 1.1 + i * Math.PI + rnd() * 0.3;
          const base = new T.Vector3(x, height, z);
          place('leaf', tier === 2 ? 'leaf' : 'leafDark', base, a, 0.1 + rnd() * 0.25, [
            0.085,
            0.12,
            0.19 - tier * 0.02,
          ]);
        }
      }
      for (let i = 0; i < 2; i++) {
        const a = rnd() * Math.PI * 2;
        place('leaf', 'flush', top, a, -1.1 - rnd() * 0.3, [0.05, 0.12, 0.11]);
      }
    },
  };

  return {
    plant(kind: CropKind, x: number, y: number, z: number, seed: number) {
      builders[kind](x, y, z, random(seed));
    },
    build() {
      for (const [key, matrices] of buckets) {
        const [geometryKey, materialKey] = key.split('|') as [GeometryKey, MaterialKey];
        const instances = new T.InstancedMesh(
          geometries[geometryKey],
          materials[materialKey],
          matrices.length,
        );
        matrices.forEach((m, i) => instances.setMatrixAt(i, m));
        instances.instanceMatrix.needsUpdate = true;
        instances.receiveShadow = true;
        instances.computeBoundingSphere();
        // Thin or tiny parts (stems, sprigs) read better without the ink line.
        const size =
          matrices.reduce((sum, m) => sum + m.getMaxScaleOnAxis(), 0) / Math.max(1, matrices.length);
        instances.castShadow = size > 0.05;
        if (geometryKey !== 'stem' && geometryKey !== 'blade' && size > 0.05)
          ink(instances, 0.0011, '#24331f');
        scene.add(instances);
      }
    },
  };
}
