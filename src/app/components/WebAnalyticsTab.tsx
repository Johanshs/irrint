import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, ExternalLink, Activity } from 'lucide-react';
import { SensorReading, SyncUser } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface WebAnalyticsTabProps {
  sensorHistory: Record<string, SensorReading[]>;
}

export function WebAnalyticsTab({ sensorHistory }: WebAnalyticsTabProps) {
  const [currentUser, setCurrentUser] = useState<SyncUser | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('irrigacao_current_user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleAccessWeb = () => {
    if (!currentUser) return;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const webBaseUrl = isLocal 
      ? 'http://localhost:5173' 
      : 'https://hydroai-dashboard.vercel.app';
    const queryParams = `?authEmail=${encodeURIComponent(currentUser.email)}&authName=${encodeURIComponent(currentUser.name)}`;
    window.open(`${webBaseUrl}${queryParams}`, '_blank');
  };

  const features = [
    { icon: BarChart3, title: 'Gráficos Detalhados', description: 'Visualize dados históricos de irrigação, umidade e temperatura' },
    { icon: TrendingUp, title: 'Análises Avançadas', description: 'Previsões de consumo de água e otimizações de irrigação' },
    { icon: Calendar, title: 'Relatórios Periódicos', description: 'Relatórios diários, semanais e mensais do desempenho da cultura' },
  ];

  // Aggregate sensor history for the chart
  const allSensors = Object.keys(sensorHistory);
  const chartData = [];
  
  if (allSensors.length > 0) {
    // Just grab the first sensor's history for a quick inline preview
    const mainSensorId = allSensors[0];
    const history = sensorHistory[mainSensorId] || [];
    
    for (const entry of history) {
      const date = new Date(entry.timestamp);
      chartData.push({
        time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`,
        umidade: entry.humidity,
        temperatura: entry.temp
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#2d5a4a] to-[#1e4d5c] rounded-2xl p-8 text-white shadow-lg">
        <h2 className="mb-4 text-2xl font-bold">Análises e Gráficos Avançados</h2>
        <p className="text-white/90 mb-6 max-w-2xl">
          Acesse a plataforma web completa para visualizar análises detalhadas, gráficos históricos e relatórios do seu sistema de irrigação com integração de IA completa.
        </p>
        <button 
          onClick={handleAccessWeb}
          className="bg-white text-[#2d5a4a] px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-bold shadow-md"
        >
          <ExternalLink className="w-5 h-5" />
          Acessar Plataforma Web
        </button>
      </div>

      {/* Inline Preview Chart */}
      <div className="bg-white rounded-xl p-6 border border-[#2d5a4a]/20 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-[#2d5a4a]" />
          <h3 className="text-[#1a2e1a] font-bold">Prévia: Histórico Recente de Umidade</h3>
        </div>
        
        <div className="h-72 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorUmidade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d5a4a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2d5a4a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5a7368' }} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5a7368' }} domain={[0, 100]} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="umidade" stroke="#2d5a4a" fillOpacity={1} fill="url(#colorUmidade)" animationDuration={500} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-[#5a7368] bg-gray-50 rounded-xl">
              Aguardando coleta de dados dos sensores...
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 border border-[#2d5a4a]/20 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-[#e8f0ed] rounded-lg w-fit mb-4">
                <Icon className="w-6 h-6 text-[#2d5a4a]" />
              </div>
              <h3 className="text-[#1a2e1a] mb-2 font-bold">{feature.title}</h3>
              <p className="text-[#5a7368] text-sm">{feature.description}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl p-6 border border-[#2d5a4a]/20 shadow-sm">
        <h3 className="text-[#1a2e1a] mb-4 font-bold">Recursos da Plataforma Web</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Gráficos interativos de consumo de água ao longo do tempo',
            'Comparação de desempenho entre diferentes culturas',
            'Previsões meteorológicas integradas e IA Preditiva',
            'Exportação de relatórios em PDF e Excel',
            'Histórico completo de ativações de válvulas e alertas',
            'Análise de eficiência hídrica por setor de plantio',
            'Alertas personalizados e notificações via WhatsApp/Email',
            'Dashboard customizável com múltiplos widgets'
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-[#f8faf9] rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#2d5a4a] mt-2 flex-shrink-0" />
              <span className="text-[#1a2e1a] text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
