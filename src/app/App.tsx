import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LoginScreen } from './components/LoginScreen';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './components/Dashboard';
import { CulturesTab } from './components/CulturesTab';
import { ValvesTab } from './components/ValvesTab';
import { SensorsTab } from './components/SensorsTab';
import { WebAnalyticsTab } from './components/WebAnalyticsTab';

import { OutletContext } from './types';

function DashboardWrapper() {
  const { 
    activeCultureNames, cultures, valves, sensors, 
    sensorHistory, soilHealth, irrigationRecommendation 
  } = useOutletContext<OutletContext>();
  
  return <Dashboard 
    activeCultureNames={activeCultureNames} 
    cultures={cultures}
    valves={valves}
    sensors={sensors}
    sensorHistory={sensorHistory}
    soilHealth={soilHealth}
    irrigationRecommendation={irrigationRecommendation}
  />;
}

function CulturesWrapper() {
  const { cultures, onSetActiveCulture, onDeleteCulture } = useOutletContext<OutletContext>();
  return <CulturesTab cultures={cultures} onSetActive={onSetActiveCulture} onDeleteCulture={onDeleteCulture} />;
}

function ValvesWrapper() {
  const { valves, onAddValve, onToggleValve, onDeleteValve } = useOutletContext<OutletContext>();
  return <ValvesTab valves={valves} onAddValve={onAddValve} onToggleValve={onToggleValve} onDeleteValve={onDeleteValve} />;
}

function SensorsWrapper() {
  const { sensors, onAddSensor, onDeleteSensor } = useOutletContext<OutletContext>();
  return <SensorsTab sensors={sensors} onAddSensor={onAddSensor} onDeleteSensor={onDeleteSensor} />;
}

function AnalyticsWrapper() {
  const { sensorHistory } = useOutletContext<OutletContext>();
  return <WebAnalyticsTab sensorHistory={sensorHistory} />;
}

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route element={<MainLayout />}>
            <Route path="/cultures" element={<CulturesWrapper />} />
            <Route path="/dashboard" element={<DashboardWrapper />} />
            <Route path="/valves" element={<ValvesWrapper />} />
            <Route path="/sensors" element={<SensorsWrapper />} />
            <Route path="/analytics" element={<AnalyticsWrapper />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1a2e1a',
            border: '1px solid rgba(45, 90, 74, 0.2)',
          },
        }}
      />
    </>
  );
}
