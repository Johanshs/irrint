import { useState, useEffect } from 'react';
import { Droplets, Thermometer, Activity, AlertTriangle, Cpu, Sprout, CheckCircle2, Cloud, Sun, CloudRain } from 'lucide-react';
import { Valve, Sensor, IrrigationRecommendation, SoilHealthScore, SensorReading, Culture } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  activeCultureNames: string;
  cultures: Culture[];
  valves: Valve[];
  sensors: Sensor[];
  sensorHistory: Record<string, SensorReading[]>;
  soilHealth: SoilHealthScore | null;
  irrigationRecommendation: IrrigationRecommendation | null;
}

export function Dashboard({ 
  activeCultureNames, 
  cultures, 
  valves, 
  sensors, 
  sensorHistory,
  soilHealth,
  irrigationRecommendation
}: DashboardProps) {
  const [weather, setWeather] = useState<{ temp: number; precipitation: number; code: number } | null>(null);

  useEffect(() => {
    // Fetch weather for São Paulo (-23.55, -46.63)
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-23.5505&longitude=-46.6333&current=temperature_2m,precipitation,weather_code')
      .then(res => res.json())
      .then(data => {
        if (data && data.current) {
          setWeather({
            temp: data.current.temperature_2m,
            precipitation: data.current.precipitation,
            code: data.current.weather_code
          });
        }
      })
      .catch(err => console.error('Failed to fetch weather', err));
  }, []);

  const activeValvesCount = valves.filter(v => v.status === 'active').length;
  const activeAlertsCount = sensors.filter(s => s.status !== 'ok').length;
  const onlineSensorsCount = sensors.length; // Assuming all simulator sensors are online

  // Prepare data for the pie chart
  const valveStatusData = [
    { name: 'Ativas', value: activeValvesCount, color: '#4a8c6f' },
    { name: 'Inativas', value: valves.length - activeValvesCount, color: '#e5e7eb' }
  ];

  // Prepare data for the line chart (using the first sensor for overview, or average)
  const chartData = [];
  if (sensors.length > 0) {
    const mainSensorId = sensors[0].id;
    const history = sensorHistory[mainSensorId] || [];
    
    // Convert to format suitable for Recharts
    for (const entry of history) {
      const date = new Date(entry.timestamp);
      chartData.push({
        time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
        umidade: entry.humidity,
        temperatura: entry.temp
      });
    }
  }

  const getWeatherIcon = (code: number) => {
    if (code <= 3) return <Sun className="w-8 h-8 text-amber-300" />;
    if (code <= 48) return <Cloud className="w-8 h-8 text-gray-300" />;
    return <CloudRain className="w-8 h-8 text-blue-300" />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#2d5a4a] to-[#1e4d5c] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="mb-2 text-2xl font-bold">Plantio(s): {activeCultureNames}</h2>
          <p className="text-white/80">Status geral do sistema de irrigação em tempo real</p>
        </div>
        
        {/* Clima Atual (Open-Meteo) */}
        {weather && (
          <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10">
            {getWeatherIcon(weather.code)}
            <div>
              <p className="text-sm text-white/70 font-medium">São Paulo, SP</p>
              <div className="flex items-end gap-3">
                <span className="text-2xl font-bold">{weather.temp.toFixed(1)}°C</span>
                {weather.precipitation > 0 && (
                  <span className="text-sm text-blue-200 flex items-center gap-1">
                    <CloudRain className="w-3 h-3" />
                    {weather.precipitation} mm
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-[#2d5a4a]/20 shadow-sm transition-transform hover:scale-105">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#e8f0ed] rounded-lg">
              <Droplets className="w-6 h-6 text-[#2d5a4a]" />
            </div>
            <div>
              <p className="text-[#5a7368] text-sm font-medium">Válvulas Ativas</p>
              <h3 className="text-[#1a2e1a] text-xl font-bold">{activeValvesCount} de {valves.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#2d5a4a]/20 shadow-sm transition-transform hover:scale-105">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#e8f0ed] rounded-lg">
              <Thermometer className="w-6 h-6 text-[#1e4d5c]" />
            </div>
            <div>
              <p className="text-[#5a7368] text-sm font-medium">Sensores Online</p>
              <h3 className="text-[#1a2e1a] text-xl font-bold">{onlineSensorsCount} de {sensors.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#2d5a4a]/20 shadow-sm transition-transform hover:scale-105">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-3 rounded-lg ${activeAlertsCount > 0 ? 'bg-[#fff4e6]' : 'bg-[#e8f0ed]'}`}>
              <AlertTriangle className={`w-6 h-6 ${activeAlertsCount > 0 ? 'text-[#e8a836]' : 'text-[#4a8c6f]'}`} />
            </div>
            <div>
              <p className="text-[#5a7368] text-sm font-medium">Alertas Ativos</p>
              <h3 className="text-[#1a2e1a] text-xl font-bold">{activeAlertsCount} ativos</h3>
            </div>
          </div>
        </div>

        {/* Soil Health Gauge */}
        <div className="bg-white rounded-xl p-6 border border-[#2d5a4a]/20 shadow-sm transition-transform hover:scale-105">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#e8f0ed] rounded-lg">
              <Sprout className="w-6 h-6 text-[#2d5a4a]" />
            </div>
            <div>
              <p className="text-[#5a7368] text-sm font-medium">Saúde do Solo</p>
              <h3 className="text-[#1a2e1a] text-xl font-bold">
                {soilHealth ? `${soilHealth.score}/100` : 'Calc...'}
              </h3>
            </div>
          </div>
          {soilHealth && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className={`h-1.5 rounded-full transition-all duration-1000 ${
                  soilHealth.score >= 70 ? 'bg-[#4a8c6f]' : 
                  soilHealth.score >= 50 ? 'bg-[#e8a836]' : 'bg-red-500'
                }`}
                style={{ width: `${soilHealth.score}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendation Card */}
      {irrigationRecommendation && (
        <div className={`rounded-xl p-6 border shadow-sm ${
          irrigationRecommendation.shouldIrrigate 
            ? 'bg-[#e6f3f7] border-[#1e4d5c]/30' 
            : 'bg-[#f8faf9] border-[#2d5a4a]/20'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${irrigationRecommendation.shouldIrrigate ? 'bg-[#1e4d5c] text-white' : 'bg-[#e8f0ed] text-[#2d5a4a]'}`}>
              <Cpu className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-[#1a2e1a] text-lg font-bold flex items-center gap-2">
                Recomendação Inteligente (IA)
                {irrigationRecommendation.shouldIrrigate ? (
                  <span className="text-xs bg-[#1e4d5c] text-white px-2 py-1 rounded-full font-normal">Ação Necessária</span>
                ) : (
                  <span className="text-xs bg-[#4a8c6f] text-white px-2 py-1 rounded-full font-normal flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Ideal</span>
                )}
              </h3>
              <p className="text-[#1a2e1a] mt-2">{irrigationRecommendation.reasoning}</p>
              
              {irrigationRecommendation.shouldIrrigate && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/60 p-4 rounded-lg">
                  <div>
                    <span className="text-xs text-[#5a7368] block">Volume Sugerido</span>
                    <span className="font-bold text-[#1e4d5c]">{irrigationRecommendation.volumeLiters} L</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#5a7368] block">Duração Estimada</span>
                    <span className="font-bold text-[#1e4d5c]">{irrigationRecommendation.durationMinutes} min</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#5a7368] block">Urgência</span>
                    <span className="font-bold uppercase text-[#e8a836]">{irrigationRecommendation.urgency}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-[#2d5a4a]/20 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#2d5a4a]" />
              <h3 className="text-[#1a2e1a] font-bold">Monitoramento de Umidade (Tempo Real)</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#5a7368]">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#1e4d5c]"></div> Umidade %</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5a7368' }} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5a7368' }} domain={[0, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(45, 90, 74, 0.2)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line type="monotone" dataKey="umidade" stroke="#1e4d5c" strokeWidth={3} dot={false} activeDot={{ r: 6 }} animationDuration={500} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[#5a7368]">
                Aguardando dados dos sensores...
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#2d5a4a]/20 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-5 h-5 text-[#1e4d5c]" />
            <h3 className="text-[#1a2e1a] font-bold">Status das Válvulas</h3>
          </div>
          
          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={valveStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={800}
                >
                  {valveStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-[#1a2e1a]">{activeValvesCount}</span>
              <span className="text-xs text-[#5a7368]">Ativas</span>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            {valves.slice(0, 3).map((valve) => (
              <div key={valve.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${valve.status === 'active' ? 'bg-[#4a8c6f]' : 'bg-gray-300'}`}></div>
                  <span className="text-[#1a2e1a] truncate w-24">{valve.name}</span>
                </div>
                <span className="text-[#5a7368] font-mono">{valve.flow} L/m</span>
              </div>
            ))}
            {valves.length > 3 && (
              <div className="text-center text-xs text-[#5a7368] pt-2">+ {valves.length - 3} válvulas</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
