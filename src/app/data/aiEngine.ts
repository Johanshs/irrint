import { IrrigationRecommendation, SensorAnomaly, SoilHealthScore, SensorReading, Culture } from '../types';

// Crop coefficients (Kc) for simplified Penman-Monteith
const CROP_COEFFICIENTS: Record<string, number> = {
  horta: 1.05,
  jardim: 0.85,
  gramado: 0.90,
  tomate: 1.15,
  alface: 1.00,
  milho: 1.20,
  cafe: 0.95,
  soja: 1.10,
  morango: 0.75,
  feijao: 1.05,
  outro: 1.00,
};

const OPTIMAL_HUMIDITY: Record<string, [number, number]> = {
  horta: [60, 80],
  jardim: [50, 70],
  gramado: [40, 60],
  tomate: [65, 85],
  alface: [70, 90],
  milho: [55, 75],
  cafe: [50, 70],
  soja: [60, 80],
  morango: [65, 80],
  feijao: [55, 75],
  outro: [50, 70],
};

export function getIrrigationRecommendation(params: {
  cultureType: string;
  soilMoisture: number;
  temperature: number;
  area_m2: number;
  daysSincePlanting: number;
}): IrrigationRecommendation {
  const { cultureType, soilMoisture, temperature, area_m2 } = params;
  
  const kc = CROP_COEFFICIENTS[cultureType] || 1.0;
  const optimalRange = OPTIMAL_HUMIDITY[cultureType] || [50, 70];
  const targetMoisture = (optimalRange[0] + optimalRange[1]) / 2;

  // Simplified ETo (Reference Evapotranspiration) based roughly on temperature
  // Normal range: 2-8 mm/day. Just a simulation approximation.
  const eto = Math.max(1, (temperature - 15) * 0.3 + 3); 
  
  // Plant water requirement (mm/day)
  const etc = eto * kc;

  // Calculate volume needed. 1mm = 1 Liter/m2
  let waterDeficitPercent = targetMoisture - soilMoisture;
  
  let shouldIrrigate = false;
  let urgency: 'baixa' | 'média' | 'alta' | 'imediata' = 'baixa';
  let volumeLiters = 0;
  let durationMinutes = 0;
  let reasoning = `Solo está com ${soilMoisture}%. Nível ideal para ${cultureType} é ${optimalRange[0]}-${optimalRange[1]}%. `;

  if (soilMoisture < optimalRange[0]) {
    shouldIrrigate = true;
    
    // Very simplified correlation: assume 1% deficit in 20cm root zone ~ 2L/m2
    volumeLiters = Math.max(etc * area_m2, waterDeficitPercent * 2 * area_m2);
    
    // Assume average flow rate of 15 L/min for the area
    durationMinutes = Math.ceil(volumeLiters / 15);

    if (soilMoisture < optimalRange[0] - 15) {
      urgency = 'imediata';
      reasoning += `Deficit hídrico crítico. Risco de estresse da planta. Evapotranspiração estimada: ${etc.toFixed(1)} mm/dia.`;
    } else if (soilMoisture < optimalRange[0] - 5) {
      urgency = 'alta';
      reasoning += `Abaixo do ideal. Sugerida reposição hídrica. Evapotranspiração estimada: ${etc.toFixed(1)} mm/dia.`;
    } else {
      urgency = 'média';
      reasoning += `Leve déficit. Pode aguardar próximo ciclo ou irrigar agora.`;
    }
  } else if (soilMoisture > optimalRange[1] + 10) {
    reasoning += `Atenção: Solo saturado! Risco de asfixia radicular e fungos. Suspenda a irrigação.`;
  } else {
    reasoning += `Umidade dentro da faixa ideal. Nenhuma ação necessária no momento.`;
  }

  // Cap duration for sanity in UI
  durationMinutes = Math.min(durationMinutes, 120);

  return {
    shouldIrrigate,
    volumeLiters: Math.round(volumeLiters),
    durationMinutes,
    urgency,
    reasoning,
  };
}

export function detectAnomaly(
  readings: SensorReading[],
  newReading: number,
  sensorName: string
): SensorAnomaly | null {
  if (readings.length < 5) return null; // Need some history

  const values = readings.map(r => r.humidity);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // If stdDev is 0 (flat line), any change is an anomaly. Add a small baseline to avoid infinity.
  const safeStdDev = Math.max(stdDev, 1.0);
  const zScore = Math.abs((newReading - mean) / safeStdDev);

  if (zScore > 2.5) {
    const isSuddenDrop = newReading < mean;
    const severity = zScore > 4 ? 'high' : zScore > 3 ? 'medium' : 'low';
    
    let message = `Queda brusca de umidade detectada.`;
    let possibleCauses = [
      'Vazamento na tubulação próxima',
      'Descalibração súbita do sensor',
      'Aumento extremo de temperatura/vento',
    ];

    if (!isSuddenDrop) {
      message = `Aumento anormal de umidade sem irrigação registrada.`;
      possibleCauses = [
        'Chuva não prevista',
        'Válvula travada aberta (vazamento)',
        'Água empoçada ao redor do sensor',
      ];
    }

    return {
      isAnomaly: true,
      severity,
      message: `${sensorName}: ${message} (Z-Score: ${zScore.toFixed(1)})`,
      possibleCauses,
    };
  }

  return null;
}

export function calculateSoilHealth(params: {
  humidity: number;
  temperature: number;
  cultureType: string;
}): SoilHealthScore {
  const { humidity, temperature, cultureType } = params;
  const optimalRange = OPTIMAL_HUMIDITY[cultureType] || [50, 70];
  
  let score = 100;
  const recommendations: string[] = [];

  // Evaluate humidity
  if (humidity >= optimalRange[0] && humidity <= optimalRange[1]) {
    // Perfect
  } else if (humidity < optimalRange[0]) {
    const deficit = optimalRange[0] - humidity;
    score -= deficit * 2;
    if (deficit > 15) recommendations.push('Irrigação urgente necessária.');
    else recommendations.push('Agendar irrigação em breve.');
  } else {
    const excess = humidity - optimalRange[1];
    score -= excess * 1.5;
    if (excess > 15) recommendations.push('Solo encharcado. Suspenda irrigação e melhore drenagem.');
    else recommendations.push('Solo levemente saturado.');
  }

  // Evaluate temperature
  if (temperature < 10) {
    score -= (10 - temperature) * 3;
    recommendations.push('Temperatura do solo muito baixa. Risco de dormência.');
  } else if (temperature > 35) {
    score -= (temperature - 35) * 3;
    recommendations.push('Estresse térmico nas raízes. Considere cobertura morta (mulch).');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let classification: SoilHealthScore['classification'] = 'Bom';
  if (score >= 90) classification = 'Ideal';
  else if (score >= 70) classification = 'Bom';
  else if (score >= 50) classification = 'Atenção';
  else if (humidity > optimalRange[1] + 15) classification = 'Saturado';
  else classification = 'Crítico';

  if (recommendations.length === 0) {
    recommendations.push('Condições excelentes mantidas.');
  }

  return {
    score,
    classification,
    recommendations,
  };
}
