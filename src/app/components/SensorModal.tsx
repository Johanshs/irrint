import { useState } from 'react';
import { X, Plus, Thermometer } from 'lucide-react';

interface SensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (sensor: { name: string; location: string; type: string }) => void;
  nextIndex?: number;
}

export function SensorModal({ isOpen, onClose, onAdd, nextIndex = 1 }: SensorModalProps) {
  const [customName, setCustomName] = useState('');
  const [location, setLocation] = useState('');
  const [sensorType, setSensorType] = useState('umidade');

  const autoName = `Sensor ${nextIndex}`;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customName.trim() || autoName;
    if (location) {
      onAdd({
        name: `${finalName} - Setor ${location}`,
        location,
        type: sensorType,
      });
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setCustomName('');
    setLocation('');
    setSensorType('umidade');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#2d5a4a]/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#e8f0ed] rounded-xl flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-[#2d5a4a]" />
            </div>
            <h2 className="text-[#1a2e1a] text-lg font-semibold">+ Sensor</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#5a7368]" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name (optional) */}
            <div>
              <label className="block mb-1.5 text-sm font-medium text-[#1a2e1a]">
                Nome do Sensor
                <span className="ml-2 text-xs text-[#5a7368] font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={`Ex: ${autoName}`}
                className="w-full px-4 py-3 bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a] text-[#1a2e1a] placeholder:text-[#9aafa8]"
              />
              <p className="mt-1.5 text-xs text-[#9aafa8]">
                Se não informado, será criado como <span className="font-medium text-[#5a7368]">{autoName}</span>
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block mb-1.5 text-sm font-medium text-[#1a2e1a]">Localização / Setor</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Norte, Sul, Estufa 1..."
                className="w-full px-4 py-3 bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a] text-[#1a2e1a] placeholder:text-[#9aafa8]"
                required
              />
            </div>

            {/* Sensor Type */}
            <div>
              <label className="block mb-1.5 text-sm font-medium text-[#1a2e1a]">Tipo de Sensor</label>
              <select
                value={sensorType}
                onChange={(e) => setSensorType(e.target.value)}
                className="w-full px-4 py-3 bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a] text-[#1a2e1a]"
              >
                <option value="umidade">Umidade do Solo</option>
                <option value="temperatura">Temperatura</option>
                <option value="pressao">Pressão Atmosférica</option>
                <option value="completo">Completo (Umidade + Temp + Pressão)</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[#2d5a4a] text-white px-6 py-3 rounded-xl hover:bg-[#1a3d2f] transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Adicionar Sensor
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
