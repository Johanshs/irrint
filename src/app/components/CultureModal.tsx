import { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Droplets, Thermometer, Check, ChevronRight, ChevronLeft, Clock, Zap, Sun, CloudRain, ArrowRight, Sprout, Timer, Gauge, CalendarDays, Settings2, Waves } from 'lucide-react';

interface Valve {
  id: number;
  name: string;
  status: string;
  flow: number;
  pressure: number;
  lastActive: string;
}

interface Sensor {
  id: number;
  name: string;
  humidity: number;
  temp: number;
  pressure: number;
  status: string;
  location: string;
}

export interface AutomationConfig {
  irrigationType: string;
  schedules: string[];
  durationMinutes: number;
  frequency: string;
  minHumidity: number;
  mode: 'automatic' | 'scheduled';
}

interface CultureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (culture: {
    name: string;
    area: string;
    plantDate: string;
    valveIds: number[];
    sensorIds: number[];
    cultureType: string;
    automation: AutomationConfig;
  }) => void;
  nextIndex?: number;
  valves: Valve[];
  sensors: Sensor[];
}

// ── Culture type data ──────────────────────────────────────────
const CULTURE_TYPES = [
  { id: 'horta',    label: 'Horta',     emoji: '🌱', desc: 'Horta caseira ou comunitária' },
  { id: 'jardim',   label: 'Jardim',    emoji: '🌺', desc: 'Plantas ornamentais e flores' },
  { id: 'gramado',  label: 'Gramado',   emoji: '🌿', desc: 'Grama e cobertura verde' },
  { id: 'tomate',   label: 'Tomate',    emoji: '🍅', desc: 'Solanum lycopersicum' },
  { id: 'alface',   label: 'Alface',    emoji: '🥬', desc: 'Lactuca sativa' },
  { id: 'milho',    label: 'Milho',     emoji: '🌽', desc: 'Zea mays' },
  { id: 'cafe',     label: 'Café',      emoji: '☕', desc: 'Coffea arabica / robusta' },
  { id: 'soja',     label: 'Soja',      emoji: '🫘', desc: 'Glycine max' },
  { id: 'morango',  label: 'Morango',   emoji: '🍓', desc: 'Fragaria × ananassa' },
  { id: 'feijao',   label: 'Feijão',    emoji: '🫘', desc: 'Phaseolus vulgaris' },
  { id: 'outro',    label: 'Outro',     emoji: '🌾', desc: 'Tipo personalizado' },
];

// ── Irrigation types ───────────────────────────────────────────
const IRRIGATION_TYPES = [
  { id: 'gotejamento',   label: 'Gotejamento',   icon: Droplets,   desc: 'Água direto na raiz, economia máxima de água', color: '#2d5a4a' },
  { id: 'aspersao',      label: 'Aspersão',      icon: CloudRain,  desc: 'Cobertura ampla, simula chuva sobre a área', color: '#1e4d5c' },
  { id: 'microaspersao', label: 'Microaspersão',  icon: Waves,      desc: 'Equilíbrio entre gotejamento e aspersão', color: '#3a6b5a' },
  { id: 'mangueira',     label: 'Mangueira',     icon: Droplets,   desc: 'Irrigação manual com controle de válvula', color: '#4a7c6a' },
  { id: 'sulcos',        label: 'Sulcos',        icon: Waves,      desc: 'Tradicional, ideal para fileiras', color: '#5a8368' },
  { id: 'pivo',          label: 'Pivô Central',  icon: Settings2,  desc: 'Para grandes áreas, alta eficiência', color: '#2e6b7a' },
];

const FREQUENCY_OPTIONS = [
  { id: 'diario',      label: 'Diário' },
  { id: '2dias',       label: 'A cada 2 dias' },
  { id: '3dias',       label: 'A cada 3 dias' },
  { id: 'semanal',     label: 'Semanal' },
];

// ── AI Suggestion Engine ───────────────────────────────────────
interface AISuggestion {
  irrigationType: string;
  irrigationReason: string;
  schedules: string[];
  schedulesReason: string;
  durationMinutes: number;
  durationReason: string;
  frequency: string;
  frequencyReason: string;
  minHumidity: number;
  humidityReason: string;
  mode: 'automatic' | 'scheduled';
  modeReason: string;
}

function getAISuggestions(cultureType: string, metricType: string, metricValue: number): AISuggestion {
  const baseData: Record<string, Omit<AISuggestion, 'durationReason' | 'schedulesReason' | 'frequencyReason' | 'humidityReason' | 'modeReason' | 'irrigationReason'>> = {
    horta: {
      irrigationType: 'gotejamento',
      schedules: ['06:00', '17:00'],
      durationMinutes: 20,
      frequency: 'diario',
      minHumidity: 60,
      mode: 'automatic',
    },
    jardim: {
      irrigationType: 'microaspersao',
      schedules: ['06:30', '17:30'],
      durationMinutes: 15,
      frequency: 'diario',
      minHumidity: 55,
      mode: 'scheduled',
    },
    gramado: {
      irrigationType: 'aspersao',
      schedules: ['06:00'],
      durationMinutes: 30,
      frequency: '2dias',
      minHumidity: 45,
      mode: 'scheduled',
    },
    tomate: {
      irrigationType: 'gotejamento',
      schedules: ['06:00', '17:00'],
      durationMinutes: 30,
      frequency: 'diario',
      minHumidity: 60,
      mode: 'automatic',
    },
    alface: {
      irrigationType: 'microaspersao',
      schedules: ['06:00', '12:00', '17:00'],
      durationMinutes: 15,
      frequency: 'diario',
      minHumidity: 70,
      mode: 'automatic',
    },
    milho: {
      irrigationType: 'aspersao',
      schedules: ['06:00', '18:00'],
      durationMinutes: 45,
      frequency: '2dias',
      minHumidity: 50,
      mode: 'automatic',
    },
    cafe: {
      irrigationType: 'gotejamento',
      schedules: ['06:00'],
      durationMinutes: 60,
      frequency: '3dias',
      minHumidity: 45,
      mode: 'automatic',
    },
    soja: {
      irrigationType: 'pivo',
      schedules: ['05:30', '17:30'],
      durationMinutes: 40,
      frequency: 'diario',
      minHumidity: 55,
      mode: 'automatic',
    },
    morango: {
      irrigationType: 'gotejamento',
      schedules: ['07:00', '16:00'],
      durationMinutes: 20,
      frequency: 'diario',
      minHumidity: 65,
      mode: 'automatic',
    },
    feijao: {
      irrigationType: 'aspersao',
      schedules: ['06:00', '17:00'],
      durationMinutes: 35,
      frequency: 'diario',
      minHumidity: 55,
      mode: 'automatic',
    },
    outro: {
      irrigationType: 'gotejamento',
      schedules: ['06:00', '18:00'],
      durationMinutes: 25,
      frequency: 'diario',
      minHumidity: 55,
      mode: 'automatic',
    },
  };

  const data = baseData[cultureType] || baseData.outro;

  // Adjust duration based on area
  let durationMultiplier = 1;
  if (metricType === 'ha' && metricValue > 5) durationMultiplier = 1.5;
  else if (metricType === 'ha' && metricValue > 2) durationMultiplier = 1.25;
  else if (metricType === 'm2' && metricValue > 1000) durationMultiplier = 1.3;
  else if (metricType === 'mudas' && metricValue > 500) durationMultiplier = 1.2;

  const adjustedDuration = Math.round(data.durationMinutes * durationMultiplier);

  const cultureLabel = CULTURE_TYPES.find(c => c.id === cultureType)?.label || 'este tipo de plantio';
  const irrigLabel = IRRIGATION_TYPES.find(i => i.id === data.irrigationType)?.label || data.irrigationType;

  // Reasons
  const irrigationReasons: Record<string, string> = {
    gotejamento: `${irrigLabel} é ideal para ${cultureLabel} — entrega água diretamente na zona radicular, reduzindo desperdício por evaporação em até 40%.`,
    aspersao: `${irrigLabel} oferece cobertura uniforme para ${cultureLabel} — simula chuva natural e é eficiente para áreas abertas.`,
    microaspersao: `${irrigLabel} combina precisão com cobertura moderada — perfeito para ${cultureLabel} que precisa de umidade uniforme sem encharcamento.`,
    mangueira: `Irrigação por mangueira dá controle manual total — indicada para áreas menores e ${cultureLabel}.`,
    sulcos: `Sulcos aproveitam a gravidade para distribuir água — método tradicional eficiente para ${cultureLabel} em fileiras.`,
    pivo: `Pivô Central é a escolha para grandes áreas de ${cultureLabel} — alta eficiência e cobertura automatizada.`,
  };

  return {
    ...data,
    durationMinutes: adjustedDuration,
    irrigationReason: irrigationReasons[data.irrigationType] || `Recomendado para ${cultureLabel}.`,
    schedulesReason: data.schedules.length > 2
      ? `${cultureLabel} necessita de umidade constante — irrigar 3x ao dia evita estresse hídrico.`
      : data.schedules.includes('06:00') || data.schedules.includes('05:30')
        ? 'Irrigar pela manhã cedo reduz a perda por evaporação e previne doenças fúngicas.'
        : 'Horários otimizados para menor evaporação e melhor absorção.',
    durationReason: durationMultiplier > 1
      ? `${adjustedDuration} min ajustado para a dimensão do plantio (${metricValue} ${metricType}). Área maior requer mais tempo de irrigação.`
      : `${adjustedDuration} min é o tempo ideal para ${cultureLabel} absorver água sem causar encharcamento.`,
    frequencyReason: data.frequency === 'diario'
      ? `${cultureLabel} precisa de umidade constante — irrigação diária mantém o solo na faixa ideal.`
      : `${cultureLabel} tolera intervalos entre regas — irrigar ${FREQUENCY_OPTIONS.find(f => f.id === data.frequency)?.label.toLowerCase()} evita excesso de água.`,
    humidityReason: `Umidade mínima de ${data.minHumidity}% é o limiar agronômico para ${cultureLabel} — abaixo disso, a planta entra em estresse hídrico.`,
    modeReason: data.mode === 'automatic'
      ? 'Modo automático usa dados dos sensores em tempo real para irrigar apenas quando necessário — mais economia de água.'
      : 'Modo agendado é mais previsível e fácil de gerenciar — ideal para quando os sensores ainda não estão calibrados.',
  };
}

// ── Component ──────────────────────────────────────────────────
export function CultureModal({ isOpen, onClose, onAdd, nextIndex = 1, valves, sensors }: CultureModalProps) {
  const [step, setStep] = useState(1);

  // Step 1
  const [customName, setCustomName] = useState('');
  const [cultureType, setCultureType] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [metricType, setMetricType] = useState('ha');
  const [plantDate, setPlantDate] = useState('');
  const [selectedValveIds, setSelectedValveIds] = useState<number[]>([]);
  const [selectedSensorIds, setSelectedSensorIds] = useState<number[]>([]);

  // Step 2
  const [irrigationType, setIrrigationType] = useState('');

  // Step 3
  const [schedules, setSchedules] = useState<string[]>(['06:00']);
  const [newTime, setNewTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [frequency, setFrequency] = useState('diario');
  const [minHumidity, setMinHumidity] = useState(55);
  const [mode, setMode] = useState<'automatic' | 'scheduled'>('automatic');

  // AI
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [acceptedFields, setAcceptedFields] = useState<Set<string>>(new Set());
  const [aiAnimating, setAiAnimating] = useState(false);

  const autoName = `Plantio ${String(nextIndex).padStart(2, '0')}`;

  // Generate AI suggestions when culture type or dimensions change
  useEffect(() => {
    if (cultureType && metricValue) {
      setAiAnimating(true);
      const timer = setTimeout(() => {
        const suggestion = getAISuggestions(cultureType, metricType, parseFloat(metricValue));
        setAiSuggestion(suggestion);
        setAiAnimating(false);
      }, 600); // simulate slight delay for "thinking"
      return () => clearTimeout(timer);
    } else {
      setAiSuggestion(null);
    }
  }, [cultureType, metricValue, metricType]);

  if (!isOpen) return null;

  const toggleValve = (id: number) => {
    setSelectedValveIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const toggleSensor = (id: number) => {
    setSelectedSensorIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const addScheduleTime = () => {
    if (newTime && !schedules.includes(newTime)) {
      setSchedules(prev => [...prev, newTime].sort());
      setNewTime('');
    }
  };

  const removeScheduleTime = (time: string) => {
    setSchedules(prev => prev.filter(t => t !== time));
  };

  // AI accept helpers
  const acceptIrrigationType = () => {
    if (aiSuggestion) {
      setIrrigationType(aiSuggestion.irrigationType);
      setAcceptedFields(prev => new Set(prev).add('irrigationType'));
    }
  };

  const acceptSchedules = () => {
    if (aiSuggestion) {
      setSchedules(aiSuggestion.schedules);
      setAcceptedFields(prev => new Set(prev).add('schedules'));
    }
  };

  const acceptDuration = () => {
    if (aiSuggestion) {
      setDurationMinutes(aiSuggestion.durationMinutes);
      setAcceptedFields(prev => new Set(prev).add('duration'));
    }
  };

  const acceptFrequency = () => {
    if (aiSuggestion) {
      setFrequency(aiSuggestion.frequency);
      setAcceptedFields(prev => new Set(prev).add('frequency'));
    }
  };

  const acceptHumidity = () => {
    if (aiSuggestion) {
      setMinHumidity(aiSuggestion.minHumidity);
      setAcceptedFields(prev => new Set(prev).add('humidity'));
    }
  };

  const acceptMode = () => {
    if (aiSuggestion) {
      setMode(aiSuggestion.mode);
      setAcceptedFields(prev => new Set(prev).add('mode'));
    }
  };

  const acceptAllStep3 = () => {
    if (aiSuggestion) {
      setSchedules(aiSuggestion.schedules);
      setDurationMinutes(aiSuggestion.durationMinutes);
      setFrequency(aiSuggestion.frequency);
      setMinHumidity(aiSuggestion.minHumidity);
      setMode(aiSuggestion.mode);
      setAcceptedFields(new Set(['schedules', 'duration', 'frequency', 'humidity', 'mode']));
    }
  };

  const canAdvanceStep1 = metricValue && plantDate;
  const canAdvanceStep2 = irrigationType;

  const handleSubmit = () => {
    const finalName = customName.trim() || autoName;
    const areaLabel = metricType === 'mudas'
      ? `${metricValue} mudas`
      : `${metricValue} ${metricType === 'm2' ? 'm²' : 'ha'}`;
    onAdd({
      name: finalName,
      area: areaLabel,
      plantDate,
      valveIds: selectedValveIds,
      sensorIds: selectedSensorIds,
      cultureType: cultureType || 'outro',
      automation: {
        irrigationType,
        schedules,
        durationMinutes,
        frequency,
        minHumidity,
        mode,
      },
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setStep(1);
    setCustomName('');
    setCultureType('');
    setMetricValue('');
    setMetricType('ha');
    setPlantDate('');
    setSelectedValveIds([]);
    setSelectedSensorIds([]);
    setIrrigationType('');
    setSchedules(['06:00']);
    setNewTime('');
    setDurationMinutes(25);
    setFrequency('diario');
    setMinHumidity(55);
    setMode('automatic');
    setAiSuggestion(null);
    setAcceptedFields(new Set());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ── Step Indicator ─────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1 px-6 py-3 border-b border-[#2d5a4a]/10 bg-[#f8faf9]">
      {[
        { num: 1, label: 'Plantio', icon: Sprout },
        { num: 2, label: 'Irrigação', icon: Droplets },
        { num: 3, label: 'Automação', icon: Settings2 },
      ].map((s, i) => {
        const Icon = s.icon;
        const isActive = step === s.num;
        const isDone = step > s.num;
        return (
          <div key={s.num} className="flex items-center">
            {i > 0 && (
              <div className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${isDone ? 'bg-[#4a8c6f]' : 'bg-[#2d5a4a]/15'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive ? 'bg-[#2d5a4a] text-white shadow-md scale-110' :
                isDone ? 'bg-[#4a8c6f] text-white' :
                'bg-[#e8f0ed] text-[#5a7368]'
              }`}>
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-[#2d5a4a]' : 'text-[#9aafa8]'}`}>
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── AI Suggestion Card (reusable) ─────────────────────────
  const AISuggestionCard = ({ label, value, reason, accepted, onAccept }: {
    label: string; value: string; reason: string; accepted: boolean; onAccept: () => void;
  }) => (
    <div className={`rounded-xl p-3 border transition-all duration-300 ${
      accepted
        ? 'bg-[#e8f0ed] border-[#4a8c6f]/30'
        : 'bg-gradient-to-r from-[#f0f7f4] to-[#edf5f8] border-[#2d5a4a]/15 hover:border-[#2d5a4a]/30'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#2d5a4a] flex-shrink-0" />
            <span className="text-xs font-semibold text-[#2d5a4a]">{label}</span>
          </div>
          <p className="text-sm font-medium text-[#1a2e1a] mb-1">{value}</p>
          <p className="text-xs text-[#5a7368] leading-relaxed">{reason}</p>
        </div>
        <button
          type="button"
          onClick={onAccept}
          disabled={accepted}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
            accepted
              ? 'bg-[#4a8c6f] text-white cursor-default'
              : 'bg-[#2d5a4a] text-white hover:bg-[#1a3d2f] hover:scale-105 active:scale-95'
          }`}
        >
          <Check className="w-3 h-3" />
          {accepted ? 'Aceito' : 'Usar'}
        </button>
      </div>
    </div>
  );

  // ── STEP 1: Basic Info ─────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-5 animate-fadeIn">
      {/* Culture Type */}
      <div>
        <label className="block mb-1.5 text-sm font-medium text-[#1a2e1a]">
          Tipo de Plantio
          <span className="ml-2 text-xs text-[#5a7368] font-normal">(opcional — ajuda a IA a sugerir melhor)</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto rounded-xl border border-[#2d5a4a]/20 bg-[#f8faf9] p-2">
          {CULTURE_TYPES.map((c) => {
            const isSelected = cultureType === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCultureType(isSelected ? '' : c.id)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all duration-200 text-center ${
                  isSelected
                    ? 'bg-[#2d5a4a] text-white shadow-md scale-[1.03]'
                    : 'bg-white hover:bg-[#e8f0ed] text-[#1a2e1a] border border-[#2d5a4a]/10 hover:border-[#2d5a4a]/25'
                }`}
              >
                <span className="text-xl">{c.emoji}</span>
                <span className="text-xs font-medium leading-tight">{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block mb-1.5 text-sm font-medium text-[#1a2e1a]">
          Nome do Plantio
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

      {/* Dimension */}
      <div>
        <label className="block mb-1.5 text-sm font-medium text-[#1a2e1a]">Dimensão do Plantio</label>
        <div className="flex gap-2">
          <select
            value={metricType}
            onChange={(e) => setMetricType(e.target.value)}
            className="w-1/3 px-3 py-3 bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a] text-[#1a2e1a] text-sm"
          >
            <option value="ha">Hectares</option>
            <option value="m2">Metros quadrados (m²)</option>
            <option value="mudas">Qtd de mudas</option>
          </select>
          <input
            type="number"
            min="0"
            step="any"
            value={metricValue}
            onChange={(e) => setMetricValue(e.target.value)}
            placeholder={metricType === 'mudas' ? "Ex: 500" : "Ex: 2.5"}
            className="flex-1 px-4 py-3 bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a] text-[#1a2e1a] placeholder:text-[#9aafa8]"
            required
          />
        </div>
      </div>

      {/* Plant Date */}
      <div>
        <label className="block mb-1.5 text-sm font-medium text-[#1a2e1a]">Data do Plantio</label>
        <input
          type="date"
          value={plantDate}
          onChange={(e) => setPlantDate(e.target.value)}
          className="w-full px-4 py-3 bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a] text-[#1a2e1a]"
          required
        />
      </div>

      {/* Valves Selection */}
      <div>
        <label className="block mb-1.5 text-sm font-medium text-[#1a2e1a]">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[#2d5a4a]" />
            Válvulas do Plantio
            <span className="text-xs text-[#5a7368] font-normal">(opcional)</span>
          </div>
        </label>
        {valves.length === 0 ? (
          <p className="text-sm text-[#9aafa8] italic px-4 py-3 bg-[#f8faf9] rounded-xl border border-[#2d5a4a]/10">
            Nenhuma válvula cadastrada. Cadastre válvulas na aba de Válvulas.
          </p>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto rounded-xl border border-[#2d5a4a]/20 bg-[#f8faf9] p-2">
            {valves.map((valve) => {
              const isSelected = selectedValveIds.includes(valve.id);
              return (
                <button
                  key={valve.id}
                  type="button"
                  onClick={() => toggleValve(valve.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left ${
                    isSelected
                      ? 'bg-[#2d5a4a] text-white shadow-sm'
                      : 'bg-white hover:bg-[#e8f0ed] text-[#1a2e1a] border border-[#2d5a4a]/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Droplets className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#2d5a4a]'}`} />
                    <span className="text-sm font-medium">{valve.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sensors Selection */}
      <div>
        <label className="block mb-1.5 text-sm font-medium text-[#1a2e1a]">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-[#2d5a4a]" />
            Sensores do Plantio
            <span className="text-xs text-[#5a7368] font-normal">(opcional)</span>
          </div>
        </label>
        {sensors.length === 0 ? (
          <p className="text-sm text-[#9aafa8] italic px-4 py-3 bg-[#f8faf9] rounded-xl border border-[#2d5a4a]/10">
            Nenhum sensor cadastrado. Cadastre sensores na aba de Sensores.
          </p>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto rounded-xl border border-[#2d5a4a]/20 bg-[#f8faf9] p-2">
            {sensors.map((sensor) => {
              const isSelected = selectedSensorIds.includes(sensor.id);
              return (
                <button
                  key={sensor.id}
                  type="button"
                  onClick={() => toggleSensor(sensor.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left ${
                    isSelected
                      ? 'bg-[#2d5a4a] text-white shadow-sm'
                      : 'bg-white hover:bg-[#e8f0ed] text-[#1a2e1a] border border-[#2d5a4a]/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Thermometer className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#2d5a4a]'}`} />
                    <span className="text-sm font-medium">{sensor.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── STEP 2: Irrigation Type ────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-4 animate-fadeIn">
      {/* AI Suggestion for irrigation type */}
      {aiSuggestion && (
        <div className={`transition-all duration-500 ${aiAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
          <AISuggestionCard
            label="Tipo recomendado pela IA"
            value={IRRIGATION_TYPES.find(i => i.id === aiSuggestion.irrigationType)?.label || ''}
            reason={aiSuggestion.irrigationReason}
            accepted={acceptedFields.has('irrigationType')}
            onAccept={acceptIrrigationType}
          />
        </div>
      )}

      {!aiSuggestion && (
        <div className="bg-[#f8faf9] rounded-xl p-3 border border-[#2d5a4a]/10">
          <div className="flex items-center gap-2 text-[#9aafa8]">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs italic">Selecione um tipo de plantio no step anterior para receber sugestões da IA</span>
          </div>
        </div>
      )}

      <label className="block text-sm font-medium text-[#1a2e1a]">Escolha o Método de Irrigação</label>

      <div className="space-y-2">
        {IRRIGATION_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = irrigationType === type.id;
          const isRecommended = aiSuggestion?.irrigationType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setIrrigationType(type.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 text-left relative ${
                isSelected
                  ? 'bg-[#2d5a4a] text-white shadow-lg scale-[1.01]'
                  : 'bg-white hover:bg-[#f0f7f4] text-[#1a2e1a] border border-[#2d5a4a]/15 hover:border-[#2d5a4a]/30'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'bg-white/20' : 'bg-[#e8f0ed]'
              }`}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-[#2d5a4a]'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{type.label}</span>
                  {isRecommended && !isSelected && (
                    <span className="text-[10px] bg-[#2d5a4a]/10 text-[#2d5a4a] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />IA
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#5a7368]'}`}>
                  {type.desc}
                </p>
              </div>
              {isSelected && <Check className="w-5 h-5 text-white flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── STEP 3: Automation Config ──────────────────────────────
  const renderStep3 = () => {
    const timesPerDayOptions = [1, 2, 3, 4, 5];

    const handleTimesPerDayChange = (count: number) => {
      const defaultTimes = ['06:00', '10:00', '14:00', '17:00', '20:00'];
      // Keep existing times if reducing, fill with defaults if increasing
      if (count > schedules.length) {
        const newSchedules = [...schedules];
        for (let i = schedules.length; i < count; i++) {
          const candidate = defaultTimes[i] || `${6 + i * 3}:00`;
          if (!newSchedules.includes(candidate)) {
            newSchedules.push(candidate);
          } else {
            // find a time not yet used
            const alt = `${6 + i * 2}:30`;
            newSchedules.push(alt);
          }
        }
        setSchedules(newSchedules.sort());
      } else {
        setSchedules(schedules.slice(0, count));
      }
    };

    const updateScheduleTime = (index: number, newTime: string) => {
      const updated = [...schedules];
      updated[index] = newTime;
      setSchedules(updated.sort());
    };

    const periodLabel = (time: string) => {
      const hour = parseInt(time.split(':')[0]);
      if (hour < 6) return '🌙 Madrugada';
      if (hour < 12) return '🌅 Manhã';
      if (hour < 18) return '☀️ Tarde';
      return '🌆 Noite';
    };

    return (
      <div className="space-y-5 animate-fadeIn">
        {/* AI Complete Suggestion */}
        {aiSuggestion && (
          <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
            acceptedFields.has('allStep3')
              ? 'bg-[#e8f0ed] border-[#4a8c6f]/30'
              : 'bg-gradient-to-br from-[#f0f7f4] via-[#edf5f8] to-[#f0f7f4] border-[#2d5a4a]/15'
          }`}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#2d5a4a] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-[#1a2e1a]">Sugestão da IA</span>
                  <p className="text-[10px] text-[#5a7368]">Baseada no tipo de plantio e dimensão</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white/70 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-[#5a7368] uppercase font-medium">Vezes/dia</p>
                  <p className="text-sm font-semibold text-[#1a2e1a]">{aiSuggestion.schedules.length}x — {aiSuggestion.schedules.join(', ')}</p>
                </div>
                <div className="bg-white/70 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-[#5a7368] uppercase font-medium">Duração</p>
                  <p className="text-sm font-semibold text-[#1a2e1a]">{aiSuggestion.durationMinutes} min por sessão</p>
                </div>
                <div className="bg-white/70 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-[#5a7368] uppercase font-medium">Frequência</p>
                  <p className="text-sm font-semibold text-[#1a2e1a]">{FREQUENCY_OPTIONS.find(f => f.id === aiSuggestion.frequency)?.label}</p>
                </div>
                <div className="bg-white/70 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-[#5a7368] uppercase font-medium">Modo</p>
                  <p className="text-sm font-semibold text-[#1a2e1a]">{aiSuggestion.mode === 'automatic' ? 'Automático' : 'Agendado'}</p>
                </div>
              </div>

              <p className="text-xs text-[#5a7368] mb-3">{aiSuggestion.schedulesReason}</p>

              <button
                type="button"
                onClick={() => {
                  setSchedules([...aiSuggestion.schedules]);
                  setDurationMinutes(aiSuggestion.durationMinutes);
                  setFrequency(aiSuggestion.frequency);
                  setMinHumidity(aiSuggestion.minHumidity);
                  setMode(aiSuggestion.mode);
                  setAcceptedFields(new Set(['allStep3', 'schedules', 'duration', 'frequency', 'humidity', 'mode']));
                }}
                disabled={acceptedFields.has('allStep3')}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  acceptedFields.has('allStep3')
                    ? 'bg-[#4a8c6f] text-white cursor-default'
                    : 'bg-[#2d5a4a] text-white hover:bg-[#1a3d2f] active:scale-[0.98] shadow-sm hover:shadow-md'
                }`}
              >
                <Check className="w-4 h-4" />
                {acceptedFields.has('allStep3') ? 'Sugestões aplicadas ✓' : 'Aplicar todas as sugestões'}
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#2d5a4a]/10" />
          <span className="text-xs font-medium text-[#5a7368] uppercase tracking-wider">Configuração Manual</span>
          <div className="flex-1 h-px bg-[#2d5a4a]/10" />
        </div>

        {/* Times per Day */}
        <div>
          <label className="text-sm font-medium text-[#1a2e1a] flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-[#2d5a4a]" />
            Quantas vezes por dia?
          </label>
          <div className="flex gap-2">
            {timesPerDayOptions.map((n) => {
              const isSelected = schedules.length === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleTimesPerDayChange(n)}
                  className={`flex-1 py-3 rounded-xl text-center transition-all duration-200 font-semibold ${
                    isSelected
                      ? 'bg-[#2d5a4a] text-white shadow-md scale-105'
                      : 'bg-[#f8faf9] border border-[#2d5a4a]/15 text-[#5a7368] hover:bg-[#e8f0ed] hover:text-[#2d5a4a]'
                  }`}
                >
                  <span className="text-lg">{n}x</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Individual Time Slots */}
        <div>
          <label className="text-sm font-medium text-[#1a2e1a] flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#2d5a4a]" />
            Em que horários?
          </label>
          <div className="space-y-2">
            {schedules.map((time, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-[#f8faf9] rounded-xl p-3 border border-[#2d5a4a]/10 hover:border-[#2d5a4a]/25 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-[#2d5a4a] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => updateScheduleTime(index, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#2d5a4a]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a4a] text-[#1a2e1a] font-medium"
                  />
                </div>
                <span className="text-xs text-[#5a7368] font-medium flex-shrink-0 min-w-[80px] text-right">
                  {periodLabel(time)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Duration per Session */}
        <div>
          <label className="text-sm font-medium text-[#1a2e1a] flex items-center gap-2 mb-2">
            <Timer className="w-4 h-4 text-[#2d5a4a]" />
            Duração de cada irrigação
          </label>
          <div className="bg-[#f8faf9] rounded-xl p-4 border border-[#2d5a4a]/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#5a7368]">5 min</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#2d5a4a]">{durationMinutes}</span>
                <span className="text-sm text-[#5a7368]">minutos</span>
              </div>
              <span className="text-xs text-[#5a7368]">120 min</span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
              className="w-full accent-[#2d5a4a] h-2 rounded-full"
            />
            <p className="text-xs text-[#5a7368] mt-2 text-center">
              Total diário: <span className="font-semibold text-[#2d5a4a]">{durationMinutes * schedules.length} min</span> ({schedules.length} sessão{schedules.length > 1 ? 'ões' : ''} × {durationMinutes} min)
            </p>
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="text-sm font-medium text-[#1a2e1a] flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-[#2d5a4a]" />
            Com que frequência?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {FREQUENCY_OPTIONS.map((opt) => {
              const isSelected = frequency === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFrequency(opt.id)}
                  className={`px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#2d5a4a] text-white shadow-sm'
                      : 'bg-white border border-[#2d5a4a]/15 text-[#1a2e1a] hover:bg-[#e8f0ed]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode */}
        <div>
          <label className="text-sm font-medium text-[#1a2e1a] flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#2d5a4a]" />
            Modo de operação
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('automatic')}
              className={`p-4 rounded-xl transition-all duration-200 text-left border-2 ${
                mode === 'automatic'
                  ? 'border-[#2d5a4a] bg-[#e8f0ed] shadow-sm'
                  : 'border-[#2d5a4a]/10 bg-white hover:bg-[#f8faf9]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className={`w-5 h-5 ${mode === 'automatic' ? 'text-[#2d5a4a]' : 'text-[#9aafa8]'}`} />
                <span className={`text-sm font-semibold ${mode === 'automatic' ? 'text-[#2d5a4a]' : 'text-[#5a7368]'}`}>Automático</span>
              </div>
              <p className="text-[11px] text-[#5a7368] leading-snug">Irriga nos horários definidos + quando a umidade do solo cair abaixo do limite</p>
            </button>
            <button
              type="button"
              onClick={() => setMode('scheduled')}
              className={`p-4 rounded-xl transition-all duration-200 text-left border-2 ${
                mode === 'scheduled'
                  ? 'border-[#2d5a4a] bg-[#e8f0ed] shadow-sm'
                  : 'border-[#2d5a4a]/10 bg-white hover:bg-[#f8faf9]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className={`w-5 h-5 ${mode === 'scheduled' ? 'text-[#2d5a4a]' : 'text-[#9aafa8]'}`} />
                <span className={`text-sm font-semibold ${mode === 'scheduled' ? 'text-[#2d5a4a]' : 'text-[#5a7368]'}`}>Agendado</span>
              </div>
              <p className="text-[11px] text-[#5a7368] leading-snug">Irriga apenas nos horários fixos definidos, sem considerar sensores</p>
            </button>
          </div>
        </div>

        {/* Humidity Threshold (only if automatic) */}
        {mode === 'automatic' && (
          <div className="animate-fadeIn">
            <label className="text-sm font-medium text-[#1a2e1a] flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-[#2d5a4a]" />
              Umidade mínima do solo
            </label>
            <div className="bg-[#f8faf9] rounded-xl p-4 border border-[#2d5a4a]/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#5a7368]">20%</span>
                <span className="text-lg font-semibold text-[#2d5a4a]">{minHumidity}%</span>
                <span className="text-xs text-[#5a7368]">90%</span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                step="5"
                value={minHumidity}
                onChange={(e) => setMinHumidity(parseInt(e.target.value))}
                className="w-full accent-[#2d5a4a] h-2 rounded-full"
              />
              <p className="text-xs text-[#5a7368] mt-1.5">A irrigação extra ativa quando o sensor detectar umidade abaixo de {minHumidity}%</p>
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-[#2d5a4a] to-[#1e4d5c] rounded-2xl p-4 text-white">
          <p className="text-xs uppercase font-medium text-white/60 mb-2">Resumo da Automação</p>
          <div className="space-y-1.5">
            <p className="text-sm">
              <span className="text-white/70">Irrigação:</span>{' '}
              <span className="font-medium">{schedules.length}x por dia</span>{' '}
              <span className="text-white/50">({schedules.join(', ')})</span>
            </p>
            <p className="text-sm">
              <span className="text-white/70">Duração:</span>{' '}
              <span className="font-medium">{durationMinutes} min/sessão</span>{' '}
              <span className="text-white/50">({durationMinutes * schedules.length} min/dia)</span>
            </p>
            <p className="text-sm">
              <span className="text-white/70">Frequência:</span>{' '}
              <span className="font-medium">{FREQUENCY_OPTIONS.find(f => f.id === frequency)?.label}</span>
            </p>
            <p className="text-sm">
              <span className="text-white/70">Modo:</span>{' '}
              <span className="font-medium">{mode === 'automatic' ? `Automático (≥${minHumidity}% umidade)` : 'Agendado (horário fixo)'}</span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#e8f0ed] rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-[#2d5a4a]" />
            </div>
            <h2 className="text-[#1a2e1a] text-lg font-semibold">+ Plantio</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#5a7368]" />
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Footer navigation */}
        <div className="px-6 py-4 border-t border-[#2d5a4a]/10 flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-[#2d5a4a] hover:bg-[#e8f0ed] transition-colors font-medium text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canAdvanceStep1 : !canAdvanceStep2}
              className="flex items-center gap-2 px-6 py-3 bg-[#2d5a4a] text-white rounded-xl hover:bg-[#1a3d2f] transition-all duration-200 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#2d5a4a]"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={schedules.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2d5a4a] to-[#1e4d5c] text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Criar Plantio
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
