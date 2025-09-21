'use client';

import { useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface UserDoc {
  id: string;
  data: Record<string, unknown>;
}

type DebugInfo = 
  | { type: 'all_users'; users: UserDoc[]; totalUsers: number }
  | { type: 'email_search'; searchEmail: string; users: UserDoc[]; found: boolean }
  | { type: 'error'; error: string };

export default function FirestoreDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const { user } = useAuth();

  const checkUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
      
      setDebugInfo({ 
        type: 'all_users', 
        users,
        totalUsers: users.length 
      });
    } catch (error) {
      setDebugInfo({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const testEmailQuery = async () => {
    if (!testEmail) return;
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', testEmail));
      const querySnapshot = await getDocs(q);
      
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
      
      setDebugInfo({ 
        type: 'email_search', 
        searchEmail: testEmail,
        users,
        found: users.length > 0 
      });
    } catch (error) {
      setDebugInfo({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  if (!user) {
    return <div className="text-gray-900">Please log in to use debug tools</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Firestore Debug Tools</h2>
      
      <div className="space-y-4">
        <button
          onClick={checkUsers}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 font-medium"
        >
          List All Users
        </button>
        
        <div className="flex gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter email to search"
            className="border border-gray-400 px-3 py-2 rounded flex-1 text-gray-900 placeholder-gray-600"
          />
          <button
            onClick={testEmailQuery}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-medium"
          >
            Test Email Query
          </button>
        </div>
      </div>
      
      {debugInfo && (
        <div className="mt-6 p-4 bg-gray-50 rounded border">
          <h3 className="font-bold mb-2 text-gray-900">Debug Results:</h3>
          <pre className="text-sm overflow-auto text-gray-800 bg-white p-3 rounded border">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}