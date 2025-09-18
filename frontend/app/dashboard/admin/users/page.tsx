"use client";
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import {
  Edit,
  Delete,
  Person,
  Store,
  AdminPanelSettings,
  Block,
  CheckCircle
} from '@mui/icons-material';
import { apiGet, apiPatch, apiDelete } from '@utils/api';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  createdAt: string;
  isActive?: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('excom_token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }
      
      const data = await apiGet<User[]>('/admin/users');
      setUsers(data);
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = (action: string, user: User) => {
    setSelectedUser(user);
    
    switch (action) {
      case 'edit':
        setEditDialog(true);
        break;
      case 'delete':
        handleDeleteUser(user._id);
        break;
      case 'toggle_status':
        handleToggleUserStatus(user._id, !user.isActive);
        break;
    }
  };

  const handleBulkAction = (action: string, selectedUsers: User[]) => {
    console.log('Bulk action:', action, 'on users:', selectedUsers);
    // Implement bulk actions here
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      await apiPatch(`/admin/users/${selectedUser._id}`, {
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role
      });
      
      setUsers(prev => prev.map(u => u._id === selectedUser._id ? selectedUser : u));
      setEditDialog(false);
      setSelectedUser(null);
    } catch (error) {
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await apiDelete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
      setError('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await apiPatch(`/admin/users/${userId}/status`, { isActive });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive } : u));
    } catch (error) {
      setError('Failed to update user status');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'seller': return 'warning';
      case 'buyer': return 'primary';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings />;
      case 'seller': return <Store />;
      case 'buyer': return <Person />;
      default: return <Person />;
    }
  };

  const columns: Column[] = [
    {
      id: 'name',
      label: 'User',
      format: (value, user: User) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'role',
      label: 'Role',
      format: (value: string) => (
        <Chip
          size="small"
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          color={getRoleColor(value) as any}
          icon={getRoleIcon(value)}
        />
      )
    },
    {
      id: 'createdAt',
      label: 'Joined',
      format: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      id: 'isActive',
      label: 'Status',
      format: (value: boolean) => (
        <Chip
          size="small"
          label={value !== false ? 'Active' : 'Inactive'}
          color={value !== false ? 'success' : 'error'}
          icon={value !== false ? <CheckCircle /> : <Block />}
        />
      )
    }
  ];

  const rowActions = [
    { label: 'Edit User', action: 'edit', icon: <Edit /> },
    { label: 'Toggle Status', action: 'toggle_status', icon: <CheckCircle /> },
    { label: 'Delete User', action: 'delete', icon: <Delete /> }
  ];

  const bulkActions = [
    { label: 'Delete Selected', action: 'delete_bulk', icon: <Delete /> },
    { label: 'Export Selected', action: 'export', icon: <Delete /> }
  ];

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage platform users, roles, and permissions
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <DataTable
          title={`Users (${users.length})`}
          columns={columns}
          rows={users}
          loading={loading}
          searchable
          selectable
          onRowAction={handleUserAction}
          onBulkAction={handleBulkAction}
          rowActions={rowActions}
          bulkActions={bulkActions}
          emptyMessage="No users found"
        />

        {/* Edit User Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {selectedUser && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Name"
                  fullWidth
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={selectedUser.role}
                    label="Role"
                    onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                  >
                    <MenuItem value="buyer">Buyer</MenuItem>
                    <MenuItem value="seller">Seller</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser} variant="contained">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}