import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Droplets, Layout, Sprout, Shield, Mail, Lock, User } from 'lucide-react';

interface WireframesGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WireframesGallery({ isOpen, onClose }: WireframesGalleryProps) {
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    {
      title: 'Visão Geral do Projeto',
      description: 'Introdução ao sistema e paleta de cores',
    },
    {
      title: 'Tela de Boas-Vindas',
      description: 'Primeira tela do app com apresentação e botão de início',
    },
    {
      title: 'Login e Registro',
      description: 'Autenticação segura com opção de criar conta',
    },
    {
      title: 'Gestão de Culturas',
      description: 'Visualização e gerenciamento de todas as culturas',
    },
    {
      title: 'Dashboard Principal',
      description: 'Visão geral com métricas, válvulas e sensores',
    },
    {
      title: 'Controle de Válvulas',
      description: 'Gerenciamento individual de cada válvula de irrigação',
    },
    {
      title: 'Monitoramento de Sensores',
      description: 'Dados em tempo real dos sensores de solo',
    },
    {
      title: 'Análises Web',
      description: 'Acesso à plataforma web com gráficos e relatórios',
    },
    {
      title: 'Modal Nova Cultura',
      description: 'Formulário para adicionar novas culturas',
    },
  ];

  if (!isOpen) return null;

  const nextScreen = () => {
    setCurrentScreen((prev) => (prev + 1) % screens.length);
  };

  const prevScreen = () => {
    setCurrentScreen((prev) => (prev - 1 + screens.length) % screens.length);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-[#1a2e1a]">Wireframes do Aplicativo</h2>
            <p className="text-[#5a7368]">
              {currentScreen + 1} de {screens.length} - {screens[currentScreen].title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentScreen === 0 && <OverviewWireframe />}
          {currentScreen === 1 && <WelcomeWireframe />}
          {currentScreen === 2 && <LoginWireframe />}
          {currentScreen === 3 && <CulturesWireframe />}
          {currentScreen === 4 && <DashboardWireframe />}
          {currentScreen === 5 && <ValvesWireframe />}
          {currentScreen === 6 && <SensorsWireframe />}
          {currentScreen === 7 && <AnalyticsWireframe />}
          {currentScreen === 8 && <ModalWireframe />}
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={prevScreen}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          <div className="flex gap-2">
            {screens.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentScreen(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentScreen ? 'bg-[#2d5a4a]' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextScreen}
            className="flex items-center gap-2 px-4 py-2 bg-[#2d5a4a] text-white hover:bg-[#1a3d2f] rounded-lg transition-colors"
          >
            Próxima
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function OverviewWireframe() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-[#1a2e1a] mb-2">Sistema de Irrigação Inteligente</h2>
        <p className="text-[#5a7368]">Wireframes completos do aplicativo mobile</p>
      </div>

      {/* Color Palette */}
      <div className="bg-white border-2 border-[#2d5a4a]/30 rounded-2xl p-6 shadow-lg">
        <h3 className="text-[#1a2e1a] mb-4">Paleta de Cores</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-[#5a7368] mb-3">Cores Principais</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-[#2d5a4a] rounded-lg border-2 border-[#1a2e1a]/20 shadow-sm" />
                <div>
                  <p className="text-sm font-medium text-[#1a2e1a]">Verde Floresta</p>
                  <p className="text-xs text-[#5a7368]">#2d5a4a</p>
                  <p className="text-xs text-[#5a7368]">Cor primária</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-[#1e4d5c] rounded-lg border-2 border-[#1a2e1a]/20 shadow-sm" />
                <div>
                  <p className="text-sm font-medium text-[#1a2e1a]">Azul Petróleo</p>
                  <p className="text-xs text-[#5a7368]">#1e4d5c</p>
                  <p className="text-xs text-[#5a7368]">Cor secundária</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-[#5a7368] mb-3">Cores de Suporte</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-[#f8faf9] rounded-lg border-2 border-[#2d5a4a]/20 shadow-sm" />
                <div>
                  <p className="text-sm font-medium text-[#1a2e1a]">Background</p>
                  <p className="text-xs text-[#5a7368]">#f8faf9</p>
                  <p className="text-xs text-[#5a7368]">Fundo claro</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-[#e8a836] rounded-lg border-2 border-[#1a2e1a]/20 shadow-sm" />
                <div>
                  <p className="text-sm font-medium text-[#1a2e1a]">Warning</p>
                  <p className="text-xs text-[#5a7368]">#e8a836</p>
                  <p className="text-xs text-[#5a7368]">Alertas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screens Overview */}
      <div className="bg-white border-2 border-[#2d5a4a]/30 rounded-2xl p-6 shadow-lg">
        <h3 className="text-[#1a2e1a] mb-4">Telas do Aplicativo</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { num: '01', name: 'Boas-Vindas', icon: '🏠', desc: 'Tela inicial' },
            { num: '02', name: 'Login', icon: '🔐', desc: 'Autenticação' },
            { num: '03', name: 'Culturas', icon: '🌱', desc: 'Gestão' },
            { num: '04', name: 'Dashboard', icon: '📊', desc: 'Visão geral' },
            { num: '05', name: 'Válvulas', icon: '💧', desc: 'Controle' },
            { num: '06', name: 'Sensores', icon: '🌡️', desc: 'Monitoramento' },
            { num: '07', name: 'Análises', icon: '📈', desc: 'Web redirect' },
            { num: '08', name: 'Modal', icon: '➕', desc: 'Add cultura' }
          ].map((screen) => (
            <div key={screen.num} className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-xl p-4 hover:bg-[#e8f0ed] transition-colors">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{screen.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#2d5a4a]">{screen.num}</span>
                    <span className="text-sm font-medium text-[#1a2e1a]">{screen.name}</span>
                  </div>
                  <p className="text-xs text-[#5a7368]">{screen.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Design System */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border-2 border-[#2d5a4a]/30 rounded-2xl p-6 shadow-lg">
          <h3 className="text-[#1a2e1a] mb-4">Componentes Base</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#f8faf9] rounded-lg">
              <span className="text-sm text-[#1a2e1a]">Botões primários</span>
              <div className="h-8 bg-[#2d5a4a] rounded-lg px-4 flex items-center">
                <span className="text-white text-xs">Button</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f8faf9] rounded-lg">
              <span className="text-sm text-[#1a2e1a]">Cards</span>
              <div className="h-8 bg-white border-2 border-[#2d5a4a]/20 rounded-lg px-4 flex items-center">
                <span className="text-[#1a2e1a] text-xs">Card</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f8faf9] rounded-lg">
              <span className="text-sm text-[#1a2e1a]">Inputs</span>
              <div className="h-8 bg-[#f8faf9] border-2 border-[#2d5a4a]/20 rounded-lg px-4 flex items-center">
                <span className="text-[#5a7368] text-xs">Input</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f8faf9] rounded-lg">
              <span className="text-sm text-[#1a2e1a]">Badges</span>
              <div className="h-6 bg-[#e8f0ed] rounded-full px-3 flex items-center">
                <span className="text-[#2d5a4a] text-xs">Badge</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-[#2d5a4a]/30 rounded-2xl p-6 shadow-lg">
          <h3 className="text-[#1a2e1a] mb-4">Especificações Técnicas</h3>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-[#f8faf9] rounded-lg">
              <p className="text-[#5a7368] mb-1">Framework</p>
              <p className="text-[#1a2e1a] font-medium">React + TypeScript</p>
            </div>
            <div className="p-3 bg-[#f8faf9] rounded-lg">
              <p className="text-[#5a7368] mb-1">Estilização</p>
              <p className="text-[#1a2e1a] font-medium">Tailwind CSS v4</p>
            </div>
            <div className="p-3 bg-[#f8faf9] rounded-lg">
              <p className="text-[#5a7368] mb-1">Navegação</p>
              <p className="text-[#1a2e1a] font-medium">React Router v7</p>
            </div>
            <div className="p-3 bg-[#f8faf9] rounded-lg">
              <p className="text-[#5a7368] mb-1">Ícones</p>
              <p className="text-[#1a2e1a] font-medium">Lucide React</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation hint */}
      <div className="text-center pt-4">
        <p className="text-sm text-[#5a7368]">
          Use as setas abaixo para navegar pelos wireframes detalhados de cada tela →
        </p>
      </div>
    </div>
  );
}

function CulturesWireframe() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#1a2e1a]">Gestão de Culturas</h3>
        <span className="text-sm text-[#5a7368] px-3 py-1 bg-[#e8f0ed] rounded-full">Grid 3 Colunas</span>
      </div>

      <div className="border-2 border-[#2d5a4a]/30 rounded-2xl p-6 bg-[#f8faf9] shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 bg-[#1a2e1a] rounded-lg w-56 mb-2 flex items-center px-3">
              <span className="text-white text-sm font-medium">Minhas Culturas</span>
            </div>
            <div className="h-4 bg-[#5a7368]/30 rounded w-72 flex items-center px-2">
              <span className="text-xs text-[#5a7368]">Gerencie todas as culturas do seu plantio</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#e8f0ed] rounded-lg border border-[#2d5a4a]/20">
            <Sprout className="w-5 h-5 text-[#2d5a4a]" />
            <span className="text-[#1a2e1a] font-medium">3 Culturas</span>
          </div>
        </div>

        {/* Culture Cards Grid */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { id: 1, name: 'Tomate', area: '2.5 ha', days: 45, stage: 'Crescimento', active: true, progress: 75 },
            { id: 2, name: 'Alface', area: '1.2 ha', days: 28, stage: 'Desenvolvimento', active: false, progress: 50 },
            { id: 3, name: 'Milho', area: '5.0 ha', days: 120, stage: 'Maturação', active: false, progress: 100 }
          ].map((culture) => (
            <div
              key={culture.id}
              className={`bg-white rounded-2xl p-5 border-2 shadow-sm ${
                culture.active ? 'border-[#2d5a4a]' : 'border-[#2d5a4a]/20'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    culture.active ? 'bg-[#2d5a4a]' : 'bg-[#e8f0ed]'
                  }`}>
                    <Sprout className={`w-6 h-6 ${
                      culture.active ? 'text-white' : 'text-[#2d5a4a]'
                    }`} />
                  </div>
                  <div>
                    <div className="h-4 bg-[#1a2e1a] rounded w-20 mb-1 flex items-center px-2">
                      <span className="text-white text-xs font-medium">{culture.name}</span>
                    </div>
                    {culture.active && (
                      <div className="h-5 bg-[#e8f0ed] rounded-full px-2 flex items-center w-fit">
                        <span className="text-[#2d5a4a] text-xs font-medium">Ativa</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between p-2 bg-[#f8faf9] rounded-lg">
                  <span className="text-xs text-[#5a7368]">📍 Área</span>
                  <span className="text-xs font-medium text-[#1a2e1a]">{culture.area}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f8faf9] rounded-lg">
                  <span className="text-xs text-[#5a7368]">📅 Plantio</span>
                  <span className="text-xs font-medium text-[#1a2e1a]">15/05/26</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#f8faf9] rounded-lg">
                  <span className="text-xs text-[#5a7368]">📈 Dias</span>
                  <span className="text-xs font-medium text-[#1a2e1a]">{culture.days} dias</span>
                </div>
              </div>

              {/* Growth Stage */}
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-[#5a7368]">Crescimento</span>
                  <span className="text-xs font-medium text-[#1a2e1a]">{culture.stage}</span>
                </div>
                <div className="h-2 bg-[#e8f0ed] rounded-full">
                  <div
                    className="h-2 bg-gradient-to-r from-[#2d5a4a] to-[#4a8c6f] rounded-full"
                    style={{ width: `${culture.progress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3 pt-3 border-t border-[#2d5a4a]/10">
                <div className="text-center">
                  <p className="text-xs text-[#5a7368]">Válvulas</p>
                  <p className="text-xs font-medium text-[#1a2e1a]">3</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#5a7368]">Sensores</p>
                  <p className="text-xs font-medium text-[#1a2e1a]">6</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#5a7368]">Alertas</p>
                  <p className="text-xs font-medium text-[#e8a836]">2</p>
                </div>
              </div>

              {/* Action Button */}
              <div className={`w-full py-2 rounded-lg text-center text-xs font-medium ${
                culture.active
                  ? 'bg-[#e8f0ed] text-[#2d5a4a] border-2 border-[#2d5a4a]/20'
                  : 'bg-[#2d5a4a] text-white'
              }`}>
                {culture.active ? '✓ Cultura Ativa' : '💧 Ativar Cultura'}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-gradient-to-r from-[#e8f0ed] to-[#e6f3f7] border-2 border-[#2d5a4a]/20 rounded-xl p-5">
          <div className="h-5 bg-[#1a2e1a] rounded-lg w-36 mb-4 flex items-center px-2">
            <span className="text-white text-xs font-medium">Resumo Geral</span>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: 'Total de Culturas', value: '3' },
              { label: 'Área Total', value: '8.7 ha' },
              { label: 'Culturas Ativas', value: '1' },
              { label: 'Sistema', value: 'Online', color: 'text-[#4a8c6f]' }
            ].map((item, i) => (
              <div key={i}>
                <p className="text-xs text-[#5a7368] mb-1">{item.label}</p>
                <div className="flex items-center gap-2">
                  {item.label === 'Sistema' && (
                    <div className="w-2 h-2 bg-[#4a8c6f] rounded-full" />
                  )}
                  <span className={`text-sm font-medium ${item.color || 'text-[#1a2e1a]'}`}>
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Funcionalidades</p>
          <p className="text-xs text-[#1a2e1a]">• Listar culturas<br/>• Ativar cultura<br/>• Ver detalhes<br/>• Estatísticas</p>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Informações Card</p>
          <p className="text-xs text-[#1a2e1a]">Área, data plantio, dias plantado, estágio crescimento, válvulas/sensores</p>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Estado Ativo</p>
          <p className="text-xs text-[#1a2e1a]">Cultura ativa destacada com border verde e badge "Ativa"</p>
        </div>
      </div>
    </div>
  );
}

function LoginWireframe() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#1a2e1a]">Login e Registro</h3>
        <span className="text-sm text-[#5a7368] px-3 py-1 bg-[#e8f0ed] rounded-full">Split Layout</span>
      </div>

      <div className="border-2 border-[#2d5a4a]/30 rounded-2xl overflow-hidden shadow-lg">
        <div className="flex min-h-[600px]">
          {/* Left Side - Branding */}
          <div className="w-1/2 bg-gradient-to-br from-[#2d5a4a] to-[#1e4d5c] p-8 flex flex-col justify-between relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

            {/* Header */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Droplets className="w-10 h-10 text-white" />
                <Sprout className="w-10 h-10 text-white" />
              </div>
              <div className="h-7 bg-white/90 rounded w-64 mb-3 flex items-center px-3">
                <span className="text-[#2d5a4a] text-sm font-medium">Irrigação Inteligente</span>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-white/60 rounded w-full" />
                <div className="h-3 bg-white/60 rounded w-5/6" />
              </div>
            </div>

            {/* Features */}
            <div className="relative z-10 space-y-4">
              {[
                { icon: <Shield className="w-5 h-5" />, title: 'Seguro e Confiável' },
                { icon: <Droplets className="w-5 h-5" />, title: 'Tempo Real' },
                { icon: <Sprout className="w-5 h-5" />, title: 'Culturas' }
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/90 rounded w-32 mb-2" />
                    <div className="h-3 bg-white/60 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>

            {/* Version */}
            <div className="relative z-10 text-white/50 text-xs">v1.0.0</div>
          </div>

          {/* Right Side - Form */}
          <div className="w-1/2 bg-[#f8faf9] p-8 flex items-center justify-center">
            <div className="w-full max-w-sm">
              {/* Toggle */}
              <div className="bg-white rounded-xl p-1 flex gap-1 mb-6 border-2 border-[#2d5a4a]/20">
                <div className="flex-1 py-2 bg-[#2d5a4a] text-white rounded-lg text-center text-sm font-medium">
                  Entrar
                </div>
                <div className="flex-1 py-2 text-[#5a7368] text-center text-sm">
                  Criar Conta
                </div>
              </div>

              {/* Title */}
              <div className="mb-6">
                <div className="h-6 bg-[#1a2e1a] rounded w-48 mb-2" />
                <div className="h-4 bg-[#5a7368]/30 rounded w-56" />
              </div>

              {/* Email Input */}
              <div className="mb-4">
                <div className="h-4 bg-[#1a2e1a] rounded w-16 mb-2" />
                <div className="relative h-12 bg-white border-2 border-[#2d5a4a]/20 rounded-xl flex items-center px-4">
                  <Mail className="w-5 h-5 text-[#5a7368] mr-3" />
                  <div className="h-3 bg-[#5a7368]/30 rounded flex-1" />
                </div>
              </div>

              {/* Password Input */}
              <div className="mb-6">
                <div className="h-4 bg-[#1a2e1a] rounded w-16 mb-2" />
                <div className="relative h-12 bg-white border-2 border-[#2d5a4a]/20 rounded-xl flex items-center px-4">
                  <Lock className="w-5 h-5 text-[#5a7368] mr-3" />
                  <div className="h-3 bg-[#5a7368]/30 rounded flex-1" />
                  <div className="w-5 h-5 bg-[#5a7368]/30 rounded ml-2" />
                </div>
              </div>

              {/* Login Button */}
              <button className="w-full h-12 bg-[#2d5a4a] text-white rounded-xl mb-4 flex items-center justify-center gap-2 shadow-sm">
                <span className="text-sm font-medium">Entrar na Conta</span>
                <div className="w-4 h-4 border-2 border-white rounded" />
              </button>

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-[#2d5a4a]/20" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-[#f8faf9] text-xs text-[#5a7368]">ou</span>
                </div>
              </div>

              {/* Demo Button */}
              <button className="w-full h-10 bg-[#e8f0ed] text-[#2d5a4a] rounded-xl border-2 border-[#2d5a4a]/20 flex items-center justify-center">
                <span className="text-sm font-medium">Conta Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Funcionalidades</p>
          <p className="text-xs text-[#1a2e1a]">• Login/Registro<br/>• Validação<br/>• Conta demo<br/>• Persistência</p>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Segurança</p>
          <p className="text-xs text-[#1a2e1a]">Dados armazenados no localStorage com validação de campos e senha mínima</p>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">UX</p>
          <p className="text-xs text-[#1a2e1a]">Toggle entre modos, senha visível, feedback toast, loading states</p>
        </div>
      </div>
    </div>
  );
}

function WelcomeWireframe() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#1a2e1a]">Tela de Boas-Vindas</h3>
        <span className="text-sm text-[#5a7368] px-3 py-1 bg-[#e8f0ed] rounded-full">Mobile First</span>
      </div>

      <div className="border-2 border-[#2d5a4a]/30 rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-br from-[#2d5a4a] to-[#1e4d5c] p-8 min-h-[600px] flex items-center justify-center relative">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Icons */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center">
                <Droplets className="w-10 h-10 text-white" />
              </div>
              <div className="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center">
                <div className="w-10 h-10 bg-white/30 rounded" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="h-10 bg-white/90 rounded-lg w-3/4 mx-auto flex items-center justify-center">
                <span className="text-[#2d5a4a] font-medium">Irrigação Inteligente</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 px-4">
              <div className="h-4 bg-white/60 rounded w-full" />
              <div className="h-4 bg-white/60 rounded w-5/6 mx-auto" />
              <div className="h-4 bg-white/60 rounded w-4/5 mx-auto" />
            </div>

            {/* Buttons */}
            <div className="space-y-3 px-4">
              <div className="h-14 bg-white rounded-xl shadow-md flex items-center justify-center">
                <span className="text-[#2d5a4a] font-medium">Começar</span>
              </div>
              <div className="h-12 bg-white/20 border-2 border-white/40 rounded-xl flex items-center justify-center gap-2">
                <Layout className="w-5 h-5 text-white" />
                <span className="text-white">Ver Wireframes</span>
              </div>
            </div>

            {/* Description text */}
            <p className="text-white/70 text-sm">Sistema de monitoramento e controle inteligente</p>
          </div>

          {/* Version */}
          <div className="absolute bottom-8 text-white/50 text-sm">v1.0.0</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Cores Principais</p>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-[#2d5a4a] rounded border border-[#1a2e1a]/20" title="#2d5a4a" />
            <div className="w-8 h-8 bg-[#1e4d5c] rounded border border-[#1a2e1a]/20" title="#1e4d5c" />
            <div className="w-8 h-8 bg-white rounded border border-[#1a2e1a]/20" title="#ffffff" />
          </div>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Elementos Chave</p>
          <p className="text-xs text-[#1a2e1a]">• Gradiente hero<br/>• 2 CTAs principais<br/>• Ícones grandes</p>
        </div>
      </div>
    </div>
  );
}

function DashboardWireframe() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#1a2e1a]">Dashboard Principal</h3>
        <span className="text-sm text-[#5a7368] px-3 py-1 bg-[#e8f0ed] rounded-full">Responsive Layout</span>
      </div>

      <div className="border-2 border-[#2d5a4a]/30 rounded-2xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="bg-white p-4 border-b-2 border-[#2d5a4a]/20">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <div className="h-7 bg-[#1a2e1a] rounded w-56 flex items-center px-3">
                <span className="text-white text-sm">Irrigação Inteligente</span>
              </div>
              <div className="h-4 bg-[#5a7368]/30 rounded w-32 flex items-center px-2">
                <span className="text-xs text-[#5a7368]">Tomate • 2.5 ha</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-10 h-10 border-2 border-[#2d5a4a] rounded-lg flex items-center justify-center hover:bg-[#e8f0ed] transition-colors">
                <Layout className="w-5 h-5 text-[#2d5a4a]" />
              </div>
              <div className="w-10 h-10 border-2 border-[#2d5a4a] rounded-lg flex items-center justify-center">
                <span className="text-[#2d5a4a]">↶</span>
              </div>
              <div className="w-10 h-10 bg-[#2d5a4a] text-white rounded-lg flex items-center justify-center">
                <span className="text-xl">+</span>
              </div>
              <div className="w-10 h-10 border-2 border-[#2d5a4a] rounded-lg relative flex items-center justify-center">
                <span className="text-lg">🔔</span>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#e8a836] rounded-full text-white text-xs flex items-center justify-center">2</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-t-2 border-[#2d5a4a]/10 pt-3">
            {[
              { label: 'Culturas', active: false },
              { label: 'Dashboard', active: true },
              { label: 'Válvulas', active: false },
              { label: 'Sensores', active: false },
              { label: 'Análises', active: false }
            ].map((item, i) => (
              <div
                key={i}
                className={`h-9 rounded-lg px-4 flex items-center transition-all ${
                  item.active
                    ? 'bg-[#2d5a4a]/15 border-b-2 border-[#2d5a4a] font-medium'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <span className={`text-sm ${item.active ? 'text-[#2d5a4a]' : 'text-[#5a7368]'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-[#f8faf9]">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-[#2d5a4a] to-[#1e4d5c] rounded-2xl p-6 flex items-center">
            <div>
              <div className="h-6 bg-white/90 rounded w-48 mb-2 flex items-center px-3">
                <span className="text-white text-sm">Cultura: Tomate</span>
              </div>
              <div className="h-4 bg-white/60 rounded w-72 flex items-center px-2">
                <span className="text-white/80 text-xs">Status geral do sistema de irrigação</span>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '💧', label: 'Válvulas Ativas', value: '2 de 3', color: 'bg-[#e8f0ed]', iconColor: 'text-[#2d5a4a]' },
              { icon: '🌡️', label: 'Sensores Online', value: '4 de 4', color: 'bg-[#e6f3f7]', iconColor: 'text-[#1e4d5c]' },
              { icon: '⚠️', label: 'Alertas', value: '2', color: 'bg-[#fff4e6]', iconColor: 'text-[#e8a836]' }
            ].map((metric, i) => (
              <div key={i} className="bg-white border-2 border-[#2d5a4a]/20 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center text-xl`}>
                    {metric.icon}
                  </div>
                  <div>
                    <div className="h-3 bg-[#5a7368]/40 rounded w-20 mb-2" />
                    <div className="h-5 bg-[#1a2e1a] rounded w-16 flex items-center px-2">
                      <span className="text-white text-xs font-medium">{metric.value}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Panels */}
          <div className="grid grid-cols-2 gap-6">
            {/* Valves Panel */}
            <div className="bg-white border-2 border-[#2d5a4a]/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-[#2d5a4a] rounded" />
                <div className="h-5 bg-[#2d5a4a] rounded w-24 flex items-center px-2">
                  <span className="text-white text-xs font-medium">Válvulas</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { active: true, name: 'Válvula Setor A', flow: '45 L/min' },
                  { active: false, name: 'Válvula Setor B', flow: '0 L/min' },
                  { active: true, name: 'Válvula Setor C', flow: '38 L/min' }
                ].map((valve, i) => (
                  <div key={i} className="flex items-center justify-between h-14 bg-[#f8faf9] rounded-lg px-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${valve.active ? 'bg-[#4a8c6f]' : 'bg-gray-300'}`} />
                      <div className="h-3 bg-[#1a2e1a]/70 rounded w-28" />
                    </div>
                    <div className="h-3 bg-[#5a7368]/40 rounded w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Sensors Panel */}
            <div className="bg-white border-2 border-[#2d5a4a]/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-[#1e4d5c] rounded" />
                <div className="h-5 bg-[#1e4d5c] rounded w-24 flex items-center px-2">
                  <span className="text-white text-xs font-medium">Sensores</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { status: 'ok', name: 'Sensor 1 - Norte', humidity: 62, temp: 24 },
                  { status: 'dry', name: 'Sensor 2 - Sul', humidity: 28, temp: 28 },
                  { status: 'wet', name: 'Sensor 3 - Leste', humidity: 85, temp: 22 },
                  { status: 'ok', name: 'Sensor 4 - Oeste', humidity: 55, temp: 26 }
                ].map((sensor, i) => (
                  <div key={i} className="bg-[#f8faf9] rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="h-3 bg-[#1a2e1a]/70 rounded w-28" />
                      {sensor.status === 'dry' && (
                        <div className="h-5 bg-[#fff4e6] rounded-full px-2 flex items-center">
                          <span className="text-[#e8a836] text-xs">⚠️ Seco</span>
                        </div>
                      )}
                      {sensor.status === 'wet' && (
                        <div className="h-5 bg-[#e6f3f7] rounded-full px-2 flex items-center">
                          <span className="text-[#1e4d5c] text-xs">💧 Úmido</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <div className="h-2 bg-[#5a7368]/30 rounded w-16" />
                      <div className="h-2 bg-[#5a7368]/30 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Layout</p>
          <p className="text-xs text-[#1a2e1a]">• Header fixo<br/>• Tabs navegação<br/>• Grid responsivo</p>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Componentes</p>
          <p className="text-xs text-[#1a2e1a]">• 3 Cards métricas<br/>• 2 Painéis dados<br/>• Banner status</p>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Interações</p>
          <p className="text-xs text-[#1a2e1a]">• Notificações<br/>• Add cultura<br/>• Ver wireframes</p>
        </div>
      </div>
    </div>
  );
}

function ValvesWireframe() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#1a2e1a]">Controle de Válvulas</h3>
        <span className="text-sm text-[#5a7368] px-3 py-1 bg-[#e8f0ed] rounded-full">Grid 2 Colunas</span>
      </div>

      <div className="border-2 border-[#2d5a4a]/30 rounded-2xl p-6 bg-[#f8faf9] shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 bg-[#1a2e1a] rounded-lg w-56 flex items-center px-3">
            <span className="text-white text-sm font-medium">Controle de Válvulas</span>
          </div>
          <div className="h-10 bg-[#2d5a4a] rounded-lg px-4 flex items-center gap-2 hover:bg-[#1a3d2f] transition-colors">
            <span className="text-xs">⚙️</span>
            <span className="text-white text-sm">Configurar</span>
          </div>
        </div>

        {/* Valve Cards Grid */}
        <div className="grid grid-cols-2 gap-6">
          {[
            { id: 1, active: true, name: 'Válvula Setor A', flow: 45, pressure: 2.5, time: '10 min' },
            { id: 2, active: false, name: 'Válvula Setor B', flow: 0, pressure: 0, time: '2h' },
            { id: 3, active: true, name: 'Válvula Setor C', flow: 38, pressure: 2.2, time: '5 min' },
            { id: 4, active: false, name: 'Válvula Setor D', flow: 0, pressure: 0, time: '1h' }
          ].map((valve) => (
            <div key={valve.id} className="bg-white border-2 border-[#2d5a4a]/20 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl ${
                    valve.active ? 'bg-[#e8f0ed]' : 'bg-gray-100'
                  }`}>
                    <Droplets className={`w-7 h-7 ${valve.active ? 'text-[#2d5a4a]' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="h-4 bg-[#1a2e1a] rounded w-36 mb-2 flex items-center px-2">
                      <span className="text-white text-xs font-medium">{valve.name}</span>
                    </div>
                    <div className={`h-5 rounded-full px-2 flex items-center w-fit ${
                      valve.active ? 'bg-[#e8f0ed]' : 'bg-gray-100'
                    }`}>
                      <span className={`text-xs ${valve.active ? 'text-[#4a8c6f]' : 'text-gray-400'}`}>
                        {valve.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>
                </div>
                <button className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  valve.active
                    ? 'bg-[#4a8c6f] hover:bg-[#2d5a4a]'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}>
                  <span className={valve.active ? 'text-white' : 'text-gray-600'}>⚡</span>
                </button>
              </div>

              {/* Metrics */}
              <div className="border-t-2 border-[#2d5a4a]/10 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#5a7368]">Fluxo</span>
                  <div className="h-4 bg-[#1a2e1a] rounded px-2 flex items-center">
                    <span className="text-white text-xs font-medium">{valve.flow} L/min</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#5a7368]">Pressão</span>
                  <div className="h-4 bg-[#1a2e1a] rounded px-2 flex items-center">
                    <span className="text-white text-xs font-medium">{valve.pressure.toFixed(1)} bar</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#5a7368] flex items-center gap-1">
                    <span>🕐</span> Última ativação
                  </span>
                  <div className="h-4 bg-[#1a2e1a] rounded px-2 flex items-center">
                    <span className="text-white text-xs">{valve.time} atrás</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {valve.active && (
                <div className="mt-4 pt-4 border-t-2 border-[#2d5a4a]/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#5a7368]">Capacidade</span>
                    <span className="text-xs text-[#1a2e1a] font-medium">{Math.round((valve.flow / 60) * 100)}%</span>
                  </div>
                  <div className="h-2.5 bg-[#e8f0ed] rounded-full overflow-hidden">
                    <div
                      className="h-2.5 bg-gradient-to-r from-[#2d5a4a] to-[#4a8c6f] rounded-full transition-all"
                      style={{ width: `${(valve.flow / 60) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Estados</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#4a8c6f] rounded-full" />
              <span className="text-xs text-[#1a2e1a]">Ativa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              <span className="text-xs text-[#1a2e1a]">Inativa</span>
            </div>
          </div>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Métricas</p>
          <p className="text-xs text-[#1a2e1a]">• Fluxo (L/min)<br/>• Pressão (bar)<br/>• Tempo ativo</p>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Ações</p>
          <p className="text-xs text-[#1a2e1a]">• Liga/Desliga<br/>• Ver histórico<br/>• Configurar</p>
        </div>
      </div>
    </div>
  );
}

function SensorsWireframe() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#1a2e1a]">Monitoramento de Sensores</h3>
        <span className="text-sm text-[#5a7368] px-3 py-1 bg-[#e8f0ed] rounded-full">Grid 3 Colunas</span>
      </div>

      <div className="border-2 border-[#2d5a4a]/30 rounded-2xl p-6 bg-[#f8faf9] shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 bg-[#1a2e1a] rounded-lg w-64 flex items-center px-3">
            <span className="text-white text-sm font-medium">Monitoramento de Sensores</span>
          </div>
          <div className="h-9 bg-[#e8f0ed] rounded-lg px-3 flex items-center gap-2 border border-[#2d5a4a]/20">
            <div className="w-2 h-2 bg-[#4a8c6f] rounded-full animate-pulse" />
            <span className="text-[#1a2e1a] text-sm font-medium">Online</span>
          </div>
        </div>

        {/* Sensor Cards Grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 1, name: 'Sensor 1 - Setor Norte', location: 'Norte', humidity: 62, temp: 24, pressure: 1013, status: 'ok' },
            { id: 2, name: 'Sensor 2 - Setor Sul', location: 'Sul', humidity: 28, temp: 28, pressure: 1015, status: 'dry' },
            { id: 3, name: 'Sensor 3 - Setor Leste', location: 'Leste', humidity: 85, temp: 22, pressure: 1012, status: 'wet' },
            { id: 4, name: 'Sensor 4 - Setor Oeste', location: 'Oeste', humidity: 55, temp: 26, pressure: 1014, status: 'ok' },
            { id: 5, name: 'Sensor 5 - Setor Central', location: 'Central', humidity: 48, temp: 25, pressure: 1013, status: 'ok' },
            { id: 6, name: 'Sensor 6 - Setor Reserva', location: 'Reserva', humidity: 32, temp: 27, pressure: 1016, status: 'dry' }
          ].map((sensor) => (
            <div key={sensor.id} className="bg-white border-2 border-[#2d5a4a]/20 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-4 bg-[#1a2e1a] rounded w-full mb-2 flex items-center px-2">
                    <span className="text-white text-xs font-medium truncate">{sensor.name}</span>
                  </div>
                  <div className="h-3 bg-[#5a7368]/30 rounded w-16 flex items-center px-1">
                    <span className="text-[#5a7368] text-xs">{sensor.location}</span>
                  </div>
                </div>
                <div className={`h-7 rounded-full px-2 flex items-center gap-1 ml-2 ${
                  sensor.status === 'dry' ? 'bg-[#fff4e6]' :
                  sensor.status === 'wet' ? 'bg-[#e6f3f7]' :
                  'bg-[#e8f0ed]'
                }`}>
                  <span className="text-xs">
                    {sensor.status === 'dry' ? '⚠️' : sensor.status === 'wet' ? '💧' : '✓'}
                  </span>
                  <span className={`text-xs font-medium ${
                    sensor.status === 'dry' ? 'text-[#e8a836]' :
                    sensor.status === 'wet' ? 'text-[#1e4d5c]' :
                    'text-[#4a8c6f]'
                  }`}>
                    {sensor.status === 'dry' ? 'Seco' : sensor.status === 'wet' ? 'Úmido' : 'OK'}
                  </span>
                </div>
              </div>

              {/* Humidity */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-[#5a7368]" />
                    <span className="text-xs text-[#5a7368]">Umidade do Solo</span>
                  </div>
                  <div className="h-4 bg-[#1a2e1a] rounded px-2 flex items-center">
                    <span className="text-white text-xs font-medium">{sensor.humidity}%</span>
                  </div>
                </div>
                <div className="h-2.5 bg-[#e8f0ed] rounded-full overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      sensor.humidity < 40 ? 'bg-[#e8a836]' :
                      sensor.humidity > 80 ? 'bg-[#1e4d5c]' :
                      'bg-gradient-to-r from-[#2d5a4a] to-[#4a8c6f]'
                    }`}
                    style={{ width: `${sensor.humidity}%` }}
                  />
                </div>
              </div>

              {/* Temperature & Pressure */}
              <div className="space-y-3 border-t-2 border-[#2d5a4a]/10 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">🌡️</span>
                    <span className="text-xs text-[#5a7368]">Temperatura</span>
                  </div>
                  <div className="h-4 bg-[#1a2e1a] rounded px-2 flex items-center">
                    <span className="text-white text-xs font-medium">{sensor.temp}°C</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">💨</span>
                    <span className="text-xs text-[#5a7368]">Pressão Atm.</span>
                  </div>
                  <div className="h-4 bg-[#1a2e1a] rounded px-2 flex items-center">
                    <span className="text-white text-xs font-medium">{sensor.pressure}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div className="mt-6 bg-gradient-to-r from-[#e8f0ed] to-[#e6f3f7] border-2 border-[#2d5a4a]/20 rounded-xl p-5 shadow-sm">
          <div className="h-6 bg-[#1a2e1a] rounded-lg w-48 mb-4 flex items-center px-3">
            <span className="text-white text-sm font-medium">Resumo do Sistema</span>
          </div>
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: 'Umidade Média', value: '52%', color: 'text-[#2d5a4a]' },
              { label: 'Temperatura Média', value: '25°C', color: 'text-[#1e4d5c]' },
              { label: 'Sensores Ativos', value: '6/6', color: 'text-[#4a8c6f]' },
              { label: 'Alertas Ativos', value: '2', color: 'text-[#e8a836]' }
            ].map((item, i) => (
              <div key={i}>
                <p className="text-xs text-[#5a7368] mb-2">{item.label}</p>
                <div className={`h-6 bg-white rounded-lg px-3 flex items-center border border-[#2d5a4a]/20`}>
                  <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Status dos Sensores</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#4a8c6f] rounded-full" />
              <span className="text-xs text-[#1a2e1a]">Normal (4)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#e8a836] rounded-full" />
              <span className="text-xs text-[#1a2e1a]">Seco (2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#1e4d5c] rounded-full" />
              <span className="text-xs text-[#1a2e1a]">Úmido (1)</span>
            </div>
          </div>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Métricas</p>
          <p className="text-xs text-[#1a2e1a]">• Umidade (%)<br/>• Temperatura (°C)<br/>• Pressão (hPa)</p>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Card Resumo</p>
          <p className="text-xs text-[#1a2e1a]">• Médias gerais<br/>• Sensores online<br/>• Alertas ativos</p>
        </div>
      </div>
    </div>
  );
}

function AnalyticsWireframe() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#1a2e1a]">Análises Web</h3>
        <span className="text-sm text-[#5a7368] px-3 py-1 bg-[#e8f0ed] rounded-full">Redirect to Web</span>
      </div>

      <div className="border-2 border-[#2d5a4a]/30 rounded-2xl p-6 bg-[#f8faf9] space-y-6 shadow-lg">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-[#2d5a4a] to-[#1e4d5c] rounded-2xl p-8 shadow-md">
          <div className="max-w-2xl">
            <div className="h-7 bg-white rounded-lg w-80 mb-3 flex items-center px-3">
              <span className="text-[#1a2e1a] text-sm font-medium">Análises e Gráficos Avançados</span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="h-3 bg-white/70 rounded w-full" />
              <div className="h-3 bg-white/70 rounded w-11/12" />
              <div className="h-3 bg-white/70 rounded w-4/5" />
            </div>
            <div className="h-12 bg-white rounded-xl w-64 flex items-center px-4 gap-2 hover:bg-white/90 transition-colors cursor-pointer shadow-sm">
              <span className="text-xs">🔗</span>
              <span className="text-[#2d5a4a] text-sm font-medium">Acessar Plataforma Web</span>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: '📊', title: 'Gráficos Detalhados', desc: 'Visualize dados históricos' },
            { icon: '📈', title: 'Análises Avançadas', desc: 'Previsões de consumo' },
            { icon: '📅', title: 'Relatórios Periódicos', desc: 'Diários, semanais e mensais' }
          ].map((feature, i) => (
            <div key={i} className="bg-white border-2 border-[#2d5a4a]/20 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#e8f0ed] rounded-xl flex items-center justify-center mb-4 text-2xl">
                {feature.icon}
              </div>
              <div className="h-5 bg-[#1a2e1a] rounded-lg w-full mb-3 flex items-center px-2">
                <span className="text-white text-xs font-medium">{feature.title}</span>
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-[#5a7368]/30 rounded w-full" />
                <div className="h-3 bg-[#5a7368]/30 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>

        {/* Features List */}
        <div className="bg-white border-2 border-[#2d5a4a]/20 rounded-xl p-6 shadow-sm">
          <div className="h-6 bg-[#1a2e1a] rounded-lg w-64 mb-5 flex items-center px-3">
            <span className="text-white text-sm font-medium">Recursos da Plataforma Web</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              'Gráficos interativos de consumo de água',
              'Comparação entre diferentes culturas',
              'Previsões meteorológicas integradas',
              'Exportação de relatórios PDF e Excel',
              'Histórico completo de válvulas',
              'Análise de eficiência hídrica',
              'Alertas personalizados por e-mail',
              'Dashboard customizável com widgets'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#f8faf9] rounded-lg hover:bg-[#e8f0ed] transition-colors">
                <div className="w-2 h-2 bg-[#2d5a4a] rounded-full flex-shrink-0" />
                <div className="h-3 bg-[#1a2e1a]/70 rounded flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-[#e8f0ed] to-[#e6f3f7] border-2 border-[#2d5a4a]/20 rounded-xl p-6 shadow-sm">
          <div className="flex gap-5">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
              📊
            </div>
            <div className="flex-1">
              <div className="h-5 bg-[#1a2e1a] rounded-lg w-56 mb-3 flex items-center px-2">
                <span className="text-white text-xs font-medium">Sincronização Automática</span>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-[#5a7368]/40 rounded w-full" />
                <div className="h-3 bg-[#5a7368]/40 rounded w-11/12" />
                <div className="h-3 bg-[#5a7368]/40 rounded w-5/6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Seções</p>
          <p className="text-xs text-[#1a2e1a]">• Hero banner<br/>• 3 Cards recursos<br/>• Lista features<br/>• Info sync</p>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">CTA Principal</p>
          <p className="text-xs text-[#1a2e1a]">Botão para redirecionar à plataforma web externa com análises completas</p>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Objetivo</p>
          <p className="text-xs text-[#1a2e1a]">Apresentar recursos avançados disponíveis na plataforma web</p>
        </div>
      </div>
    </div>
  );
}

function ModalWireframe() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#1a2e1a]">Modal Nova Cultura</h3>
        <span className="text-sm text-[#5a7368] px-3 py-1 bg-[#e8f0ed] rounded-full">Modal Form</span>
      </div>

      <div className="border-2 border-[#2d5a4a]/30 rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-black/50 p-12 min-h-[600px] flex items-center justify-center relative">
          {/* Modal */}
          <div className="max-w-lg w-full bg-white rounded-2xl p-8 shadow-2xl relative z-10 border-2 border-[#2d5a4a]/20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="h-7 bg-[#1a2e1a] rounded-lg w-40 flex items-center px-3">
                <span className="text-white text-sm font-medium">Nova Cultura</span>
              </div>
              <button className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Name Field */}
              <div>
                <div className="h-5 bg-[#1a2e1a] rounded w-36 mb-2 flex items-center px-2">
                  <span className="text-white text-xs font-medium">Nome da Cultura</span>
                </div>
                <div className="h-14 bg-[#f8faf9] border-2 border-[#2d5a4a]/20 rounded-xl flex items-center px-4 hover:border-[#2d5a4a]/40 transition-colors">
                  <div className="h-3 bg-[#5a7368]/30 rounded w-48" />
                </div>
              </div>

              {/* Area Field */}
              <div>
                <div className="h-5 bg-[#1a2e1a] rounded w-36 mb-2 flex items-center px-2">
                  <span className="text-white text-xs font-medium">Área (hectares)</span>
                </div>
                <div className="h-14 bg-[#f8faf9] border-2 border-[#2d5a4a]/20 rounded-xl flex items-center px-4 hover:border-[#2d5a4a]/40 transition-colors">
                  <div className="h-3 bg-[#5a7368]/30 rounded w-24" />
                </div>
              </div>

              {/* Date Field */}
              <div>
                <div className="h-5 bg-[#1a2e1a] rounded w-36 mb-2 flex items-center px-2">
                  <span className="text-white text-xs font-medium">Data de Plantio</span>
                </div>
                <div className="h-14 bg-[#f8faf9] border-2 border-[#2d5a4a]/20 rounded-xl flex items-center px-4 hover:border-[#2d5a4a]/40 transition-colors">
                  <div className="h-3 bg-[#5a7368]/30 rounded w-32" />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button className="w-full h-14 bg-[#2d5a4a] rounded-xl flex items-center justify-center gap-3 hover:bg-[#1a3d2f] transition-colors shadow-md">
                  <div className="w-6 h-6 border-2 border-white rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg leading-none">+</span>
                  </div>
                  <div className="h-4 bg-white/90 rounded w-40 flex items-center px-2">
                    <span className="text-[#2d5a4a] text-sm font-medium">Adicionar Cultura</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Background hint */}
          <div className="absolute top-4 left-4 text-white/50 text-sm">Overlay escuro (bg-black/50)</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Estrutura</p>
          <p className="text-xs text-[#1a2e1a]">• Overlay escuro<br/>• Modal centralizado<br/>• Form com 3 campos<br/>• Botão submit</p>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Campos</p>
          <p className="text-xs text-[#1a2e1a]">1. Nome da cultura<br/>2. Área (hectares)<br/>3. Data de plantio</p>
        </div>
        <div className="bg-[#f8faf9] border border-[#2d5a4a]/20 rounded-lg p-3">
          <p className="text-xs text-[#5a7368] mb-2">Interação</p>
          <p className="text-xs text-[#1a2e1a]">• Fechar (X)<br/>• Preencher form<br/>• Adicionar cultura<br/>• Validação campos</p>
        </div>
      </div>
    </div>
  );
}
