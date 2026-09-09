import { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Droplets, Thermometer, BarChart3, Plus, Menu, X, LogOut, Sprout, User as UserIcon, Sun, Moon, Monitor } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { CultureModal } from './CultureModal';
import { WireframesGallery } from './WireframesGallery';
import { toast } from 'sonner';
import { subscribeToState, updateField } from '../data/syncService';
import { Culture, Valve, Sensor, SensorReading, SoilHealthScore, IrrigationRecommendation, Notification } from '../types';
import { auth, functions } from '../config/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWireframesOpen, setIsWireframesOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Data State
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [valves, setValves] = useState<Valve[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);

  // App-level derived state
  const [sensorHistory, setSensorHistory] = useState<Record<string, SensorReading[]>>({});
  const [soilHealth, setSoilHealth] = useState<SoilHealthScore | null>(null);
  const [irrigationRecommendation, setIrrigationRecommendation] = useState<IrrigationRecommendation | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const menuItems = useMemo(() => [
    { icon: Sprout, label: 'Plantios', path: '/cultures' },
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Droplets, label: 'Válvulas', path: '/valves' },
    { icon: Thermometer, label: 'Sensores', path: '/sensors' },
    { icon: BarChart3, label: 'Análises Web', path: '/analytics' },
  ], []);

  const activeCultures = useMemo(() => cultures.filter(c => c.isActive), [cultures]);
  const activeCultureNames = activeCultures.length > 0 
    ? activeCultures.map(c => c.name).join(', ') 
    : 'Nenhum plantio ativo';

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('irrigacao_current_user');
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  // 1. Auth Subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. Data Subscription
  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribe = subscribeToState(currentUser.uid, (data) => {
      if (data.cultures) setCultures(data.cultures);
      if (data.valves) setValves(data.valves);
      if (data.sensors) setSensors(data.sensors);
      if (data.sensorHistory) setSensorHistory(data.sensorHistory);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 3. Cloud Function Trigger for AI Logic
  useEffect(() => {
    if (!currentUser || !isLoaded) return;
    
    const processAIFunc = httpsCallable(functions, 'processAI');
    const interval = setInterval(() => {
      processAIFunc().catch(console.error);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentUser, isLoaded]);

  const handleSetActiveCulture = (id: string) => {
    if (!currentUser) return;
    const updated = cultures.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    updateField(currentUser.uid, 'state.cultures', updated);
  };

  const handleAddCulture = (culture: any) => {
    if (!currentUser) return;
    const newCulture: Culture = {
      id: crypto.randomUUID(),
      name: culture.name,
      area: culture.area,
      plantDate: culture.plantDate,
      isActive: false,
      cultureType: culture.cultureType,
      automation: culture.automation,
    };
    const updated = [...cultures, newCulture];
    updateField(currentUser.uid, 'state.cultures', updated);
    toast.success(`Plantio "${culture.name}" criado com sucesso!`);
  };

  const handleDeleteCulture = (id: string) => {
    if (!currentUser) return;
    const updated = cultures.filter(c => c.id !== id);
    updateField(currentUser.uid, 'state.cultures', updated);
    toast.success("Plantio removido");
  };

  const handleAddValve = (valve: { name: string; sector: string; maxFlow: number }) => {
    if (!currentUser) return;
    const newValve: Valve = {
      id: crypto.randomUUID(),
      name: valve.name,
      status: 'inactive',
      flow: 0,
      pressure: 0,
      lastActive: 'Nunca',
    };
    const updated = [...valves, newValve];
    updateField(currentUser.uid, 'state.valves', updated);
    toast.success(`Válvula "${valve.name}" adicionada com sucesso!`);
  };

  const handleToggleValve = (id: string) => {
    if (!currentUser) return;
    const updated = valves.map(valve =>
      valve.id === id
        ? {
            ...valve,
            status: valve.status === 'active' ? 'inactive' : 'active',
            flow: valve.status === 'active' ? 0 : Math.floor(Math.random() * 30) + 30,
            pressure: valve.status === 'active' ? 0 : Math.random() * 1.5 + 1.5,
            lastActive: valve.status === 'active' ? 'Agora mesmo' : valve.lastActive
          }
        : valve
    );
    updateField(currentUser.uid, 'state.valves', updated);
  };

  const handleDeleteValve = (id: string) => {
    if (!currentUser) return;
    const updated = valves.filter(v => v.id !== id);
    updateField(currentUser.uid, 'state.valves', updated);
    toast.success("Válvula removida");
  };

  const handleAddSensor = (sensor: { name: string; location: string; type: string }) => {
    if (!currentUser) return;
    const newSensor: Sensor = {
      id: crypto.randomUUID(),
      name: sensor.name,
      humidity: Math.floor(Math.random() * 60) + 20,
      temp: Math.floor(Math.random() * 10) + 20,
      pressure: Math.floor(Math.random() * 10) + 1010,
      status: 'ok',
      location: sensor.location,
    };
    const updated = [...sensors, newSensor];
    updateField(currentUser.uid, 'state.sensors', updated);
    toast.success(`Sensor "${sensor.name}" adicionado com sucesso!`);
  };

  const handleDeleteSensor = (id: string) => {
    if (!currentUser) return;
    const updated = sensors.filter(s => s.id !== id);
    updateField(currentUser.uid, 'state.sensors', updated);
    toast.success("Sensor removido");
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleSSO = async () => {
    if (!currentUser) return;
    try {
      const getCustomToken = httpsCallable(functions, 'generateCustomToken');
      const result = await getCustomToken();
      const customToken = (result.data as any).token;
      if (customToken) {
        window.open(`https://hydroai-dashboard.vercel.app/?token=${customToken}`, "_blank");
      }
    } catch (error) {
      console.error("SSO Error:", error);
      toast.error("Erro ao gerar acesso para o Painel Web");
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-[#2d5a4a] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#2d5a4a] font-medium">Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <header className="bg-white border-b border-[#2d5a4a]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-3 hover:bg-[#e8f0ed] rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6 text-[#1a2e1a]" /> : <Menu className="w-6 h-6 text-[#1a2e1a]" />}
              </button>
              <div>
                <h1 className="text-[#1a2e1a] font-bold">Irrigação Inteligente</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentUser && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-[#e8f0ed] rounded-lg border border-[#2d5a4a]/20">
                  <UserIcon className="w-4 h-4 text-[#2d5a4a]" />
                  <span className="text-sm text-[#1a2e1a] font-medium">{currentUser.email}</span>
                </div>
              )}
              <button onClick={toggleTheme} className="p-3 hover:bg-[#e8f0ed] rounded-lg transition-colors">
                {theme === 'light' ? <Moon className="w-5 h-5 text-[#2d5a4a]" /> : <Sun className="w-5 h-5 text-amber-400" />}
              </button>
              <button
                onClick={handleSSO}
                className="p-3 hover:bg-[#e8f0ed] rounded-lg transition-colors flex items-center gap-2"
                title="Acessar Painel Web"
              >
                <Monitor className="w-5 h-5 text-[#2d5a4a]" />
              </button>
              <button
                onClick={handleLogout}
                className="p-3 hover:bg-[#e8f0ed] rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5 text-[#1a2e1a]" />
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#2d5a4a] text-white px-4 py-3 rounded-lg hover:bg-[#1a3d2f] transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Plantio</span>
              </button>
              <NotificationPanel 
                notifications={notifications}
                onMarkRead={handleMarkNotificationRead}
                onClear={handleClearNotifications}
              />
            </div>
          </div>
        </div>

        <nav className="hidden lg:block border-t border-[#2d5a4a]/10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                      isActive ? 'border-[#2d5a4a] text-[#2d5a4a]' : 'border-transparent text-[#5a7368] hover:text-[#1a2e1a] hover:bg-[#e8f0ed]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full p-4 space-y-2" onClick={e => e.stopPropagation()}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-[#e8f0ed] text-[#2d5a4a]' : 'text-[#5a7368] hover:bg-[#f8faf9]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet context={{
          activeCultureNames,
          cultures,
          onSetActiveCulture: handleSetActiveCulture,
          onDeleteCulture: handleDeleteCulture,
          valves,
          onAddValve: handleAddValve,
          onToggleValve: handleToggleValve,
          onDeleteValve: handleDeleteValve,
          sensors,
          onAddSensor: handleAddSensor,
          onDeleteSensor: handleDeleteSensor,
          sensorHistory,
          soilHealth,
          irrigationRecommendation,
          notifications,
          onMarkNotificationRead: handleMarkNotificationRead,
          onClearNotifications: handleClearNotifications
        }} />
      </main>

      <CultureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddCulture}
        nextIndex={cultures.length + 1}
        valves={valves as any}
        sensors={sensors as any}
      />
      <WireframesGallery
        isOpen={isWireframesOpen}
        onClose={() => setIsWireframesOpen(false)}
      />
    </div>
  );
}
