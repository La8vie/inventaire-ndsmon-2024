import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES, hasRole, hasAnyRole } from '../utils/roles';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const subscriptionPlans = [
  { id: 'free', name: 'Gratuit', features: ['Accès de base'] },
  { id: 'premium', name: 'Premium', features: ['Toutes les fonctionnalités', 'Support prioritaire'] },
  { id: 'enterprise', name: 'Entreprise', features: ['Fonctionnalités avancées', 'Support 24/7'] }
];

const Admin = () => {
  const { user, updateUserData } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUsers(usersList);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!hasRole(user, ROLES.ADMIN)) return;
    
    try {
      await updateUserData(userId, { role: newRole });
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rôle:", error);
    }
  };

  const handleSubscriptionChange = async (userId, field, value) => {
    try {
      await updateUserData(userId, { 
        subscription: {
          ...(users.find(u => u.id === userId)?.subscription || {}),
          [field]: value,
          updatedAt: new Date()
        }
      });
      
      setUsers(users.map(u => 
        u.id === userId ? { 
          ...u, 
          subscription: { 
            ...(u.subscription || {}), 
            [field]: value 
          } 
        } : u
      ));
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'abonnement:", error);
    }
  };

  const renderRoleBadge = (role) => {
    const roleConfig = {
      [ROLES.SUPER_ADMIN]: { label: 'Super Admin', color: 'error' },
      [ROLES.ADMIN]: { label: 'Admin', color: 'warning' },
      [ROLES.MODERATOR]: { label: 'Modérateur', color: 'info' },
      [ROLES.USER]: { label: 'Utilisateur', color: 'success' }
    };

    const config = roleConfig[role] || { label: 'Inconnu', color: 'default' };
    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        size="small"
        icon={role === ROLES.ADMIN ? <AdminIcon /> : <UserIcon />}
      />
    );
  };

  const canEditUser = (targetUser) => {
    if (!user || !targetUser) return false;
    if (targetUser.role === ROLES.SUPER_ADMIN) return false;
    if (user.role === ROLES.SUPER_ADMIN) return true;
    if (user.role === ROLES.ADMIN && targetUser.role !== ROLES.ADMIN) return true;
    return false;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Gestion des utilisateurs
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Abonnement</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.displayName || 'Non défini'}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  {hasRole(user, ROLES.ADMIN) ? (
                    <Select
                      value={u.role || ROLES.USER}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={!canEditUser(u)}
                      size="small"
                      sx={{ minWidth: 150 }}
                    >
                      <MenuItem value={ROLES.USER}>Utilisateur</MenuItem>
                      <MenuItem value={ROLES.MODERATOR}>Modérateur</MenuItem>
                      {hasRole(user, ROLES.SUPER_ADMIN) && (
                        <MenuItem value={ROLES.ADMIN}>Administrateur</MenuItem>
                      )}
                    </Select>
                  ) : (
                    renderRoleBadge(u.role || ROLES.USER)
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={u.subscription?.plan || 'free'}
                    onChange={(e) => handleSubscriptionChange(u.id, 'plan', e.target.value)}
                    disabled={!canEditUser(u)}
                    size="small"
                    sx={{ minWidth: 150 }}
                  >
                    <MenuItem value="free">Gratuit</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                    <MenuItem value="enterprise">Entreprise</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Tooltip title="Modifier">
                    <IconButton 
                      onClick={() => {
                        setEditingUser(u);
                        setOpenEditDialog(true);
                      }}
                      disabled={!canEditUser(u)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {editingUser && (
          <>
            <DialogTitle>
              Modifier l'utilisateur: {editingUser.displayName || editingUser.email}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Rôle</InputLabel>
                  <Select
                    value={editingUser.role || ROLES.USER}
                    label="Rôle"
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      role: e.target.value
                    })}
                  >
                    <MenuItem value={ROLES.USER}>Utilisateur</MenuItem>
                    <MenuItem value={ROLES.MODERATOR}>Modérateur</MenuItem>
                    {hasRole(user, ROLES.SUPER_ADMIN) && (
                      <MenuItem value={ROLES.ADMIN}>Administrateur</MenuItem>
                    )}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Abonnement</InputLabel>
                  <Select
                    value={editingUser.subscription?.plan || 'free'}
                    label="Abonnement"
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      subscription: {
                        ...(editingUser.subscription || {}),
                        plan: e.target.value
                      }
                    })}
                  >
                    <MenuItem value="free">Gratuit</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                    <MenuItem value="enterprise">Entreprise</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEditDialog(false)}>Annuler</Button>
              <Button 
                onClick={async () => {
                  try {
                    await updateUserData(editingUser.id, {
                      role: editingUser.role,
                      subscription: editingUser.subscription,
                      updatedAt: new Date()
                    });
                    setUsers(users.map(u => 
                      u.id === editingUser.id ? editingUser : u
                    ));
                    setOpenEditDialog(false);
                  } catch (error) {
                    console.error("Erreur lors de la mise à jour:", error);
                  }
                }}
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
              >
                Enregistrer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default Admin;
