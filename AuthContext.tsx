import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where, getDocs, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User as FirebaseUser, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

type UserRole = 'superadmin' | 'admin' | 'viewer';

type User = {
  uid: string;
  email: string;
  username: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithUsername: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_ADMIN_EMAILS = ["jkljean21@gmail.com", "ishimwe.jeanluc48@gmail.com"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user is the default superadmin (Google/Email Auth)
        if (firebaseUser.email && DEFAULT_ADMIN_EMAILS.includes(firebaseUser.email)) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email,
            role: 'superadmin'
          });
          setLoading(false);
          return;
        }

        // Check if it's a custom admin (Anonymous Auth)
        try {
          const adminsRef = collection(db, 'admins');
          const q = query(adminsRef, where('uid', '==', firebaseUser.uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const adminData = querySnapshot.docs[0].data();
            setUser({
              uid: firebaseUser.uid,
              email: adminData.email || '',
              username: adminData.username,
              role: adminData.role as UserRole
            });
          } else {
            // If anonymous but no admin doc, check if we have a stored username to link
            const storedUsername = localStorage.getItem('pending_admin_username');
            if (storedUsername) {
              const q2 = query(adminsRef, where('username', '==', storedUsername.toLowerCase()));
              const snap2 = await getDocs(q2);
              if (!snap2.empty) {
                const adminDoc = snap2.docs[0];
                await updateDoc(doc(db, 'admins', adminDoc.id), { uid: firebaseUser.uid });
                const adminData = adminDoc.data();
                setUser({
                  uid: firebaseUser.uid,
                  email: adminData.email || '',
                  username: adminData.username,
                  role: adminData.role as UserRole
                });
                localStorage.removeItem('pending_admin_username');
              }
            }
          }
        } catch (error: any) {
          console.error("Error checking custom admin:", error);
        }
      } else {
        // Check if we were logged in via username but lost auth session
        const storedUsername = localStorage.getItem('admin_username');
        if (storedUsername && !user) {
          // We'll try to re-login anonymously in loginWithUsername or just wait for user to re-auth
        }
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Firebase Authentication. Please add this URL to your Firebase Console "Authorized domains" list.');
      }
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('This authentication method is not enabled in your Firebase Console. Please enable "Google" and "Anonymous" providers in the Authentication > Sign-in method tab.');
      }
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Email login error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password authentication is not enabled in your Firebase Console.');
      }
      throw error;
    }
  };

  const loginWithUsername = async (username: string, password: string) => {
    const cleanUsername = username.toLowerCase().trim();
    const cleanPassword = password.trim();
    
    try {
      // Sign in anonymously first to get a UID and be "authenticated" for Firestore rules
      let cred;
      try {
        cred = await signInAnonymously(auth);
      } catch (anonError: any) {
        if (anonError.code === 'auth/operation-not-allowed') {
          throw new Error('Anonymous authentication is not enabled in your Firebase Console. This is required for username-based login.');
        }
        throw anonError;
      }
      const uid = cred.user.uid;

      const adminsRef = collection(db, 'admins');
      const q = query(adminsRef, where('username', '==', cleanUsername));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Find the doc with matching password
        const adminDoc = querySnapshot.docs.find(doc => doc.data().password === cleanPassword);
        
        if (adminDoc) {
          const adminData = adminDoc.data();
          const oldId = adminDoc.id;
          
          // Migrate document to use UID as ID if it's not already
          // This allows rules to use exists(/admins/uid)
          if (oldId !== uid) {
            try {
              await setDoc(doc(db, 'admins', uid), {
                ...adminData,
                uid: uid
              });
              // Only delete if it was a different ID (like the username or random ID)
              await deleteDoc(doc(db, 'admins', oldId));
            } catch (migrateError) {
              console.warn("Migration failed (likely permission), continuing with session:", migrateError);
              // If migration fails, we still set the user state so they can use the app
              // but some rules might fail if they rely on the UID-as-ID
            }
          } else {
            await updateDoc(doc(db, 'admins', uid), { uid: uid });
          }
          
          setUser({
            uid: uid,
            email: adminData.email || '',
            username: adminData.username,
            role: adminData.role as UserRole
          });
          
          localStorage.setItem('admin_username', cleanUsername);
        } else {
          throw new Error('Invalid password');
        }
      } else {
        throw new Error('Invalid username');
      }
    } catch (error) {
      console.error("Username login error:", error);
      try { await signOut(auth); } catch (e) {} // Clean up anonymous session on failure
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('admin_username');
      localStorage.removeItem('pending_admin_username');
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithEmail, loginWithUsername, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
