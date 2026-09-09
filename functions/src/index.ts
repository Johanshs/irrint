import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const generateCustomToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const uid = context.auth.uid;

  try {
    const customToken = await admin.auth().createCustomToken(uid);
    return { token: customToken };
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw new functions.https.HttpsError('internal', 'Unable to create custom token.');
  }
});

export const processAI = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const uid = context.auth.uid;
  const db = admin.firestore();
  
  try {
    const userStateRef = db.collection('users').doc(uid);
    const doc = await userStateRef.get();
    
    if (!doc.exists) {
      return { status: 'ignored', message: 'No state found' };
    }
    
    const state = doc.data()?.state;
    if (!state || !state.sensors || state.sensors.length === 0) {
      return { status: 'ignored', message: 'No sensors to process' };
    }

    // A simple mock of AI simulation on the backend
    const updatedSensors = state.sensors.map((sensor: any) => {
      // simulate small fluctuation
      const humChange = (Math.random() * 2 - 1);
      const tempChange = (Math.random() * 1 - 0.5);
      return {
        ...sensor,
        humidity: Math.max(0, Math.min(100, sensor.humidity + humChange)),
        temp: sensor.temp + tempChange
      };
    });

    await userStateRef.update({
      'state.sensors': updatedSensors
    });

    return { status: 'success', sensorsUpdated: updatedSensors.length };
  } catch (error) {
    console.error('Error in processAI:', error);
    throw new functions.https.HttpsError('internal', 'Error processing AI logic.');
  }
});
