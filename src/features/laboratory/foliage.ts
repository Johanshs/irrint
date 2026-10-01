import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { toonRamp } from './toon';

/**
 * Stylized foliage in the spirit of hand-painted handheld RPG scenery: each crown is a few
 * rounded masses built from alpha-cut "leaf cluster" cards whose normals point away from the
 * mass centre. The toon ramp then shades every mass as one soft volume with a crisp,
 * leafy silhouette instead of a smooth ball or a spiky mesh. All textures are drawn in code.
 */
export function random(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const cache = new Map<string, T.Texture>();
function shared(key: string, draw: () => HTMLCanvasElement, repeat?: number) {
  const hit = cache.get(key);
  if (hit) return hit;
  const texture = new T.CanvasTexture(draw());
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  if (repeat) {
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
  }
  // Reused across mounts; disposeScene must not release it.
  texture.userData.shared = true;
  cache.set(key, texture);
  return texture;
}
function canvas(size: number) {
  const element = document.createElement('canvas');
  element.width = element.height = size;
  return [element, element.getContext('2d')!] as const;
}
function leafShape(context: CanvasRenderingContext2D, x: number, y: number, length: number, angle: number) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.beginPath();
  context.moveTo(0, 0);
  context.quadraticCurveTo(length * 0.45, -length * 0.42, length, 0);
  context.quadraticCurveTo(length * 0.45, length * 0.42, 0, 0);
  context.fill();
  context.restore();
}

export interface LeafPalette {
  dark: string;
  mid: string;
  light: string;
  edge: string;
}
export const palettes: Record<string, LeafPalette> = {
  canopy: { dark: '#2f7a3b', mid: '#4f9e3f', light: '#86c54f', edge: '#245c30' },
  savanna: { dark: '#5a7f2e', mid: '#7fa23a', light: '#b5cc5a', edge: '#45632a' },
  bush: { dark: '#2e6e3a', mid: '#3f8e44', light: '#74b84e', edge: '#1f5530' },
};

/** Round cluster of overlapping leaves on a transparent background (alpha-tested card). */
export function clusterTexture(name: keyof typeof palettes) {
  return shared(`cluster-${name}`, () => {
    const palette = palettes[name];
    const [element, context] = canvas(256);
    const rnd = random(name.length * 97 + 13);
    const draw = (color: string, count: number, radius: number, size: number) => {
      context.fillStyle = color;
      for (let i = 0; i < count; i++) {
        const a = rnd() * Math.PI * 2,
          r = Math.sqrt(rnd()) * radius;
        const x = 128 + Math.cos(a) * r,
          y = 128 + Math.sin(a) * r;
        // Leaves point outward, so the silhouette reads as a scalloped edge of tips.
        leafShape(context, x, y, size * (0.75 + rnd() * 0.5), a + (rnd() - 0.5) * 0.9);
      }
    };
    draw(palette.edge, 90, 92, 34);
    draw(palette.dark, 90, 86, 32);
    draw(palette.mid, 80, 74, 30);
    draw(palette.light, 34, 52, 26);
    return element;
  });
}

/** Opaque leafy texture for the inner core of a crown (fills gaps between cards). */
export function leafFillTexture(name: keyof typeof palettes) {
  return shared(
    `fill-${name}`,
    () => {
      const palette = palettes[name];
      const [element, context] = canvas(128);
      context.fillStyle = palette.dark;
      context.fillRect(0, 0, 128, 128);
      const rnd = random(name.length * 31 + 7);
      for (const [color, count] of [
        [palette.edge, 60],
        [palette.mid, 70],
        [palette.light, 18],
      ] as const) {
        context.fillStyle = color;
        for (let i = 0; i < count; i++)
          for (const dx of [-128, 0, 128])
            for (const dy of [-128, 0, 128])
              leafShape(context, rnd() * 128 + dx, rnd() * 128 + dy, 16 + rnd() * 10, rnd() * 6.3);
      }
      return element;
    },
    2,
  );
}

/** Fan-palm leaf (buriti): pleated rays opening from the petiole at the bottom centre. */
export function fanTexture(dry = false) {
  return shared(dry ? 'fan-dry' : 'fan', () => {
    const [element, context] = canvas(256);
    const rays = 17;
    for (let i = 0; i < rays; i++) {
      const a = -1.45 + (i / (rays - 1)) * 2.9;
      const length = 200 + Math.sin(i * 1.7) * 18;
      const tipX = 128 + Math.sin(a) * length,
        tipY = 236 - Math.cos(a) * length;
      const side = (offset: number) =>
        [128 + Math.sin(a + offset) * 70, 236 - Math.cos(a + offset) * 70] as const;
      const [lx, ly] = side(-0.09),
        [rx, ry] = side(0.09);
      context.fillStyle = dry ? (i % 2 ? '#b48a4c' : '#c79e5d') : i % 2 ? '#3f8f3f' : '#5aad49';
      context.beginPath();
      context.moveTo(128, 236);
      context.lineTo(lx, ly);
      context.lineTo(tipX, tipY);
      context.lineTo(rx, ry);
      context.closePath();
      context.fill();
      // Pleat crease.
      context.strokeStyle = dry ? '#8d6532' : '#2c6b32';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(128, 236);
      context.lineTo(tipX, tipY);
      context.stroke();
    }
    return element;
  });
}

/** Tileable stylized ground with blade strokes and a few flowers/pebbles. */
export function groundTexture(kind: 'lawn' | 'lavrado' | 'dirt' | 'bark' | 'rock', repeat: number) {
  const key = `ground-${kind}`;
  const texture = shared(key, () => {
    const [element, context] = canvas(256);
    const rnd = random(kind.length * 131 + 3);
    const colors = {
      lawn: ['#79c257', '#68b04b', '#8fd165', '#5a9e43'],
      lavrado: ['#b3c072', '#a4b366', '#c2cb85', '#97a85f'],
      dirt: ['#9a6b43', '#875c38', '#a97a4f', '#7a5232'],
      bark: ['#8a7a68', '#776857', '#9c8c78', '#665848'],
      rock: ['#9aa9bb', '#909fb2', '#a5b3c4', '#8796a9'],
    }[kind];
    context.fillStyle = colors[0];
    context.fillRect(0, 0, 256, 256);
    const wrap = (fn: (dx: number, dy: number) => void) => {
      for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) fn(dx, dy);
    };
    if (kind === 'lawn' || kind === 'lavrado') {
      for (let i = 0; i < 520; i++) {
        const x = rnd() * 256,
          y = rnd() * 256,
          h = 6 + rnd() * 9,
          lean = (rnd() - 0.5) * 6;
        context.strokeStyle = colors[1 + (i % 3)];
        context.lineWidth = 1.6;
        wrap((dx, dy) => {
          context.beginPath();
          context.moveTo(x + dx, y + dy);
          context.quadraticCurveTo(x + dx + lean * 0.3, y + dy - h * 0.6, x + dx + lean, y + dy - h);
          context.stroke();
        });
      }
      for (let i = 0; i < 10; i++) {
        const x = rnd() * 256,
          y = rnd() * 256;
        context.fillStyle = kind === 'lawn' ? (i % 2 ? '#fff6b0' : '#ffffff') : '#e9d88f';
        wrap((dx, dy) => {
          context.beginPath();
          context.arc(x + dx, y + dy, 2.2, 0, Math.PI * 2);
          context.fill();
        });
      }
    } else if (kind === 'dirt') {
      for (let i = 0; i < 160; i++) {
        const x = rnd() * 256,
          y = rnd() * 256;
        context.fillStyle = colors[1 + (i % 3)];
        wrap((dx, dy) => {
          context.beginPath();
          context.ellipse(x + dx, y + dy, 3 + rnd() * 6, 1.5 + rnd() * 2.5, 0, 0, Math.PI * 2);
          context.fill();
        });
      }
    } else {
      // Bark rings / vertical rock streaks.
      for (let i = 0; i < (kind === 'rock' ? 26 : 60); i++) {
        context.fillStyle = colors[1 + (i % 3)];
        const x = rnd() * 256,
          y = rnd() * 256;
        if (kind === 'bark') context.fillRect(0, y, 256, 3 + rnd() * 5);
        else context.fillRect(x, 0, 2 + rnd() * 5, 256);
      }
    }
    return element;
  });
  // Each surface keeps its own repeat; share the image, not the transform.
  const variant = `${key}@${repeat}`;
  let copy = cache.get(variant);
  if (!copy) {
    copy = new T.CanvasTexture(texture.image as HTMLCanvasElement);
    copy.colorSpace = T.SRGBColorSpace;
    copy.anisotropy = 4;
    copy.wrapS = copy.wrapT = T.RepeatWrapping;
    copy.repeat.set(repeat, repeat);
    copy.userData.shared = true;
    cache.set(variant, copy);
  }
  return copy;
}

export function foliageMaterial(map: T.Texture, color = '#ffffff') {
  const material = new T.MeshToonMaterial({
    color,
    map,
    gradientMap: toonRamp(),
    alphaTest: 0.5,
    side: T.DoubleSide,
  });
  material.userData.noInk = true;
  return material;
}
/** Shadow pass that respects the leaf cut-outs. */
export function foliageDepth(map: T.Texture) {
  return new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map, alphaTest: 0.5 });
}

/**
 * One leafy mass: `cards` alpha quads scattered in an ellipsoid, normals pointing out
 * from the centre (so lighting reads as a single volume). Returns geometry in world/local
 * space of the caller.
 */
export function leafMass(
  center: T.Vector3,
  radius: T.Vector3,
  cards: number,
  rnd: () => number,
  cardSize = 0.95,
) {
  const geometries: T.BufferGeometry[] = [];
  const quaternion = new T.Quaternion(),
    euler = new T.Euler();
  for (let i = 0; i < cards; i++) {
    // Points biased towards the surface so the silhouette stays full.
    const u = rnd() * 2 - 1,
      a = rnd() * Math.PI * 2,
      s = Math.sqrt(1 - u * u);
    const shell = 0.55 + rnd() * 0.4;
    const offset = new T.Vector3(Math.cos(a) * s, u * 0.85 + 0.1, Math.sin(a) * s)
      .multiply(radius)
      .multiplyScalar(shell);
    const size = Math.max(radius.x, radius.y, radius.z) * cardSize * (0.8 + rnd() * 0.4);
    const plane = new T.PlaneGeometry(size, size);
    // Cards roughly face outward with some jitter, which hides the "card" look from any angle.
    const outward = offset.clone().normalize();
    quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), outward);
    euler.set((rnd() - 0.5) * 1.2, (rnd() - 0.5) * 1.2, rnd() * Math.PI * 2);
    plane.applyQuaternion(quaternion.multiply(new T.Quaternion().setFromEuler(euler)));
    plane.translate(center.x + offset.x, center.y + offset.y, center.z + offset.z);
    const position = plane.getAttribute('position'),
      normal = plane.getAttribute('normal');
    const v = new T.Vector3();
    for (let k = 0; k < position.count; k++) {
      v.fromBufferAttribute(position, k).sub(center).divide(radius).normalize();
      normal.setXYZ(k, v.x, v.y, v.z);
    }
    geometries.push(plane);
  }
  const merged = mergeGeometries(geometries)!;
  geometries.forEach((g) => g.dispose());
  return merged;
}

/** Opaque, slightly smaller core so no sky shows through the middle of a crown. */
export function leafCore(center: T.Vector3, radius: T.Vector3) {
  const core = new T.IcosahedronGeometry(1, 2);
  core.scale(radius.x * 0.72, radius.y * 0.68, radius.z * 0.72);
  core.translate(center.x, center.y + radius.y * 0.05, center.z);
  return core;
}
