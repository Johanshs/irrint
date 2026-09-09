import { Valve, Sensor, SensorReading, Culture } from '../types';

export class SensorSimulator {
  private history: Record<string, SensorReading[]> = {};
  
  // Fluctuate a value by a small percentage
  private fluctuate(value: number, maxPercentChange: number = 0.05, min: number, max: number): number {
    const change = value * maxPercentChange * (Math.random() * 2 - 1); // -maxPercentChange to +maxPercentChange
    let newValue = value + change;
    return Math.max(min, Math.min(max, newValue));
  }

  public getHistory() {
    return this.history;
  }

  public simulateTick(
    sensors: Sensor[], 
    valves: Valve[], 
    activeCultures: Culture[]
  ): { updatedSensors: Sensor[], newReadings: Record<string, SensorReading> } {
    
    const now = Date.now();
    const updatedSensors = [...sensors];
    const newReadings: Record<string, SensorReading> = {};

    // Check if any valve is active
    const isAnyValveActive = valves.some(v => v.status === 'active');

    // Hour of day (0-23)
    const hourOfDay = new Date().getHours();
    
    // Determine expected temp based on hour (very simplified diurnal curve)
    // Peak temp around 14:00, lowest around 4:00
    const baseTemp = 25; // ambient base
    const diurnalAmplitude = 8;
    const expectedTemp = baseTemp + diurnalAmplitude * Math.sin((hourOfDay - 8) * Math.PI / 12);

    updatedSensors.forEach((sensor, index) => {
      // 1. Temperature moves towards expected temp
      const tempDiff = expectedTemp - sensor.temp;
      let newTemp = sensor.temp + tempDiff * 0.1; // move 10% towards expected
      newTemp = this.fluctuate(newTemp, 0.02, 10, 45);

      // 2. Humidity decreases naturally (evaporation), but increases if irrigating
      let newHumidity = sensor.humidity;
      
      if (isAnyValveActive) {
        // If irrigating, humidity goes up fast
        newHumidity += (Math.random() * 2 + 1); // +1 to +3% per tick
      } else {
        // Natural drying out. Faster if hotter
        const dryingFactor = (newTemp / 20) * (Math.random() * 0.5 + 0.1); 
        newHumidity -= dryingFactor;
      }
      
      newHumidity = this.fluctuate(newHumidity, 0.01, 0, 100);

      // Round to 1 decimal place
      newTemp = Math.round(newTemp * 10) / 10;
      newHumidity = Math.round(newHumidity * 10) / 10;
      
      // Update status
      let newStatus = sensor.status;
      if (newHumidity < 40) newStatus = 'dry';
      else if (newHumidity > 80) newStatus = 'wet';
      else newStatus = 'ok';

      updatedSensors[index] = {
        ...sensor,
        temp: newTemp,
        humidity: Math.round(newHumidity), // keep humidity integer for UI simplicity
        status: newStatus
      };

      // Record history
      const reading: SensorReading = {
        timestamp: now,
        humidity: Math.round(newHumidity),
        temp: newTemp
      };

      if (!this.history[sensor.id]) {
        this.history[sensor.id] = [];
      }
      
      this.history[sensor.id].push(reading);
      
      // Keep only last 50 readings per sensor
      if (this.history[sensor.id].length > 50) {
        this.history[sensor.id].shift();
      }

      newReadings[sensor.id] = reading;
    });

    return { updatedSensors, newReadings };
  }
}

// Export a singleton instance
export const simulator = new SensorSimulator();
