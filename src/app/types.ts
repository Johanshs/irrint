export interface AutomationConfig {
  irrigationType: string;
  schedules: string[];
  durationMinutes: number;
  frequency: string;
  minHumidity: number;
  mode: 'automatic' | 'scheduled';
}

export interface Culture {
  id: string; // Changed to string (UUID)
  name: string;
  area: string;
  plantDate: string;
  isActive: boolean;
  cultureType: string;
  automation: AutomationConfig;
}

export interface Valve {
  id: string; // Changed to string (UUID)
  name: string;
  status: 'active' | 'inactive';
  flow: number;
  pressure: number;
  lastActive: string;
}

export interface Sensor {
  id: string; // Changed to string (UUID)
  name: string;
  humidity: number;
  temp: number;
  pressure: number;
  status: 'ok' | 'dry' | 'wet' | 'error';
  location: string;
}

export interface Notification {
  id: string; // Changed to string (UUID)
  type: 'dry' | 'wet' | 'info' | 'error' | 'anomaly';
  message: string;
  location: string;
  time: string;
  read: boolean;
}

export interface SyncUser {
  id: string; // Changed to string (UUID)
  name: string;
  email: string;
  password?: string;
  createdAt?: string;
}

// Data structures for AI/Simulators
export interface SensorReading {
  timestamp: number;
  humidity: number;
  temp: number;
}

export interface SoilHealthScore {
  score: number; // 0-100
  classification: 'Crítico' | 'Atenção' | 'Bom' | 'Ideal' | 'Saturado';
  recommendations: string[];
}

export interface IrrigationRecommendation {
  shouldIrrigate: boolean;
  volumeLiters: number;
  durationMinutes: number;
  urgency: 'baixa' | 'média' | 'alta' | 'imediata';
  reasoning: string;
}

export interface SensorAnomaly {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  message: string;
  possibleCauses: string[];
}

// Context for Router Outlet
export interface OutletContext {
  activeCultureNames: string;
  cultures: Culture[];
  onSetActiveCulture: (id: string) => void;
  onDeleteCulture: (id: string) => void;
  valves: Valve[];
  onAddValve: (valve: { name: string; sector: string; maxFlow: number }) => void;
  onToggleValve: (id: string) => void;
  onDeleteValve: (id: string) => void;
  sensors: Sensor[];
  onAddSensor: (sensor: { name: string; location: string; type: string }) => void;
  onDeleteSensor: (id: string) => void;
  sensorHistory: Record<string, SensorReading[]>;
  soilHealth: SoilHealthScore | null;
  irrigationRecommendation: IrrigationRecommendation | null;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
}
