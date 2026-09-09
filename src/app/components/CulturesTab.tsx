import { Sprout, Calendar, MapPin, TrendingUp, Droplets, Clock, Zap, Sparkles, Timer, Gauge, Settings2, CloudRain, Waves, Trash2 } from 'lucide-react';

import { Culture } from '../types';

interface CulturesTabProps {
  cultures: Culture[];
  onSetActive: (id: string) => void;
  onDeleteCulture: (id: string) => void;
}

const CULTURE_EMOJIS: Record<string, string> = {
  horta: '🌱', jardim: '🌺', gramado: '🌿', tomate: '🍅',
  alface: '🥬', milho: '🌽', cafe: '☕', soja: '🫘',
  morango: '🍓', feijao: '🫘', outro: '🌾',
};

const IRRIGATION_LABELS: Record<string, { label: string; icon: any }> = {
  gotejamento:   { label: 'Gotejamento',   icon: Droplets },
  aspersao:      { label: 'Aspersão',      icon: CloudRain },
  microaspersao: { label: 'Microaspersão',  icon: Waves },
  mangueira:     { label: 'Mangueira',     icon: Droplets },
  sulcos:        { label: 'Sulcos',        icon: Waves },
  pivo:          { label: 'Pivô Central',  icon: Settings2 },
};

const FREQUENCY_LABELS: Record<string, string> = {
  diario: 'Diário',
  '2dias': 'A cada 2 dias',
  '3dias': 'A cada 3 dias',
  semanal: 'Semanal',
};

export function CulturesTab({ cultures, onSetActive, onDeleteCulture }: CulturesTabProps) {
  const calculateDaysPlanted = (plantDate: string) => {
    const planted = new Date(plantDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - planted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getGrowthStage = (days: number) => {
    if (days < 15) return { stage: 'Germinação', color: 'bg-[#e8a836]', progress: 20 };
    if (days < 45) return { stage: 'Desenvolvimento', color: 'bg-[#2e6b7a]', progress: 50 };
    if (days < 90) return { stage: 'Crescimento', color: 'bg-[#4a8c6f]', progress: 75 };
    return { stage: 'Maturação', color: 'bg-[#2d5a4a]', progress: 100 };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1a2e1a]">Meus Plantios</h2>
          <p className="text-[#5a7368] mt-1">Gerencie todos os plantios da sua propriedade</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#e8f0ed] rounded-lg border border-[#2d5a4a]/20">
          <Sprout className="w-5 h-5 text-[#2d5a4a]" />
          <span className="text-[#1a2e1a] font-medium">{cultures.length} Plantio{cultures.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {cultures.length === 0 ? (
        <div className="bg-white border-2 border-[#2d5a4a]/20 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-[#e8f0ed] rounded-full flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-10 h-10 text-[#2d5a4a]" />
          </div>
          <h3 className="text-[#1a2e1a] mb-2">Nenhum plantio cadastrado</h3>
          <p className="text-[#5a7368] mb-6">
            Comece adicionando seu primeiro plantio usando o botão + no topo da página
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cultures.map((culture) => {
            const daysPlanted = calculateDaysPlanted(culture.plantDate);
            const growth = getGrowthStage(daysPlanted);
            const plantDateFormatted = new Date(culture.plantDate).toLocaleDateString('pt-BR');
            const emoji = culture.cultureType ? CULTURE_EMOJIS[culture.cultureType] || '🌾' : '🌱';
            const irrigation = culture.automation ? IRRIGATION_LABELS[culture.automation.irrigationType] : null;
            const IrrigIcon = irrigation?.icon || Droplets;

            return (
              <div
                key={culture.id}
                className={`bg-white rounded-xl overflow-hidden border transition-all relative group ${
                  culture.isActive 
                    ? 'border-[#2d5a4a] shadow-md ring-1 ring-[#2d5a4a]/20' 
                    : 'border-[#2d5a4a]/20 hover:border-[#2d5a4a]/40 shadow-sm hover:shadow-md'
                }`}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm(`Tem certeza que deseja excluir o plantio ${culture.name}?`)) {
                      onDeleteCulture(culture.id);
                    }
                  }}
                  className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 z-10"
                  title="Excluir plantio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6 pr-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                        culture.isActive ? 'bg-[#2d5a4a]' : 'bg-[#e8f0ed]'
                      }`}>
                        {culture.isActive ? (
                          <Sprout className="w-7 h-7 text-white" />
                        ) : (
                          <span>{emoji}</span>
                        )}
                      </div>
                    <div>
                      <h3 className="text-[#1a2e1a]">{culture.name}</h3>
                      {culture.isActive && (
                        <span className="text-xs bg-[#e8f0ed] text-[#2d5a4a] px-2 py-1 rounded-full font-medium">
                          Ativo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 bg-[#f8faf9] rounded-lg">
                    <div className="flex items-center gap-2 text-[#5a7368]">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Área</span>
                    </div>
                    <span className="text-[#1a2e1a] font-medium">{culture.area}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#f8faf9] rounded-lg">
                    <div className="flex items-center gap-2 text-[#5a7368]">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Plantio</span>
                    </div>
                    <span className="text-[#1a2e1a] font-medium">{plantDateFormatted}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#f8faf9] rounded-lg">
                    <div className="flex items-center gap-2 text-[#5a7368]">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Dias plantado</span>
                    </div>
                    <span className="text-[#1a2e1a] font-medium">{daysPlanted} dias</span>
                  </div>

                  {culture.automation && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-medium">Automação: {culture.automation.mode === 'automatic' ? 'Ativa (IA)' : 'Agendada'}</span>
                      </div>
                      <span className="text-blue-800 font-bold text-sm">
                        {culture.automation.mode === 'automatic' 
                          ? `Gatilho: < ${culture.automation.minHumidity}%` 
                          : FREQUENCY_LABELS[culture.automation.frequency] || culture.automation.frequency}
                      </span>
                    </div>
                  )}
                </div>

                {/* Growth Stage */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#5a7368]">Estágio de Crescimento</span>
                    <span className="text-sm font-medium text-[#1a2e1a]">{growth.stage}</span>
                  </div>
                  <div className="h-3 bg-[#e8f0ed] rounded-full overflow-hidden">
                    <div
                      className={`h-3 ${growth.color} rounded-full transition-all`}
                      style={{ width: `${growth.progress}%` }}
                    />
                  </div>
                </div>

                {/* Automation Info */}
                {culture.automation && (
                  <div className="mb-4 pt-3 border-t-2 border-[#2d5a4a]/10">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Settings2 className="w-3.5 h-3.5 text-[#2d5a4a]" />
                      <span className="text-xs font-semibold text-[#2d5a4a] uppercase tracking-wide">Automação</span>
                    </div>
                    <div className="space-y-2">
                      {/* Irrigation Type */}
                      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#f0f7f4] to-[#edf5f8] rounded-lg">
                        <div className="flex items-center gap-2 text-[#5a7368]">
                          <IrrigIcon className="w-3.5 h-3.5" />
                          <span className="text-xs">Irrigação</span>
                        </div>
                        <span className="text-xs font-medium text-[#1a2e1a]">{irrigation?.label || culture.automation.irrigationType}</span>
                      </div>

                      {/* Schedules */}
                      <div className="flex items-center justify-between px-3 py-2 bg-[#f8faf9] rounded-lg">
                        <div className="flex items-center gap-2 text-[#5a7368]">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs">Horários</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {culture.automation.schedules.map((t) => (
                            <span key={t} className="text-[10px] bg-[#2d5a4a] text-white px-1.5 py-0.5 rounded-full font-medium">{t}</span>
                          ))}
                        </div>
                      </div>

                      {/* Duration & Frequency */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#f8faf9] rounded-lg">
                          <Timer className="w-3.5 h-3.5 text-[#5a7368]" />
                          <span className="text-xs text-[#1a2e1a] font-medium">{culture.automation.durationMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#f8faf9] rounded-lg">
                          <Calendar className="w-3.5 h-3.5 text-[#5a7368]" />
                          <span className="text-xs text-[#1a2e1a] font-medium">{FREQUENCY_LABELS[culture.automation.frequency] || culture.automation.frequency}</span>
                        </div>
                      </div>

                      {/* Mode & Humidity */}
                      <div className="flex items-center justify-between px-3 py-2 bg-[#f8faf9] rounded-lg">
                        <div className="flex items-center gap-2 text-[#5a7368]">
                          {culture.automation.mode === 'automatic' ? (
                            <Zap className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span className="text-xs">Modo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#1a2e1a]">
                            {culture.automation.mode === 'automatic' ? 'Automático' : 'Agendado'}
                          </span>
                          <span className="text-[10px] bg-[#e8f0ed] text-[#2d5a4a] px-1.5 py-0.5 rounded-full font-medium">
                            <Gauge className="w-2.5 h-2.5 inline mr-0.5" />{culture.automation.minHumidity}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => onSetActive(culture.id)}
                  className={`w-full py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 ${
                    culture.isActive 
                      ? 'bg-[#e8f0ed] text-[#2d5a4a] hover:bg-[#d1e2dc] border-2 border-[#2d5a4a]/20'
                      : 'bg-[#2d5a4a] text-white hover:bg-[#1a3d2f]'
                  }`}
                >
                  {culture.isActive ? (
                    <>✓ Plantio Ativo (Clique para desativar)</>
                  ) : (
                    <><Droplets className="w-4 h-4" /> Ativar Plantio</>
                  )}
                </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Card */}
      {cultures.length > 0 && (
        <div className="bg-gradient-to-r from-[#e8f0ed] to-[#e6f3f7] border-2 border-[#2d5a4a]/20 rounded-2xl p-6">
          <h3 className="text-[#1a2e1a] mb-4">Resumo Geral</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[#5a7368] mb-1">Total de Plantios</p>
              <p className="text-2xl font-medium text-[#1a2e1a]">{cultures.length}</p>
            </div>
            <div>
              <p className="text-[#5a7368] mb-1">Plantios Ativos</p>
              <p className="text-2xl font-medium text-[#4a8c6f]">
                {cultures.filter(c => c.isActive).length}
              </p>
            </div>
            <div>
              <p className="text-[#5a7368] mb-1">Automações</p>
              <p className="text-2xl font-medium text-[#2e6b7a]">
                {cultures.filter(c => c.automation).length}
              </p>
            </div>
            <div>
              <p className="text-[#5a7368] mb-1">Sistema</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#4a8c6f] rounded-full animate-pulse" />
                <p className="text-sm font-medium text-[#4a8c6f]">Online</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
