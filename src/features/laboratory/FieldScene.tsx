import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Snapshot } from '../../../shared/contracts';
import { zoneStatus } from '../irrigation/session';
import { createField } from './field-model';
import { disposeScene } from './models';
import { fieldComponents, type FieldComponent } from './components';
import { ComponentInspector } from './ComponentInspector';
import { WaterPanel } from './WaterPanel';
import './laboratory.css';

interface Props {
  state: Snapshot;
  connected: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  replay?: { second: number; playing: boolean; speed: number };
  onInspect?: () => void;
}

/** The renderer observes snapshots. No frame, gesture or inspection sends control commands. */
export default function FieldScene(props: Props) {
  const container = useRef<HTMLDivElement>(null),
    labels = useRef(new Map<string, HTMLButtonElement>());
  const leaders = useRef(new Map<string, SVGLineElement>());
  const [names, setNames] = useState(true),
    [section, setSection] = useState(false);
  const [motion, setMotion] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [inspected, setInspected] = useState<FieldComponent | null>(null),
    [unavailable, setUnavailable] = useState(false);
  const latest = useRef({ ...props, names, section, inspected, motion });
  latest.current = { ...props, names, section, inspected, motion };
  const reset = useRef(() => {}),
    focusZone = useRef(() => {}),
    rotate = useRef((_: number) => {}),
    hover = useRef((_: string | null) => {});
  const open = (part: FieldComponent) => {
    props.onInspect?.();
    if (part.zoneId) props.onSelect(part.zoneId);
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
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute(
      'aria-label',
      'Campo 3D com dois canteiros, sensores, microcontroladores e irrigação por gotejamento. Os componentes também estão disponíveis nos botões abaixo.',
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
    rotate.current = (direction) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(new T.Vector3(0, 1, 0), (direction * Math.PI) / 8);
      camera.position.copy(controls.target).add(offset);
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
      else if (object?.userData.zoneId) latest.current.onSelect(object.userData.zoneId);
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
    const bounds = new T.Box3(),
      anchor = new T.Vector3();
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
            status.irrigating,
            zone.id === current.selectedId,
            status.online,
            current.section,
            animationTime,
          );
      }
      // Project DOM buttons into the scene. Resolve overlap without React rerenders per frame.
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
        if (!show) continue;
        bounds.setFromObject(field.parts.get(part.id)!);
        bounds.getCenter(anchor);
        anchor.y = bounds.max.y + 0.13;
        anchor.project(camera);
        if (anchor.z > 1 || anchor.z < -1) {
          label.hidden = true;
          if (leader) leader.style.display = 'none';
          continue;
        }
        const w = label.offsetWidth,
          h = label.offsetHeight;
        let x = Math.max(4, Math.min(width - w - 4, ((anchor.x + 1) * width) / 2 - w / 2));
        if (width > 800) x = part.kind === 'sensor' || part.kind === 'emitter' ? width - w - 20 : 20;
        let y = Math.max(8, Math.min(height - h - 8, ((-anchor.y + 1) * height) / 2 - h));
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
        label.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
        if (leader) {
          leader.setAttribute('x1', String(((anchor.x + 1) * width) / 2));
          leader.setAttribute('y1', String(((-anchor.y + 1) * height) / 2 + 5));
          leader.setAttribute('x2', String(x + w / 2));
          leader.setAttribute('y2', String(y + h / 2));
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
        <div className="field-toolbar">
          <div>
            <span className="eyebrow">EXPLORE O SISTEMA</span>
            <h2>Do sensor à água no solo</h2>
          </div>
          <div className="field-toggles">
            <button aria-pressed={motion} onClick={() => setMotion(!motion)}>
              {motion ? 'Pausar efeitos' : 'Animar água'}
            </button>
            <button aria-pressed={names} onClick={() => setNames(!names)}>
              {names ? 'Ocultar nomes' : 'Mostrar nomes'}
            </button>
            <button aria-pressed={section} onClick={() => setSection(!section)}>
              {section ? 'Fechar corte do solo' : 'Ver corte do solo'}
            </button>
          </div>
        </div>
        <div className="scene-shell refined-scene">
          <div className="field-stage">
            <div ref={container} className="field-scene" hidden={unavailable} />
            {!unavailable && (
              <div className="component-labels" aria-label="Componentes na maquete">
                <svg className="tag-leaders" aria-hidden="true">
                  {fieldComponents.map((part) => (
                    <line
                      key={part.id}
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
              3D indisponível neste aparelho. Explore os componentes e as medições nos botões abaixo.
            </p>
          ) : (
            <div className="field-camera">
              <button onClick={() => rotate.current(-1)} aria-label="Girar maquete para a esquerda">
                ↶
              </button>
              <button onClick={() => reset.current()}>Recentrar</button>
              <button onClick={() => focusZone.current()}>Aproximar área</button>
              <button onClick={() => rotate.current(1)} aria-label="Girar maquete para a direita">
                ↷
              </button>
            </div>
          )}
          <p className="scene-caption">
            Arraste para girar · pinça para aproximar · toque em um componente para explorar
            {section ? ' · raízes e bulbos de umidade ilustrativos' : ''}
            <span className="mobile-label-note">No celular, os nomes destacam a área selecionada.</span>
          </p>
        </div>
        <WaterPanel
          state={props.state}
          connected={props.connected}
          selectedId={props.selectedId}
          replay={!!props.replay}
        />
        <details className="component-directory">
          <summary>Explorar componentes · acessível por toque e teclado</summary>
          <div>
            {fieldComponents.map((part) => (
              <button key={part.id} onClick={() => open(part)}>
                {part.label} <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </details>
        <ol className="system-path">
          <li>
            <b>01 · Medir</b>
            <span>Sensor envia o índice do solo</span>
          </li>
          <li>
            <b>02 · Decidir</b>
            <span>API aplica os limites da área</span>
          </li>
          <li>
            <b>03 · Confirmar</b>
            <span>Dispositivo executa o comando</span>
          </li>
          <li>
            <b>04 · Irrigar</b>
            <span>Válvula libera o gotejamento</span>
          </li>
        </ol>
      </section>
      {inspected && <ComponentInspector part={inspected} onClose={() => setInspected(null)} />}
    </>
  );
}
