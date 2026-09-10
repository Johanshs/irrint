import * as T from 'three';
import { irrigationLayout } from '../../../shared/water';
import { box, mesh, tube, material, createComponent } from './models';
import { fieldComponents } from './components';

export function createField(scene: T.Scene) {
  const pipe = material('#33484b'),
    wood = material('#b29770'),
    root = material('#ccaa75');
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
  box(scene, [10.7, 0.22, 7.5], [0, -0.74, 0], material('#dce5d6'));
  box(scene, [1.95, 0.14, 6.9], [-4, -0.54, 0], material('#c8d2cb'));
  box(scene, [1.65, 0.3, 1.65], [-4, -0.31, -2.2], material('#aabcb3'));
  component('reservoir', [-4, -0.15, -2.2]);
  component('pump', [-4, 0.08, 0.15], 0.8, Math.PI / 2);
  tube(scene, [-4, 0.03, -1.23], [-4, 0.08, -0.458], 0.075, pipe);
  tube(scene, [-4, 0.464, -0.194], [-4, 0.55, -0.194], 0.07, pipe);
  tube(scene, [-4, 0.55, -0.194], [-3, 0.55, -0.194], 0.07, pipe);
  tube(scene, [-3, 0.55, -0.194], [-3, 0.14, -0.194], 0.07, pipe);
  tube(scene, [-3, 0.14, -2.25], [-3, 0.14, 2.25], 0.07, pipe);
  const north = buildBed('north', -1.7),
    south = buildBed('south', 1.7);
  return {
    parts,
    pickable,
    beds: new Map([
      ['north', north],
      ['south', south],
    ]),
  };

  function buildBed(id: string, z: number) {
    const soil = material('#896647');
    const earth = box(scene, [5.7, 0.65, 2.5], [0.65, -0.14, z], soil);
    earth.userData.zoneId = id;
    pickable.push(earth);
    box(scene, [5.7, 0.13, 2.5], [0.65, -0.49, z], material('#b08c63'));
    const cut = new T.Group();
    scene.add(cut);
    // Front face can reveal the root zone without making the entire bed transparent.
    const front = box(scene, [5.9, 0.75, 0.1], [0.65, -0.04, z + 1.29], wood);
    box(scene, [5.9, 0.75, 0.1], [0.65, -0.04, z - 1.29], wood);
    for (const x of [-2.25, 3.55]) box(scene, [0.1, 0.75, 2.66], [x, -0.04, z], wood);
    const outline = material('#65a38d');
    box(scene, [5.9, 0.035, 0.11], [0.65, 0.35, z + 1.29], outline);
    tube(scene, [-3, 0.14, z], [-1.98, 0.14, z], 0.055, pipe);
    tube(scene, [-1.98, 0.14, z], [-1.98, 0.5, z], 0.035, pipe);
    component(`valve-${id}`, [-2.55, 0.14, z], 0.65);
    const controller = component(`controller-${id}`, [-3.9, 0.53, z + 1.0], 0.62);
    controller.rotation.x = 0.48;
    box(scene, [1.05, 0.08, 1.1], [-3.7, 0.36, z + 1.0], material('#8b9f96'));
    tube(scene, [-3.85, -0.46, z + 1], [-3.85, 0.33, z + 1], 0.045, pipe);
    tube(scene, [-3.3, 0.42, z + 0.85], [-2.65, 0.34, z + 0.23], 0.012, material('#ba9860'));
    component(`sensor-${id}`, [3.05, 0.53, z + 0.69], 0.58, -0.2);
    tube(scene, [3.1, 1.03, z + 0.65], [3.38, 0.29, z + 1.02], 0.012, pipe);
    tube(scene, [-1.98, 0.5, z - 0.72], [-1.98, 0.5, z + 0.72], 0.035, pipe);
    const points: T.Vector3[] = [];
    const foliage = new T.InstancedMesh(
      new T.SphereGeometry(1, 10, 6),
      material(id === 'north' ? '#57834a' : '#82a45b'),
      irrigationLayout.rows * irrigationLayout.columns * 7,
    );
    scene.add(foliage);
    foliage.castShadow = true;
    const dummy = new T.Object3D();
    let leafIndex = 0;
    const wetMaterial = material('#3f4b34');
    const patches = new T.InstancedMesh(new T.CircleGeometry(1, 20), wetMaterial, 18);
    scene.add(patches);
    const moistureMaterial = material('#527e6b');
    const bulbs = new T.InstancedMesh(new T.SphereGeometry(1, 12, 8), moistureMaterial, 6);
    cut.add(bulbs);
    const droplets = new T.InstancedMesh(
      new T.SphereGeometry(1, 6, 4),
      new T.MeshStandardMaterial({
        color: '#65d9ef',
        emissive: '#13749b',
        emissiveIntensity: 0.3,
        metalness: 0.2,
        roughness: 0.18,
      }),
      54,
    );
    scene.add(droplets);
    const ripples = new T.InstancedMesh(
      new T.RingGeometry(0.75, 1, 20),
      new T.MeshBasicMaterial({ color: '#74c6cc', transparent: true, opacity: 0.6, depthWrite: false }),
      18,
    );
    scene.add(ripples);
    for (let row = 0; row < irrigationLayout.rows; row++) {
      const dz = (row - 1) * 0.72;
      tube(scene, [-1.98, 0.5, z + dz], [3.13, 0.5, z + dz], 0.026, pipe);
      tube(scene, [3.13, 0.19, z + dz], [3.13, 0.5, z + dz], 0.015, pipe);
      for (let column = 0; column < irrigationLayout.columns; column++) {
        const x = -1.52 + column * 0.84;
        if (row === 2 && column === 2) component(`emitter-${id}`, [x, 0.5, z + dz], 0.65);
        else {
          const emitter = createComponent('emitter');
          emitter.scale.setScalar(0.65);
          emitter.position.set(x, 0.5, z + dz);
          emitter.traverse((child) => {
            child.userData.componentId = `emitter-${id}`;
          });
          pickable.push(emitter);
          scene.add(emitter);
        }
        points.push(new T.Vector3(x, 0.195, z + dz + 0.095));
        const plantZ = z + dz + 0.24;
        tube(scene, [x, 0.19, plantZ], [x, 0.45, plantZ], 0.014, material('#527341'));
        for (let petal = 0; petal < 7; petal++) {
          const angle = (petal * Math.PI * 2) / 7 + column * 0.3;
          dummy.position.set(
            x + Math.cos(angle) * 0.085,
            0.34 + (petal % 2) * 0.09,
            plantZ + Math.sin(angle) * 0.085,
          );
          dummy.rotation.set(-0.45, -angle + Math.PI / 2, 0.3);
          dummy.scale.set(0.085, 0.026, id === 'north' ? 0.24 : 0.19);
          dummy.updateMatrix();
          foliage.setMatrixAt(leafIndex++, dummy.matrix);
        }
        if (row === 2)
          for (let branch = 0; branch < 4; branch++) {
            const rootX = x + (branch - 1.5) * 0.065;
            tube(cut, [x, 0.19, z + 1.267], [rootX, -0.26 - (branch % 2) * 0.1, z + 1.268], 0.009, root);
            tube(cut, [rootX, -0.13, z + 1.268], [rootX + 0.085, -0.22, z + 1.269], 0.005, root);
          }
      }
    }
    const haloMaterial = new T.MeshBasicMaterial({ color: '#4cb29e', transparent: true, opacity: 0.75 });
    const halo = mesh(scene, new T.TorusGeometry(0.17, 0.013, 6, 24), haloMaterial, [-2.55, 0.52, z]);
    halo.rotation.x = Math.PI / 2;
    return {
      update(
        moisture: number,
        flow: boolean,
        selected: boolean,
        online: boolean,
        section: boolean,
        time: number,
      ) {
        const wet = Math.max(0, Math.min(1, moisture / 100));
        soil.color.set('#896647').lerp(new T.Color('#474335'), wet);
        outline.color.set(selected ? '#36a786' : '#ac9270');
        haloMaterial.color.set(!online ? '#ce9441' : flow ? '#4ce0d3' : '#5a7068');
        front.visible = !section;
        cut.visible = section;
        droplets.visible = flow;
        ripples.visible = flow;
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
            dummy.scale.set(0.018, 0.025 + fall * 0.014, 0.018);
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
