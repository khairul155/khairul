
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";

export type AuthResult = {
  success: boolean;
  user?: User;
  error?: Error;
  message?: string;
};

// Create new user with email and password
export const createUser = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<AuthResult> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // Create user profile document
    await setDoc(doc(db, "profiles", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.email?.split('@')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      subscription_plan: 'free'
    });
    
    // Initialize user credits
    await setDoc(doc(db, "user_credits", user.uid), {
      user_id: user.uid,
      subscription_plan: 'free',
      daily_credits: 60,
      credits_used_today: 0,
      monthly_credits: 0,
      credits_used_this_month: 0,
      last_reset_date: new Date().toISOString().split('T')[0],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    
    return { success: true, user };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error as Error };
  }
};

// Sign in with email and password
export const signInUser = async (
  email: string, 
  password: string
): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Error signing in:', error);
    return { success: false, error: error as Error };
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<AuthResult> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user profile exists
    const userDocRef = doc(db, "profiles", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create user profile if it doesn't exist
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        subscription_plan: 'free'
      });
      
      // Initialize user credits
      await setDoc(doc(db, "user_credits", user.uid), {
        user_id: user.uid,
        subscription_plan: 'free',
        daily_credits: 60,
        credits_used_today: 0,
        monthly_credits: 0,
        credits_used_this_month: 0,
        last_reset_date: new Date().toISOString().split('T')[0],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    } else {
      // Update last login
      await updateDoc(userDocRef, {
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { success: false, error: error as Error };
  }
};

// Sign out user
export const signOutUser = async (): Promise<AuthResult> => {
  try {
    await signOut(auth);
    return { success: true, message: 'User signed out successfully' };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error: error as Error };
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
