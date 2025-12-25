import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ROLES } from './roles';

/**
 * Crée un nouvel utilisateur administrateur
 * @param {string} email - L'email de l'administrateur
 * @param {string} password - Le mot de passe de l'administrateur
 * @param {string} displayName - Le nom d'affichage de l'administrateur
 * @returns {Promise<Object>} Les informations de l'utilisateur créé
 */
export const createAdminUser = async (email, password, displayName) => {
  try {
    // Créer l'utilisateur dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // Créer le document utilisateur dans Firestore
    const userData = {
      email,
      displayName,
      role: ROLES.ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false,
      isAdmin: true
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    console.log('✅ Administrateur créé avec succès !');
    return { ...user, ...userData };
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error);
    throw error;
  }
};

/**
 * Vérifie si un administrateur existe déjà
 * @returns {Promise<boolean>} True si un administrateur existe déjà
 */
export const adminExists = async () => {
  try {
    // Implémentez cette fonction si nécessaire
    // par exemple en cherchant dans la collection 'users' un utilisateur avec isAdmin: true
    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification des administrateurs:', error);
    return false;
  }
};

/**
 * Fonction à appeler au démarrage de l'application pour s'assurer qu'il y a au moins un admin
 */
export const ensureAdminExists = async () => {
  try {
    const adminAlreadyExists = await adminExists();
    
    if (!adminAlreadyExists) {
      console.log('Aucun administrateur trouvé. Création d\'un administrateur par défaut...');
      
      // Remplacez ces valeurs par des identifiants sécurisés
      const defaultAdminEmail = 'admin@example.com';
      const defaultAdminPassword = 'VotreMotDePasseSecurise123!';
      
      await createAdminUser(
        defaultAdminEmail,
        defaultAdminPassword,
        'Administrateur Principal'
      );
      
      console.warn('⚠️ Un administrateur par défaut a été créé avec les identifiants suivants :');
      console.warn(`Email: ${defaultAdminEmail}`);
      console.warn('Mot de passe: [le mot de passe que vous avez défini]');
      console.warn('⚠️ VEUILLEZ CHANGER CES IDENTIFIANTS IMMÉDIATEMENT APRÈS LA PREMIÈRE CONNEXION !');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification/création de l\'administrateur:', error);
  }
};

// Exemple d'utilisation :
// Pour créer un nouvel administrateur manuellement :
// createAdminUser('admin@votredomaine.com', 'MotDePasseSecurise123!', 'Nom Admin');

// Pour s'assurer qu'il y a au moins un administrateur au démarrage :
// ensureAdminExists();
