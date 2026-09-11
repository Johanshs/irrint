import { useEffect, useRef, useState } from 'react';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { componentCatalog, type FieldComponent } from './components';
import { createComponent, disposeScene } from './models';

export function ComponentInspector({ part, onClose }: { part: FieldComponent; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null),
    host = useRef<HTMLDivElement>(null);
  const [spinning, setSpinning] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const spin = useRef(spinning);
  spin.current = spinning;
  const reset = useRef(() => {});
  const detail = componentCatalog[part.kind];
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    const container = host.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      setUnavailable(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute(
      'aria-label',
      `Modelo 3D de ${detail.name}. Arraste para examinar, use pinça ou roda do mouse para aproximar.`,
    );
    container.appendChild(renderer.domElement);
    const scene = new T.Scene();
    scene.add(new T.HemisphereLight('#ffffff', '#6d9387', 3));
    const key = new T.DirectionalLight('#fff0d3', 4);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new T.DirectionalLight('#9ddced', 2);
    rim.position.set(-3, 1, -2);
    scene.add(rim);
    const model = createComponent(part.kind);
    scene.add(model);
    const bounds = new T.Box3().setFromObject(model),
      center = bounds.getCenter(new T.Vector3()),
      size = bounds.getSize(new T.Vector3());
    model.position.sub(center);
    const extent = Math.max(size.x, size.y, size.z);
    const camera = new T.PerspectiveCamera(37, 1, 0.01, 50);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.autoRotateSpeed = 1.2;
    controls.minDistance = extent * 0.8;
    controls.maxDistance = extent * 5;
    reset.current = () => {
      camera.position.set(extent * 1.2, extent * 1.4, extent * 2.3);
      controls.target.set(0, 0, 0);
      controls.update();
    };
    reset.current();
    const resize = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    resize.observe(container);
    let last = 0;
    renderer.setAnimationLoop((time) => {
      if (time - last < 33) return;
      const delta = Math.min(0.1, (time - last) / 1000);
      last = time;
      if (document.hidden) return;
      controls.autoRotate = spin.current;
      controls.update(delta);
      renderer.render(scene, camera);
    });
    const lost = (event: Event) => {
      event.preventDefault();
      setUnavailable(true);
      renderer.setAnimationLoop(null);
    };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    return () => {
      renderer.setAnimationLoop(null);
      resize.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [part.kind, detail.name]);
  return (
    <dialog
      ref={dialog}
      className="component-inspector"
      aria-labelledby="inspector-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="inspector-header">
        <div>
          <span className="eyebrow">
            COMPONENTE EM DETALHE ·{' '}
            {part.zoneId ? (part.zoneId === 'north' ? 'ÁREA NORTE' : 'ÁREA SUL') : 'ABASTECIMENTO'}
          </span>
          <h2 id="inspector-title">{detail.name}</h2>
        </div>
        <button
          className="inspector-close"
          autoFocus
          onClick={onClose}
          aria-label="Fechar detalhes do componente"
        >
          ✕
        </button>
      </div>
      <div className="inspector-body">
        <div className="object-stage">
          <div ref={host} className="object-preview" hidden={unavailable} />
          {unavailable && (
            <p className="scene-fallback">
              Modelo 3D indisponível. A descrição do componente está disponível ao lado.
            </p>
          )}
          <span className="object-badge">EXEMPLO DE HARDWARE</span>
          <div className="object-tools">
            <button onClick={() => setSpinning(!spinning)} aria-pressed={spinning}>
              {spinning ? 'Pausar rotação' : 'Girar objeto'}
            </button>
            <button onClick={() => reset.current()}>Recentrar objeto</button>
          </div>
          <p>Arraste para examinar todos os lados</p>
        </div>
        <div className="object-description">
          <p className="object-example">{detail.example}</p>
          <p>{detail.description}</p>
          <h3>O que você está vendo</h3>
          <ul>
            {detail.details.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="integration-note">
            <h3>Como se conecta à proposta</h3>
            <p>{detail.integration}</p>
          </div>
          <p className="small-note">
            Modelo ilustrativo, com detalhes ampliados. O foco do Irrint é o software e seu contrato de
            comunicação; a placa exibida não define um fabricante obrigatório.
          </p>
        </div>
      </div>
    </dialog>
  );
}
