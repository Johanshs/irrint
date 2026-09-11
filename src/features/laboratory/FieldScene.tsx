import { useEffect, useId, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Snapshot } from '../../../shared/contracts';
import { zoneStatus } from '../irrigation/session';
import { createField } from './field-model';
import { disposeScene } from './models';
import { fieldComponents, type FieldComponent } from './components';
import { ComponentInspector } from './ComponentInspector';
import './laboratory.css';

interface Props {
  state: Snapshot;
  connected: boolean;
  selectedId: string;
  replay?: { second: number; playing: boolean; speed: number };
  physicalFlow?: Record<string, boolean>;
  onInspect?: () => void;
}

/** The renderer observes snapshots. No frame, gesture or inspection sends control commands. */
export default function FieldScene(props: Props) {
  const container = useRef<HTMLDivElement>(null),
    labels = useRef(new Map<string, HTMLButtonElement>());
  const leaders = useRef(new Map<string, SVGLineElement>());
  const leaderMarkerId = useId();
  const [names, setNames] = useState(false),
    [section, setSection] = useState(false);
  const [motion, setMotion] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [inspected, setInspected] = useState<FieldComponent | null>(null),
    [unavailable, setUnavailable] = useState(false);
  const latest = useRef({ ...props, names, section, inspected, motion });
  latest.current = { ...props, names, section, inspected, motion };
  const reset = useRef(() => {}),
    focusZone = useRef(() => {}),
    hover = useRef((_: string | null) => {});
  const open = (part: FieldComponent) => {
    props.onInspect?.();
    setInspected(part);
  };
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    const host = container.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    } catch {
      setUnavailable(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute(
      'aria-label',
      'Campo 3D com dois canteiros, sensores, microcontroladores e irrigação por gotejamento. Os componentes também estão disponíveis em Visualização e componentes.',
    );
    host.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color('#eaf1ec');
    const camera = new T.PerspectiveCamera(39, 1, 0.1, 70);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 24;
    controls.maxPolarAngle = Math.PI / 2.15;
    reset.current = () => {
      camera.position.set(9, 10, 12);
      controls.target.set(-0.4, 0.1, 0);
      controls.update();
    };
    reset.current();
    focusZone.current = () => {
      const z = latest.current.selectedId === 'north' ? -1.7 : 1.7;
      controls.target.set(0.65, 0.05, z);
      camera.position.set(5.45, 5.85, z + 6);
      controls.update();
    };
    scene.add(new T.HemisphereLight('#fffaed', '#748678', 2.5));
    const sun = new T.DirectionalLight('#fff3dc', 3);
    sun.position.set(-3, 10, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
    sun.shadow.normalBias = 0.035;
    scene.add(sun);
    const field = createField(scene);
    // Components stay fixed in world space; only their screen projection changes with the camera.
    const anchors = new Map(
      fieldComponents.map((part) => [
        part.id,
        new T.Box3().setFromObject(field.parts.get(part.id)!).getCenter(new T.Vector3()),
      ]),
    );
    const labelPositions = new Map<string, { x: number; y: number }>();
    let hovered: string | null = null;
    hover.current = (id) => {
      hovered = id;
      for (const [key, group] of field.parts)
        group.traverse((object) => {
          if (object instanceof T.Mesh && object.material instanceof T.MeshStandardMaterial) {
            object.material.emissive.set(key === id ? '#1a5548' : '#000000');
            object.material.emissiveIntensity = key === id ? 0.65 : 0;
          }
        });
      renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
      for (const [key, label] of labels.current) label.classList.toggle('hovered', key === id);
      for (const [key, line] of leaders.current) line.classList.toggle('hovered', key === id);
    };
    const ray = new T.Raycaster();
    function hit(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(
        new T.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      return ray.intersectObjects(field.pickable, true)[0]?.object;
    }
    let down = { x: 0, y: 0 };
    const pointerDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const pointerMove = (e: PointerEvent) => {
      if (e.buttons || e.pointerType === 'touch') return;
      const id = hit(e)?.userData.componentId ?? null;
      if (id !== hovered) hover.current(id);
    };
    const pointerLeave = () => hover.current(null);
    const pointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      const object = hit(e),
        part = fieldComponents.find((p) => p.id === object?.userData.componentId);
      if (part) openRef.current(part);
    };
    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerleave', pointerLeave);
    canvas.addEventListener('pointerup', pointerUp);
    const resize = new ResizeObserver(() => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resize.observe(host);
    let visible = true;
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersection.observe(host);
    let lastTime = 0,
      animationTime = 0,
      lastSecond: number | undefined;
    const anchor = new T.Vector3();
    renderer.setAnimationLoop((time) => {
      if (time - lastTime < 33) return;
      const delta = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;
      if (!visible || document.hidden || latest.current.inspected) return;
      const current = latest.current;
      if (current.replay && current.replay.second !== lastSecond) {
        animationTime = current.replay.second;
        lastSecond = current.replay.second;
      }
      if (current.motion && (!current.replay || current.replay.playing))
        animationTime += delta * (current.replay?.speed ?? 1);
      for (const zone of current.state.zones) {
        const status = zoneStatus(zone, current.state, current.connected);
        field.beds
          .get(zone.id)
          ?.update(
            zone.latest?.moisture ?? 0,
            current.physicalFlow?.[zone.id] ?? status.irrigating,
            zone.id === current.selectedId,
            status.online,
            current.section,
            animationTime,
            current.motion,
          );
      }
      // Project DOM buttons into the scene. Resolve overlap without React rerenders per frame.
      camera.updateMatrixWorld();
      const width = host.clientWidth,
        height = host.clientHeight;
      const occupied: { x: number; y: number; w: number; h: number }[] = [];
      for (const part of fieldComponents) {
        const label = labels.current.get(part.id);
        if (!label) continue;
        const show = current.names && (width > 650 || !part.zoneId || part.zoneId === current.selectedId);
        const leader = leaders.current.get(part.id);
        if (leader) leader.style.display = show ? '' : 'none';
        label.hidden = !show;
        if (!show) {
          labelPositions.delete(part.id);
          continue;
        }
        anchor.copy(anchors.get(part.id)!).project(camera);
        if (anchor.z > 1 || anchor.z < -1) {
          label.hidden = true;
          if (leader) leader.style.display = 'none';
          labelPositions.delete(part.id);
          continue;
        }
        const w = label.offsetWidth,
          h = label.offsetHeight;
        let x = Math.max(4, Math.min(width - w - 4, ((anchor.x + 1) * width) / 2 - w / 2));
        if (width > 800) x = part.kind === 'sensor' || part.kind === 'emitter' ? width - w - 20 : 20;
        let y = Math.max(8, Math.min(height - h - 8, ((-anchor.y + 1) * height) / 2 - h - 20));
        for (let tries = 0; tries < 12; tries++) {
          const overlap = occupied.find(
            (p) => x < p.x + p.w + 5 && x + w + 5 > p.x && y < p.y + p.h + 4 && y + h + 4 > p.y,
          );
          if (!overlap) break;
          y = overlap.y + overlap.h + 5;
          if (y + h > height - 4) {
            y = 8;
            x = Math.min(width - w - 4, x + w + 5);
          }
        }
        occupied.push({ x, y, w, h });
        // Exponential easing remains consistent across frame rates. The line uses the same
        // interpolated position, so it stays attached to the box throughout the movement.
        const position = labelPositions.get(part.id) ?? { x, y };
        const blend = 1 - Math.exp(-12 * delta);
        position.x += (x - position.x) * blend;
        position.y += (y - position.y) * blend;
        position.x = Math.max(4, Math.min(width - w - 4, position.x));
        position.y = Math.max(4, Math.min(height - h - 4, position.y));
        labelPositions.set(part.id, position);
        label.style.transform = `translate3d(${position.x}px,${position.y}px,0)`;
        if (leader) {
          const objectX = ((anchor.x + 1) * width) / 2;
          const objectY = ((-anchor.y + 1) * height) / 2;
          leader.setAttribute('x1', String(objectX));
          leader.setAttribute('y1', String(objectY));
          leader.setAttribute('x2', String(Math.max(position.x, Math.min(position.x + w, objectX))));
          leader.setAttribute('y2', String(Math.max(position.y, Math.min(position.y + h, objectY))));
        }
      }
      renderer.render(scene, camera);
    });
    const lost = (event: Event) => {
      event.preventDefault();
      setUnavailable(true);
      renderer.setAnimationLoop(null);
    };
    canvas.addEventListener('webglcontextlost', lost);
    return () => {
      renderer.setAnimationLoop(null);
      resize.disconnect();
      intersection.disconnect();
      controls.dispose();
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerleave', pointerLeave);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('webglcontextlost', lost);
      disposeScene(scene);
      renderer.dispose();
      canvas.remove();
      hover.current = () => {};
    };
  }, []);
  return (
    <>
      <section className="field-experience" aria-label="Demonstração interativa de irrigação">
        <div className="field-toggles scene-quick-toggles" role="group" aria-label="Opções da maquete">
          <button aria-pressed={names} onClick={() => setNames(!names)}>
            {names ? 'Ocultar nomes' : 'Mostrar nomes'}
          </button>
          <button aria-pressed={motion} onClick={() => setMotion(!motion)}>
            {motion ? 'Ocultar gotejamento' : 'Animar gotejamento'}
          </button>
        </div>
        <details className="scene-options">
          <summary>Visualização e componentes</summary>
          <div className="field-toggles">
            <button aria-pressed={section} onClick={() => setSection(!section)}>
              {section ? 'Fechar corte do solo' : 'Ver corte do solo'}
            </button>
            <button onClick={() => reset.current()}>Recentrar</button>
            <button onClick={() => focusZone.current()}>Aproximar sistema selecionado</button>
          </div>
          <div className="component-directory">
            {fieldComponents.map((part) => (
              <button key={part.id} onClick={() => open(part)}>
                {part.label}
              </button>
            ))}
          </div>
        </details>
        <div className="scene-shell refined-scene">
          <div className="field-stage">
            <div ref={container} className="field-scene" hidden={unavailable} />
            {!unavailable && (
              <div className="component-labels" aria-label="Componentes na maquete">
                <svg className="tag-leaders" aria-hidden="true">
                  <defs>
                    <marker
                      id={leaderMarkerId}
                      markerWidth="8"
                      markerHeight="8"
                      refX="4"
                      refY="4"
                      markerUnits="userSpaceOnUse"
                    >
                      <circle cx="4" cy="4" r="2.7" fill="#286c55" stroke="#fff" strokeWidth="1.2" />
                    </marker>
                  </defs>
                  {fieldComponents.map((part) => (
                    <line
                      key={part.id}
                      markerStart={`url(#${leaderMarkerId})`}
                      ref={(element) => {
                        if (element) leaders.current.set(part.id, element);
                        else leaders.current.delete(part.id);
                      }}
                    />
                  ))}
                </svg>
                {fieldComponents.map((part) => (
                  <button
                    key={part.id}
                    ref={(element) => {
                      if (element) labels.current.set(part.id, element);
                      else labels.current.delete(part.id);
                    }}
                    className="component-tag"
                    hidden={!names}
                    onClick={() => open(part)}
                    onMouseEnter={() => hover.current(part.id)}
                    onMouseLeave={() => hover.current(null)}
                    onFocus={() => hover.current(part.id)}
                    onBlur={() => hover.current(null)}
                  >
                    <span aria-hidden="true">+</span>
                    {part.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {unavailable ? (
            <p className="scene-fallback">
              3D indisponível neste aparelho. Explore as descrições em Visualização e componentes e as
              medições em Entender o teste.
            </p>
          ) : null}
          <p className="scene-caption">
            Arraste para girar · pinça para aproximar · toque em um componente para explorar
            {section ? ' · raízes e bulbos de umidade ilustrativos' : ''}
            {!motion
              ? ' · gotejamento oculto'
              : props.replay && !props.replay.playing
                ? ' · gotas pausadas com a reprodução'
                : ''}
            {names && (
              <span className="mobile-label-note">No celular, os nomes destacam a área selecionada.</span>
            )}
          </p>
        </div>
      </section>
      {inspected && <ComponentInspector part={inspected} onClose={() => setInspected(null)} />}
    </>
  );
}
