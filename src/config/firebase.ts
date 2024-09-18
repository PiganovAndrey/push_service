import * as admin from 'firebase-admin';
import serviceAccount from './test-flame-ad0c6-firebase-adminsdk-4omfq-64de4b571f.json';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

export default admin;
