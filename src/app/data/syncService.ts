import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface SyncState {
  cultures: any[];
  valves: any[];
  sensors: any[];
  sensorHistory?: Record<string, any[]>;
}

/**
 * Assina atualizações em tempo real do estado do usuário.
 * Retorna a função de unsubscribe.
 */
export function subscribeToState(userId: string, callback: (data: SyncState) => void) {
  const stateRef = doc(db, 'users', userId);
  
  return onSnapshot(stateRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.state) {
        callback(data.state as SyncState);
      } else {
        // Initialize state inside user document
        const defaultState: SyncState = {
          cultures: [],
          valves: [],
          sensors: [],
          sensorHistory: {}
        };
        setDoc(stateRef, { state: defaultState }, { merge: true }).then(() => {
          callback(defaultState);
        });
      }
    } else {
      // Document doesn't exist, create it
      const defaultState: SyncState = {
        cultures: [],
        valves: [],
        sensors: [],
        sensorHistory: {}
      };
      setDoc(stateRef, { state: defaultState }).then(() => {
        callback(defaultState);
      });
    }
  }, (error) => {
    console.error("Error subscribing to state:", error);
  });
}

/**
 * Atualiza um campo específico no documento do Firestore sem sobrescrever o resto.
 * Utiliza dot-notation, ex: updateField('user123', 'state.valves', novasValvulas)
 */
export async function updateField(userId: string, path: string, value: any) {
  try {
    const stateRef = doc(db, 'users', userId);
    await updateDoc(stateRef, {
      [path]: value
    });
  } catch (error) {
    console.error(`Error updating field ${path}:`, error);
  }
}
