import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createApiResponse, createErrorResponse, getDb } from '@/lib/api-helpers';
import { SyncRequest, SyncResponse } from '@/types/mobile-api';

// POST /api/mobile/sync
export async function POST(request: NextRequest) {
  try {
    const tokenResult = await verifyToken(request);
    
    if (tokenResult instanceof NextResponse) {
      return tokenResult;
    }

    const { uid } = tokenResult;
    const syncData: SyncRequest = await request.json();
    
    const db = getDb();
    if (!db) {
      return createErrorResponse('Database not available', 500);
    }
    
    const { lastSyncTime, changes } = syncData;
    const serverTime = Date.now();
    
    // Process client changes
    const batch = db.batch();
    const conflicts: any[] = [];
    
    for (const change of changes) {
      try {
        switch (change.type) {
          case 'create':
            if (change.entity === 'todo') {
              const todoRef = db.collection('todos').doc(change.id);
              batch.set(todoRef, {
                ...change.data,
                userId: uid,
                createdAt: serverTime,
                updatedAt: serverTime,
              });
            } else if (change.entity === 'alarm') {
              const alarmRef = db.collection('alarms').doc(change.id);
              batch.set(alarmRef, {
                ...change.data,
                userId: uid,
                createdAt: serverTime,
                updatedAt: serverTime,
              });
            }
            break;
            
          case 'update':
            if (change.entity === 'todo') {
              const todoRef = db.collection('todos').doc(change.id);
              const todoDoc = await todoRef.get();
              
              if (todoDoc.exists) {
                const serverData = todoDoc.data();
                if (serverData && serverData.updatedAt > change.timestamp) {
                  // Conflict detected
                  conflicts.push({
                    entity: 'todo',
                    id: change.id,
                    localData: change.data,
                    serverData: serverData,
                  });
                } else {
                  batch.update(todoRef, {
                    ...change.data,
                    updatedAt: serverTime,
                  });
                }
              }
            } else if (change.entity === 'alarm') {
              const alarmRef = db.collection('alarms').doc(change.id);
              const alarmDoc = await alarmRef.get();
              
              if (alarmDoc.exists) {
                const serverData = alarmDoc.data();
                if (serverData && serverData.updatedAt > change.timestamp) {
                  conflicts.push({
                    entity: 'alarm',
                    id: change.id,
                    localData: change.data,
                    serverData: serverData,
                  });
                } else {
                  batch.update(alarmRef, {
                    ...change.data,
                    updatedAt: serverTime,
                  });
                }
              }
            }
            break;
            
          case 'delete':
            if (change.entity === 'todo') {
              const todoRef = db.collection('todos').doc(change.id);
              batch.delete(todoRef);
            } else if (change.entity === 'alarm') {
              const alarmRef = db.collection('alarms').doc(change.id);
              batch.delete(alarmRef);
            }
            break;
        }
      } catch (error) {
        console.error(`Error processing ${change.type} for ${change.entity}:`, error);
      }
    }
    
    await batch.commit();
    
    // Get server changes since last sync
    const serverChanges: any[] = [];
    
    // Get updated todos
    const todosSnapshot = await db.collection('todos')
      .where('userId', '==', uid)
      .where('updatedAt', '>', lastSyncTime)
      .get();
    
    todosSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      serverChanges.push({
        type: 'update',
        entity: 'todo',
        id: doc.id,
        data: data,
        timestamp: data.updatedAt,
      });
    });
    
    // Get updated alarms
    const alarmsSnapshot = await db.collection('alarms')
      .where('userId', '==', uid)
      .where('updatedAt', '>', lastSyncTime)
      .get();
    
    alarmsSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      serverChanges.push({
        type: 'update',
        entity: 'alarm',
        id: doc.id,
        data: data,
        timestamp: data.updatedAt,
      });
    });
    
    const response = {
      success: true,
      data: {
        serverTime,
        changes: serverChanges,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      },
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Sync error:', error);
    return createErrorResponse('Failed to sync data', 500);
  }
}
