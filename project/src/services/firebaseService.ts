import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { GeneratedAdContent } from './geminiService';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  createdAt: Date;
  instagramCredentials?: {
    username: string;
    encryptedPassword: string;
  };
  geminiApiKey?: string;
  metaCredentials?: {
    appId: string;
    encryptedAppSecret: string;
    encryptedAccessToken: string;
    businessAccountId: string;
    instagramAccountId?: string;
  };
}

export interface SavedAd {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  content: GeneratedAdContent;
  createdAt: Date;
  published: boolean;
  publishedAt?: Date;
}

class FirebaseService {
  // Authentication methods
  async signUp(email: string, password: string, username: string): Promise<UserProfile> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: username
      });

      // Create user document in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        username,
        displayName: username,
        createdAt: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // User profile methods
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? userDoc.data() as UserProfile : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async createUserProfile(userProfile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userProfile.uid), userProfile);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Instagram credentials methods
  async saveInstagramCredentials(uid: string, username: string, password: string): Promise<void> {
    try {
      // Simple encryption (in production, use proper encryption)
      const encryptedPassword = btoa(password);
      
      await updateDoc(doc(db, 'users', uid), {
        instagramCredentials: {
          username,
          encryptedPassword
        }
      });
    } catch (error) {
      console.error('Error saving Instagram credentials:', error);
      throw error;
    }
  }

  async getInstagramCredentials(uid: string): Promise<{ username: string; password: string } | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        if (userData.instagramCredentials) {
          return {
            username: userData.instagramCredentials.username,
            password: atob(userData.instagramCredentials.encryptedPassword)
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting Instagram credentials:', error);
      return null;
    }
  }

  // Gemini API key methods
  async saveGeminiApiKey(uid: string, apiKey: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        geminiApiKey: btoa(apiKey) // Simple encoding
      });
    } catch (error) {
      console.error('Error saving Gemini API key:', error);
      throw error;
    }
  }

  async getGeminiApiKey(uid: string): Promise<string | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        return userData.geminiApiKey ? atob(userData.geminiApiKey) : null;
      }
      return null;
    } catch (error) {
      console.error('Error getting Gemini API key:', error);
      return null;
    }
  }

  // Meta API credentials methods
  async saveMetaCredentials(uid: string, credentials: {
    appId: string;
    appSecret: string;
    accessToken: string;
    businessAccountId: string;
    instagramAccountId?: string;
  }): Promise<void> {
    try {
      // Simple encryption (in production, use proper encryption)
      const encryptedAppSecret = btoa(credentials.appSecret);
      const encryptedAccessToken = btoa(credentials.accessToken);
      
      await updateDoc(doc(db, 'users', uid), {
        metaCredentials: {
          appId: credentials.appId,
          encryptedAppSecret,
          encryptedAccessToken,
          businessAccountId: credentials.businessAccountId,
          instagramAccountId: credentials.instagramAccountId,
        }
      });
    } catch (error) {
      console.error('Error saving Meta credentials:', error);
      throw error;
    }
  }

  async getMetaCredentials(uid: string): Promise<{
    appId: string;
    appSecret: string;
    accessToken: string;
    businessAccountId: string;
    instagramAccountId?: string;
  } | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        if (userData.metaCredentials) {
          return {
            appId: userData.metaCredentials.appId,
            appSecret: atob(userData.metaCredentials.encryptedAppSecret),
            accessToken: atob(userData.metaCredentials.encryptedAccessToken),
            businessAccountId: userData.metaCredentials.businessAccountId,
            instagramAccountId: userData.metaCredentials.instagramAccountId,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting Meta credentials:', error);
      return null;
    }
  }

  // Ad management methods
  async saveAd(userId: string, title: string, prompt: string, content: GeneratedAdContent): Promise<string> {
    try {
      const adData: Omit<SavedAd, 'id'> = {
        userId,
        title,
        prompt,
        content,
        createdAt: new Date(),
        published: false
      };

      const docRef = await addDoc(collection(db, 'ads'), adData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving ad:', error);
      throw error;
    }
  }

  async getUserAds(userId: string): Promise<SavedAd[]> {
    try {
      const q = query(
        collection(db, 'ads'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SavedAd));
    } catch (error) {
      console.error('Error getting user ads:', error);
      return [];
    }
  }

  async updateAd(adId: string, updates: Partial<SavedAd>): Promise<void> {
    try {
      await updateDoc(doc(db, 'ads', adId), updates);
    } catch (error) {
      console.error('Error updating ad:', error);
      throw error;
    }
  }

  async deleteAd(adId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'ads', adId));
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw error;
    }
  }

  async markAdAsPublished(adId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'ads', adId), {
        published: true,
        publishedAt: new Date()
      });
    } catch (error) {
      console.error('Error marking ad as published:', error);
      throw error;
    }
  }

  // Media upload methods
  async uploadMedia(file: File, userId: string, adId: string): Promise<string> {
    try {
      const storageRef = ref(storage, `media/${userId}/${adId}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return auth.onAuthStateChanged(callback);
  }
}

export const firebaseService = new FirebaseService();