import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, Timestamp } from "firebase/firestore";
import type { IStorage } from "../storage";
import type { DocumentProcessingRequest, DocumentProcessingResponse, ProcessingStatus } from "@shared/schema";

const firebaseConfig = {
  apiKey: "AIzaSyBuDzg2L5SdR_VWZyPtw0Kw85Bw8Wjwdxw",
  authDomain: "hackrx-4d649.firebaseapp.com",
  projectId: "hackrx-4d649",
  storageBucket: "hackrx-4d649.firebasestorage.app",
  messagingSenderId: "451746858908",
  appId: "1:451746858908:web:a4142c23c30f32af5cea59",
  measurementId: "G-WD94WK5VFT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export class FirebaseStorage implements IStorage {
  private requestsCollection = "processing_requests";
  private resultsCollection = "processing_results";
  private statusCollection = "processing_status";

  async storeProcessingRequest(request: DocumentProcessingRequest): Promise<string> {
    const docRef = doc(collection(db, this.requestsCollection));
    const id = docRef.id;
    
    await setDoc(docRef, {
      ...request,
      id,
      createdAt: Timestamp.now()
    });
    
    // Initialize status
    await this.updateProcessingStatus(id, {
      status: 'idle',
      message: 'Request received',
      progress: 0
    });
    
    return id;
  }

  async getProcessingResult(id: string): Promise<DocumentProcessingResponse | undefined> {
    const docRef = doc(db, this.resultsCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        answers: data.answers,
        metadata: data.metadata
      };
    }
    
    return undefined;
  }

  async storeProcessingResult(id: string, result: DocumentProcessingResponse): Promise<void> {
    const docRef = doc(db, this.resultsCollection, id);
    await setDoc(docRef, {
      ...result,
      id,
      createdAt: Timestamp.now()
    });

    // Update status to completed
    await this.updateProcessingStatus(id, {
      status: 'completed',
      message: 'Processing completed successfully',
      progress: 100
    });
  }

  async updateProcessingStatus(id: string, status: ProcessingStatus): Promise<void> {
    const docRef = doc(db, this.statusCollection, id);
    await setDoc(docRef, {
      ...status,
      updatedAt: Timestamp.now()
    }, { merge: true });
  }

  async getProcessingStatus(id: string): Promise<ProcessingStatus | undefined> {
    const docRef = doc(db, this.statusCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        status: data.status,
        message: data.message,
        progress: data.progress
      };
    }
    
    return undefined;
  }
}