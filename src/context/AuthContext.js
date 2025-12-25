import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ROLES } from '../utils/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Récupérer les données utilisateur depuis Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...userDoc.data()
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // Créer un nouvel utilisateur dans Firestore s'il n'existe pas
          const newUser = {
            email: firebaseUser.email,
            role: ROLES.USER,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser({ uid: firebaseUser.uid, ...newUser });
          localStorage.setItem('user', JSON.stringify({ uid: firebaseUser.uid, ...newUser }));
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const login = async (userCredential) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          ...userDoc.data()
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const updateUserData = async (userId, data) => {
    try {
      await setDoc(doc(db, 'users', userId), 
        { ...data, updatedAt: new Date() },
        { merge: true }
      );
      
      if (user && user.uid === userId) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des données utilisateur:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      updateUserData 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
