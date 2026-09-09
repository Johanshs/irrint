import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Sprout, Layout } from 'lucide-react';
import { WireframesGallery } from './WireframesGallery';

export function WelcomeScreen() {
  const navigate = useNavigate();
  const [isWireframesOpen, setIsWireframesOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #2d5a4a 0%, #1e4d5c 100%)' }}>
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex items-center justify-center gap-4 mb-8">
          <Droplets className="w-16 h-16 text-white" />
          <Sprout className="w-16 h-16 text-white" />
        </div>

        <h1 className="text-white mb-4">Irrigação Inteligente</h1>
        <p className="text-white/90 mb-8">
          Gerencie suas culturas, válvulas e sensores de forma inteligente e eficiente
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-white text-[#2d5a4a] px-8 py-4 rounded-xl hover:bg-white/90 transition-colors"
          >
            Começar
          </button>

          <button
            onClick={() => setIsWireframesOpen(true)}
            className="w-full bg-white/20 text-white px-8 py-3 rounded-xl hover:bg-white/30 transition-colors flex items-center justify-center gap-2 border border-white/30"
          >
            <Layout className="w-5 h-5" />
            Ver Wireframes
          </button>

          <p className="text-white/70 mt-4">
            Sistema de monitoramento e controle inteligente
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 text-white/50">
        v1.0.0
      </div>

      <WireframesGallery
        isOpen={isWireframesOpen}
        onClose={() => setIsWireframesOpen(false)}
      />
    </div>
  );
}
