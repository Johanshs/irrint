import { useState } from 'react';
import { Thermometer, Droplets, Wind, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { SensorModal } from './SensorModal';
import { Sensor } from '../types';

interface SensorsTabProps {
  sensors: Sensor[];
  onAddSensor: (sensor: { name: string; location: string; type: string }) => void;
  onDeleteSensor: (id: string) => void;
}

export function SensorsTab({ sensors, onAddSensor, onDeleteSensor }: SensorsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'dry':
        return { label: 'Solo Seco', color: 'text-[#e8a836]', bgColor: 'bg-[#fff4e6]', icon: AlertCircle };
      case 'wet':
        return { label: 'Solo Úmido', color: 'text-[#1e4d5c]', bgColor: 'bg-[#e6f3f7]', icon: Droplets };
      case 'error':
      case 'anomaly':
        return { label: 'Erro/Anomalia', color: 'text-red-500', bgColor: 'bg-red-50', icon: AlertCircle };
      default:
        return { label: 'Normal', color: 'text-[#4a8c6f]', bgColor: 'bg-[#e8f0ed]', icon: Droplets };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[#1a2e1a] font-bold">Monitoramento de Sensores</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2d5a4a] text-white px-4 py-2 rounded-lg hover:bg-[#1a3d2f] transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Novo Sensor
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#e8f0ed] rounded-lg">
            <div className="w-2 h-2 rounded-full bg-[#4a8c6f] animate-pulse" />
            <span className="text-sm text-[#1a2e1a] font-medium">Online</span>
          </div>
        </div>
      </div>

      {sensors.length === 0 ? (
        <div className="bg-white border-2 border-[#2d5a4a]/20 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-[#e8f0ed] rounded-full flex items-center justify-center mx-auto mb-4">
            <Thermometer className="w-10 h-10 text-[#2d5a4a]" />
          </div>
          <h3 className="text-[#1a2e1a] mb-2 font-bold">Nenhum sensor cadastrado</h3>
          <p className="text-[#5a7368] mb-6">
            Comece adicionando seu primeiro sensor usando o botão "Novo Sensor" acima
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sensors.map((sensor) => {
              const statusInfo = getStatusInfo(sensor.status);
              const StatusIcon = statusInfo.icon;
              return (
                <div key={sensor.id} className="bg-white rounded-xl p-6 border border-[#2d5a4a]/20 shadow-sm hover:shadow-md transition-shadow relative group">
                  <button 
                    onClick={() => {
                      if(confirm(`Tem certeza que deseja excluir o ${sensor.name}?`)) {
                        onDeleteSensor(sensor.id);
                      }
                    }}
                    className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 z-10"
                    title="Excluir sensor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-start justify-between mb-4 pr-10">
                    <div>
                      <h3 className="text-[#1a2e1a] mb-1 font-bold">{sensor.name}</h3>
                      <span className="text-sm text-[#5a7368]">{sensor.location}</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className={`px-3 py-1.5 rounded-lg ${statusInfo.bgColor} flex items-center gap-2 inline-flex`}>
                      <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                      <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-[#5a7368]">
                          <Droplets className="w-4 h-4" />
                          <span>Umidade do Solo</span>
                        </div>
                        <span className="text-[#1a2e1a] font-mono">{sensor.humidity}%</span>
                      </div>
                      <div className="w-full bg-[#e8f0ed] rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            sensor.humidity < 40 ? 'bg-[#e8a836]' :
                            sensor.humidity > 80 ? 'bg-[#1e4d5c]' :
                            'bg-[#2d5a4a]'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, sensor.humidity))}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-3 border-t border-[#2d5a4a]/10">
                      <div className="flex items-center gap-2 text-[#5a7368]">
                        <Thermometer className="w-4 h-4" />
                        <span>Temperatura</span>
                      </div>
                      <span className="text-[#1a2e1a] font-mono">{sensor.temp.toFixed(1)}°C</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-t border-[#2d5a4a]/10">
                      <div className="flex items-center gap-2 text-[#5a7368]">
                        <Wind className="w-4 h-4" />
                        <span>Pressão Atmosférica</span>
                      </div>
                      <span className="text-[#1a2e1a] font-mono">{sensor.pressure} hPa</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-[#e8f0ed] to-[#e6f3f7] rounded-xl p-6 border border-[#2d5a4a]/20 shadow-sm">
            <h3 className="text-[#1a2e1a] mb-4 font-bold">Resumo do Sistema</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/50 p-4 rounded-lg">
                <p className="text-[#5a7368] mb-1 text-sm font-medium">Umidade Média</p>
                <p className="text-[#1a2e1a] text-2xl font-bold font-mono">
                  {Math.round(sensors.reduce((acc, s) => acc + s.humidity, 0) / Math.max(1, sensors.length))}%
                </p>
              </div>
              <div className="bg-white/50 p-4 rounded-lg">
                <p className="text-[#5a7368] mb-1 text-sm font-medium">Temperatura Média</p>
                <p className="text-[#1a2e1a] text-2xl font-bold font-mono">
                  {(sensors.reduce((acc, s) => acc + s.temp, 0) / Math.max(1, sensors.length)).toFixed(1)}°C
                </p>
              </div>
              <div className="bg-white/50 p-4 rounded-lg">
                <p className="text-[#5a7368] mb-1 text-sm font-medium">Sensores Ativos</p>
                <p className="text-[#1a2e1a] text-2xl font-bold font-mono">{sensors.length} de {sensors.length}</p>
              </div>
              <div className="bg-white/50 p-4 rounded-lg">
                <p className="text-[#5a7368] mb-1 text-sm font-medium">Alertas Ativos</p>
                <p className="text-[#e8a836] text-2xl font-bold font-mono">{sensors.filter(s => s.status !== 'ok').length}</p>
              </div>
            </div>
          </div>
        </>
      )}

      <SensorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAddSensor}
        nextIndex={sensors.length + 1}
      />
    </div>
  );
}
