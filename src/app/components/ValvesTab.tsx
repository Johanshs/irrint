import { useState } from 'react';
import { Droplets, Power, Settings, Clock, Plus, Trash2 } from 'lucide-react';
import { ValveModal } from './ValveModal';
import { Valve } from '../types';

interface ValvesTabProps {
  valves: Valve[];
  onAddValve: (valve: { name: string; sector: string; maxFlow: number }) => void;
  onToggleValve: (id: string) => void;
  onDeleteValve: (id: string) => void;
}

export function ValvesTab({ valves, onAddValve, onToggleValve, onDeleteValve }: ValvesTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[#1a2e1a] font-bold">Controle de Válvulas</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2d5a4a] text-white px-4 py-2 rounded-lg hover:bg-[#1a3d2f] transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Nova Válvula
          </button>
        </div>
      </div>

      {valves.length === 0 ? (
        <div className="bg-white border-2 border-[#2d5a4a]/20 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-[#e8f0ed] rounded-full flex items-center justify-center mx-auto mb-4">
            <Droplets className="w-10 h-10 text-[#2d5a4a]" />
          </div>
          <h3 className="text-[#1a2e1a] mb-2 font-bold">Nenhuma válvula cadastrada</h3>
          <p className="text-[#5a7368] mb-6">
            Comece adicionando sua primeira válvula usando o botão "Nova Válvula" acima
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {valves.map((valve) => (
            <div
              key={valve.id}
              className="bg-white rounded-xl p-6 border border-[#2d5a4a]/20 shadow-sm transition-shadow hover:shadow-md relative group"
            >
              <button 
                onClick={() => {
                  if(confirm(`Tem certeza que deseja excluir a ${valve.name}?`)) {
                    onDeleteValve(valve.id);
                  }
                }}
                className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                title="Excluir válvula"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-start justify-between mb-4 pr-10">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${valve.status === 'active' ? 'bg-[#e8f0ed]' : 'bg-gray-100'}`}>
                    <Droplets className={`w-6 h-6 ${valve.status === 'active' ? 'text-[#2d5a4a]' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-[#1a2e1a] font-bold">{valve.name}</h3>
                    <span className={`text-sm font-medium ${valve.status === 'active' ? 'text-[#4a8c6f]' : 'text-gray-400'}`}>
                      {valve.status === 'active' ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onToggleValve(valve.id)}
                  className={`p-3 rounded-xl transition-all shadow-sm ${
                    valve.status === 'active'
                      ? 'bg-[#4a8c6f] text-white hover:bg-[#2d5a4a]'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={valve.status === 'active' ? 'Desligar' : 'Ligar'}
                >
                  <Power className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#2d5a4a]/10">
                <div className="flex items-center justify-between">
                  <span className="text-[#5a7368]">Fluxo</span>
                  <span className="text-[#1a2e1a] font-mono">{valve.flow} L/min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5a7368]">Pressão</span>
                  <span className="text-[#1a2e1a] font-mono">{valve.pressure.toFixed(1)} bar</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5a7368] flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Última ativação
                  </span>
                  <span className="text-[#1a2e1a] text-sm">{valve.lastActive}</span>
                </div>
              </div>

              {valve.status === 'active' && (
                <div className="mt-4 pt-4 border-t border-[#2d5a4a]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-[#e8f0ed] rounded-full h-2">
                      <div
                        className="bg-[#2d5a4a] h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (valve.flow / 60) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-[#5a7368] font-mono">
                      {Math.round(Math.min(100, (valve.flow / 60) * 100))}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ValveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddValve}
        nextIndex={valves.length + 1}
      />
    </div>
  );
}
