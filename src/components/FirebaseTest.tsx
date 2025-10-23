// Firebase Test Component
import { useEffect, useState } from 'react';
import { auth, database } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

const FirebaseTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!auth || !database) {
      setStatus('❌ Firebase not initialized');
      return;
    }

    // Test authentication
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setStatus('✅ Authentication working');
      } else {
        setStatus('⚠️ No user signed in');
      }
    });

    // Test database
    if (database) {
      const testRef = ref(database, 'test/connection');
      set(testRef, { timestamp: Date.now() })
        .then(() => {
          setStatus(prev => prev + ' | ✅ Database working');
        })
        .catch((error) => {
          setStatus(prev => prev + ` | ❌ Database error: ${error.message}`);
        });
    }

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Firebase Status</h3>
      <p className="text-sm">{status}</p>
      {user && (
        <div className="mt-2 text-sm">
          <p>User: {user.email}</p>
          <p>UID: {user.uid}</p>
        </div>
      )}
    </div>
  );
};

export default FirebaseTest;
