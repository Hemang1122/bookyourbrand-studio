import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { PROJECT_TASK_TEMPLATES, calculateDueDate } from '@/lib/project-task-templates';

// Initialize Firebase Admin safely
function initAdmin() {
  if (admin.apps.length > 0) return admin.firestore();
  
  try {
    const serviceAccountPath = path.join(process.cwd(), 'service-accounts.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp();
    }
  } catch (err) {
    console.error('Admin Init Error:', err);
  }
  return admin.firestore();
}

export async function POST(request: NextRequest) {
  try {
    const db = initAdmin();
    const body = await request.json();
    
    const {
      projectData,
      assignedEditor // Full user object for assignment
    } = body;

    if (!projectData || !projectData.client || !projectData.client.id) {
      return NextResponse.json({ success: false, error: 'Missing project or client data' }, { status: 400 });
    }

    console.log('API: Creating project with auto-tasks:', projectData.name);

    // 1. Create the project document
    const projectRef = db.collection('projects').doc();
    const projectId = projectRef.id;
    
    const finalProjectData = {
      ...projectData,
      id: projectId,
      coverImage: `project-${Math.ceil(Math.random() * 3)}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 2. Setup batch for atomic operations
    const batch = db.batch();
    
    // Set project
    batch.set(projectRef, finalProjectData);

    // 3. Update Client Quota & usage
    const clientRef = db.collection('clients').doc(projectData.client.id);
    batch.update(clientRef, {
      reelsCreated: admin.firestore.FieldValue.increment(1),
      'currentPackage.reelsUsed': admin.firestore.FieldValue.increment(1)
    });

    // 4. Create Tasks from Templates
    const startDate = new Date();
    let cumulativeDays = 0;

    PROJECT_TASK_TEMPLATES.forEach((template) => {
      const taskRef = db.collection('tasks').doc();
      
      cumulativeDays += template.estimatedDays || 1;
      const dueDate = calculateDueDate(startDate, cumulativeDays);

      batch.set(taskRef, {
        id: taskRef.id,
        projectId: projectId,
        title: template.title,
        description: template.description,
        assignedTo: assignedEditor || null,
        status: 'Pending',
        remarks: [],
        dueDate: dueDate,
        order: template.order,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // 5. Commit all changes
    await batch.commit();
    
    console.log(`API: Successfully created project ${projectId} with ${PROJECT_TASK_TEMPLATES.length} tasks.`);

    return NextResponse.json({
      success: true,
      projectId: projectId,
      tasksCreated: PROJECT_TASK_TEMPLATES.length
    });

  } catch (error: any) {
    console.error('API Error (create-with-tasks):', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
