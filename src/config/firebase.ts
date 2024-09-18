import * as admin from 'firebase-admin';
import serviceAccount from './secret-key-firebase.json';
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

export default admin;
