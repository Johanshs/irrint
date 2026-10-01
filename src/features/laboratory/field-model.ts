import * as T from 'three';
import { irrigationLayout } from '../../../shared/water';
import { box, mesh, tube, ring, material, createComponent, lettering, roundedSlab } from './models';
import { fieldComponents } from './components';
import { createGarden, zoneCrops } from './crops';
import { createScenery } from './scenery';
import { bake, toon } from './toon';

/**
 * Didactic diorama of a drip-irrigation plot. Layout, connection points and the per-frame
 * `update` contract are unchanged; only the look is cartoon/cel-shaded.
 */
export function createField(scene: T.Scene) {
  const pvc = material('#e9ede6'),
    pe = material('#2f373b'),
    fitting = material('#cfd6d0'),
    concrete = material('#d6d0bf'),
    concreteTop = material('#e6e1d2'),
    root = material('#e6c48a', 0, 0, { noInk: true }),
    stake = material('#a77a4a'),
    cable = material('#c9564a', 0, 0, { noInk: true }),
    cableDark = material('#3b4a4f', 0, 0, { noInk: true });
  const parts = new Map<string, T.Group>();
  const pickable: T.Object3D[] = [];
  function component(id: string, position: [number, number, number], scale = 1, rotation = 0) {
    const definition = fieldComponents.find((part) => part.id === id)!;
    const object = createComponent(definition.kind);
    object.position.set(...position);
    object.scale.setScalar(scale);
    object.rotation.y = rotation;
    object.traverse((child) => {
      child.userData.componentId = id;
    });
    scene.add(object);
    parts.set(id, object);
    pickable.push(object);
    return object;
  }
  createScenery(scene);
  const garden = createGarden(scene);

  // Static plumbing and equipment pad, merged per material for fewer draw calls.
  const decor = new T.Group();
  scene.add(decor);
  mesh(decor, roundedSlab(1.95, 6.9, 0.16, 0.12), concrete, [-4, -0.63, 0]);
  mesh(decor, roundedSlab(1.65, 1.65, 0.3, 0.1), concrete, [-4, -0.46, -2.2]);
  box(decor, [1.5, 0.02, 1.5], [-4, -0.15, -2.2], concreteTop);
  component('reservoir', [-4, -0.15, -2.2]);
  component('pump', [-4, 0.08, 0.15], 0.8, Math.PI / 2);
  // Reservoir → pump → main line (white PVC) with elbows and a tee.
  tube(decor, [-4, 0.03, -1.23], [-4, 0.08, -0.458], 0.075, pvc);
  tube(decor, [-4, 0.464, -0.194], [-4, 0.55, -0.194], 0.07, pvc);
  tube(decor, [-4, 0.55, -0.194], [-3, 0.55, -0.194], 0.07, pvc);
  tube(decor, [-3, 0.55, -0.194], [-3, 0.14, -0.194], 0.07, pvc);
  tube(decor, [-3, 0.14, -2.25], [-3, 0.14, 2.25], 0.07, pvc);
  for (const p of [
    [-4, 0.55, -0.194],
    [-3, 0.55, -0.194],
    [-3, 0.14, -0.194],
  ] as [number, number, number][])
    mesh(decor, new T.SphereGeometry(0.09, 12, 8), fitting, p);
  for (const z of [-2.25, 2.25])
    mesh(decor, new T.CylinderGeometry(0.09, 0.09, 0.08, 12), fitting, [-3, 0.14, z]).rotation.x =
      Math.PI / 2;
  for (const z of [-1.2, 1.2]) {
    box(decor, [0.24, 0.6, 0.16], [-3, -0.18, z], concrete);
    box(decor, [0.18, 0.04, 0.2], [-3, 0.08, z], fitting);
  }

  const north = buildBed('north', -1.7),
    south = buildBed('south', 1.7);
  bake(decor);
  garden.build();
  return {
    parts,
    pickable,
    beds: new Map([
      ['north', north],
      ['south', south],
    ]),
  };

  function buildBed(id: string, z: number) {
    const soil = toon('#8a6243');
    const wood = toon('#c39563'),
      woodDark = toon('#a87a4b');
    const earth = box(scene, [5.7, 0.65, 2.5], [0.65, -0.14, z], soil);
    earth.userData.zoneId = id;
    pickable.push(earth);
    box(decor, [5.7, 0.2, 2.5], [0.65, -0.55, z], material('#6f4e33'));
    // Soil clods share the soil material, so they darken together with moisture.
    const clods = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), soil, 60);
    const dummy = new T.Object3D();
    for (let i = 0; i < 60; i++) {
      const seed = Math.sin(i * 12.9898 + z * 78.233) * 43758.5453;
      const r1 = seed - Math.floor(seed),
        r2 = (seed * 7.13) % 1,
        r3 = (seed * 3.71) % 1;
      dummy.position.set(-2.1 + Math.abs(r1) * 5.5, 0.19, z - 1.15 + Math.abs(r2) * 2.3);
      dummy.rotation.set(r1 * 3, r2 * 3, r3 * 3);
      dummy.scale.set(0.035 + Math.abs(r3) * 0.03, 0.02, 0.035 + Math.abs(r2) * 0.03);
      dummy.updateMatrix();
      clods.setMatrixAt(i, dummy.matrix);
    }
    clods.receiveShadow = true;
    scene.add(clods);
    const cut = new T.Group();
    scene.add(cut);

    // Plank walls: the front can open to reveal the root zone (section view).
    const front = new T.Group();
    scene.add(front);
    const planks = (
      parent: T.Object3D,
      length: number,
      center: [number, number, number],
      alongX: boolean,
    ) => {
      for (let i = 0; i < 3; i++) {
        const y = -0.5 + i * 0.29;
        const size: [number, number, number] = alongX ? [length, 0.26, 0.1] : [0.1, 0.26, length];
        box(parent, size, [center[0], y, center[2]], i % 2 ? woodDark : wood);
      }
    };
    planks(front, 5.9, [0.65, 0, z + 1.29], true);
    planks(decor, 5.9, [0.65, 0, z - 1.29], true);
    for (const x of [-2.25, 3.55]) planks(decor, 2.66, [x, 0, z], false);
    for (const x of [-2.27, 3.57])
      for (const dz of [-1.31, 1.31]) box(decor, [0.16, 1.02, 0.16], [x, -0.12, z + dz], woodDark);
    bake(front);
    // Cap rails on back and sides double as the "selected area" highlight.
    const outline = toon('#c9a26b');
    box(scene, [6.0, 0.06, 0.16], [0.65, 0.37, z - 1.29], outline);
    for (const x of [-2.25, 3.55]) box(scene, [0.16, 0.06, 2.74], [x, 0.37, z], outline);

    // Area sign (N/S) on a stake beside the bed.
    tube(decor, [4.05, -0.63, z + 0.95], [4.05, 0.62, z + 0.95], 0.03, stake);
    mesh(decor, roundedSlab(0.5, 0.06, 0.34, 0.06), wood, [4.05, 0.5, z + 0.98]);
    const letter = lettering(
      scene,
      id === 'north' ? 'N' : 'S',
      [4.05, 0.64, z + 1.016],
      1.5,
      '#5a3a1e',
      'bold 54px sans-serif',
    );
    letter.rotation.x = 0;

    // Supply: main → valve → riser → sub-main, then black PE drip laterals on stakes.
    tube(decor, [-3, 0.14, z], [-1.98, 0.14, z], 0.055, pvc);
    mesh(decor, new T.SphereGeometry(0.075, 10, 8), fitting, [-1.98, 0.14, z]);
    tube(decor, [-1.98, 0.14, z], [-1.98, 0.5, z], 0.035, pvc);
    component(`valve-${id}`, [-2.55, 0.14, z], 0.65);
    const controller = component(`controller-${id}`, [-3.9, 0.53, z + 1.0], 0.62);
    controller.rotation.x = 0.48;
    // Mounting plate tilted with the board (just below its pins) on a post: no part crosses another.
    const mount = new T.Group();
    mount.position.set(-3.9, 0.53, z + 1.0);
    mount.rotation.x = 0.48;
    decor.add(mount);
    box(mount, [0.84, 0.025, 0.92], [0.163, -0.115, 0], material('#dfe3dc'));
    tube(decor, [-3.74, -0.47, z + 0.95], [-3.74, 0.4, z + 0.95], 0.04, fitting);
    tube(decor, [-3.4, 0.38, z + 0.82], [-2.56, 0.33, z + 0.22], 0.014, cable);
    // Probe between the end of the drip lines and the side wall, inserted up to its mark.
    component(`sensor-${id}`, [3.35, 0.53, z + 0.36], 0.58, -0.25);
    tube(decor, [3.44, 1.0, z + 0.28], [3.64, 0.45, z + 0.12], 0.014, cableDark);
    tube(decor, [3.64, 0.45, z + 0.12], [3.65, -0.3, z + 0.12], 0.014, cableDark);
    tube(decor, [-1.98, 0.5, z - 0.72], [-1.98, 0.5, z + 0.72], 0.035, pvc);
    for (const dz of [-0.72, 0.72])
      mesh(decor, new T.SphereGeometry(0.045, 10, 6), fitting, [-1.98, 0.5, z + dz]);

    const points: T.Vector3[] = [];
    const wetMaterial = toon('#4d3626', { noInk: true });
    const patches = new T.InstancedMesh(new T.CircleGeometry(1, 20), wetMaterial, 18);
    scene.add(patches);
    const moistureMaterial = toon('#5aa7d6', { noInk: true, transparent: true, opacity: 0.6 });
    const bulbs = new T.InstancedMesh(new T.SphereGeometry(1, 14, 10), moistureMaterial, 6);
    cut.add(bulbs);
    const droplets = new T.InstancedMesh(
      new T.SphereGeometry(1, 8, 6),
      toon('#6fe0f5', { noInk: true, emissive: '#2bb7e6', emissiveIntensity: 0.55 }),
      54,
    );
    scene.add(droplets);
    const ripples = new T.InstancedMesh(
      new T.RingGeometry(0.75, 1, 20),
      new T.MeshBasicMaterial({ color: '#8fe3f0', transparent: true, opacity: 0.7, depthWrite: false }),
      18,
    );
    scene.add(ripples);
    const template = createComponent('emitter');
    const emitters = new T.Group();
    const roots = new T.Group();
    for (let row = 0; row < irrigationLayout.rows; row++) {
      const dz = (row - 1) * 0.72;
      tube(decor, [-1.98, 0.5, z + dz], [3.13, 0.5, z + dz], 0.026, pe);
      // Figure-8 end closure instead of an open pipe end.
      ring(decor, 0.034, 0.012, [3.17, 0.5, z + dz], 'x', pe, 10);
      for (let column = 0; column < irrigationLayout.columns - 1; column++) {
        const x = -1.1 + column * 0.84;
        tube(decor, [x, 0.17, z + dz], [x, 0.53, z + dz], 0.016, stake, 5);
        mesh(decor, new T.TorusGeometry(0.035, 0.009, 5, 10, Math.PI), stake, [x, 0.5, z + dz]).rotation.y =
          Math.PI / 2;
      }
      for (let column = 0; column < irrigationLayout.columns; column++) {
        const x = -1.52 + column * 0.84;
        if (row === 2 && column === 2) component(`emitter-${id}`, [x, 0.5, z + dz], 0.65);
        else
          for (const child of template.children)
            if (child instanceof T.Mesh) {
              const copy = new T.Mesh(child.geometry, child.material);
              copy.position.set(x, 0.5, z + dz);
              copy.scale.setScalar(0.65);
              emitters.add(copy);
            }
        points.push(new T.Vector3(x, 0.195, z + dz + 0.095));
        const plantZ = z + dz + 0.24;
        garden.plant(zoneCrops[id][row], x, 0.19, plantZ, (id === 'north' ? 100 : 200) + row * 10 + column);
        if (row === 2)
          for (let branch = 0; branch < 4; branch++) {
            const rootX = x + (branch - 1.5) * 0.065;
            tube(roots, [x, 0.19, z + 1.267], [rootX, -0.26 - (branch % 2) * 0.1, z + 1.268], 0.009, root);
            tube(roots, [rootX, -0.13, z + 1.268], [rootX + 0.085, -0.22, z + 1.269], 0.005, root);
          }
      }
    }
    // The 17 decorative emitters share materials with the template and are merged into one batch.
    scene.add(emitters);
    bake(emitters, { width: 0.0014 });
    emitters.traverse((child) => {
      child.userData.componentId = `emitter-${id}`;
    });
    pickable.push(emitters);
    // The template itself is never shown: release its ink outlines (geometry was consumed by bake).
    template.traverse((child) => {
      if (child instanceof T.Mesh && child.userData.ink) {
        child.geometry.dispose();
        (child.material as T.Material).dispose();
      }
    });
    cut.add(bake(roots, { ink: false }));

    const haloMaterial = new T.MeshBasicMaterial({ color: '#4cb29e', transparent: true, opacity: 0.85 });
    const halo = mesh(scene, new T.TorusGeometry(0.17, 0.016, 6, 24), haloMaterial, [-2.55, 0.52, z]);
    halo.rotation.x = Math.PI / 2;
    halo.castShadow = false;
    const dryColor = new T.Color('#8a6243'),
      wetColor = new T.Color('#4a3527');
    return {
      update(
        moisture: number,
        flow: boolean,
        selected: boolean,
        online: boolean,
        section: boolean,
        time: number,
        showDrips: boolean,
      ) {
        const wet = Math.max(0, Math.min(1, moisture / 100));
        soil.color.copy(dryColor).lerp(wetColor, wet);
        outline.color.set(selected ? '#3fd0a2' : '#c9a26b');
        outline.emissive.set(selected ? '#1d8f6c' : '#000000');
        outline.emissiveIntensity = selected ? 0.5 : 0;
        haloMaterial.color.set(!online ? '#f0a43f' : flow ? '#4ce0d3' : '#5a7068');
        front.visible = !section;
        cut.visible = section;
        droplets.visible = flow && showDrips;
        ripples.visible = flow && showDrips;
        points.forEach((point, i) => {
          dummy.position.copy(point);
          dummy.rotation.set(-Math.PI / 2, 0, 0);
          dummy.scale.setScalar(0.08 + wet * 0.28);
          dummy.updateMatrix();
          patches.setMatrixAt(i, dummy.matrix);
          const phase = (time * 1.4 + i * 0.173) % 1;
          dummy.position.y = 0.2;
          dummy.scale.setScalar(0.02 + phase * 0.095);
          dummy.updateMatrix();
          ripples.setMatrixAt(i, dummy.matrix);
          for (let particle = 0; particle < 3; particle++) {
            const fall = (phase + particle / 3) % 1;
            dummy.position.set(point.x, 0.464 - 0.264 * fall * fall, point.z);
            dummy.rotation.set(0, 0, 0);
            // Teardrop: slightly stretched while falling.
            dummy.scale.set(0.02, 0.026 + fall * 0.016, 0.02);
            dummy.updateMatrix();
            droplets.setMatrixAt(i * 3 + particle, dummy.matrix);
          }
          if (i >= 12) {
            dummy.position.set(point.x, -0.08, z + 1.264);
            dummy.scale.set(0.07 + wet * 0.23, 0.08 + wet * 0.31, 0.008);
            dummy.updateMatrix();
            bulbs.setMatrixAt(i - 12, dummy.matrix);
          }
        });
        patches.instanceMatrix.needsUpdate = true;
        droplets.instanceMatrix.needsUpdate = true;
        ripples.instanceMatrix.needsUpdate = true;
        bulbs.instanceMatrix.needsUpdate = true;
      },
    };
  }
}
