"use client";
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Stack,
  Button,
  TextField,
  Avatar,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  IconButton,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  ShoppingBag as OrdersIcon,
  Favorite as WishlistIcon,
  LocationOn as AddressIcon,
  Payment as PaymentIcon,
  Camera as CameraIcon,
  Star as StarIcon,
  TrendingUp as StatsIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@utils/auth';
import { apiGet, apiPatch } from '@utils/api';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  avatar?: string;
  role?: string;
  createdAt: string;
  preferences?: {
    language: string;
    currency: string;
    timeZone: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
  };
  stats?: {
    totalOrders: number;
    totalSpent: number;
    loyaltyPoints: number;
  };
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, loading: authLoading, updateUser } = useAuth();
  const theme = useTheme();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load real user profile data from backend
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Get detailed profile data
        const profileData = await apiGet<UserProfile>(`/users/profile`);
        
        // Get user stats (orders, spending, etc.)
        let stats = {
          totalOrders: 0,
          totalSpent: 0,
          loyaltyPoints: 0
        };
        
        try {
          stats = await apiGet<typeof stats>('/users/stats');
        } catch (error) {
          console.log('Stats not available:', error);
        }

        // Set default preferences if not available
        const preferences = profileData.preferences || {
          language: 'en',
          currency: 'USD',
          timeZone: 'CAT',
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          marketingEmails: false,
        };

        setProfile({
          ...profileData,
          preferences,
          stats
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        setAlert({ 
          type: 'error', 
          message: t('profile.loadError') || 'Failed to load profile data'
        });
        // Fallback to user data from auth context
        if (user) {
          setProfile({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || '',
            avatar: user.avatar || '',
            createdAt: new Date().toISOString(),
            preferences: {
              language: 'en',
              currency: 'USD',
              timeZone: 'CAT',
              emailNotifications: true,
              smsNotifications: false,
              pushNotifications: true,
              marketingEmails: false,
            },
            stats: {
              totalOrders: 0,
              totalSpent: 0,
              loyaltyPoints: 0
            }
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, t]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      // Prepare data to update
      const updateData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        country: profile.country,
        city: profile.city,
        address: profile.address,
        zipCode: profile.zipCode,
        preferences: profile.preferences
      };

      // Update profile on backend
      const updatedProfile = await apiPatch<UserProfile>('/users/profile', updateData);
      
      // Handle avatar upload if file is selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api'}/users/avatar`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('excom_token')}`
            },
            body: formData
          });
          
          if (response.ok) {
            const avatarData = await response.json();
            updatedProfile.avatar = avatarData.avatar;
          }
        } catch (avatarError) {
          console.error('Avatar upload failed:', avatarError);
        }
      }

      // Update local state
      setProfile(updatedProfile);
      
      // Update auth context with new user data
      updateUser({
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        avatar: updatedProfile.avatar,
        phone: updatedProfile.phone
      });
      
      setEditing(false);
      setAvatarFile(null);
      setPreviewAvatar(null);
      
      setAlert({ 
        type: 'success', 
        message: t('profile.profileUpdated') || 'Profile updated successfully'
      });
      
      // Clear alert after 5 seconds
      setTimeout(() => setAlert(null), 5000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setAlert({ 
        type: 'error', 
        message: t('profile.updateError') || 'Failed to update profile'
      });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setAvatarFile(null);
    setPreviewAvatar(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const tabItems = [
    { id: 'personal', label: t('profile.personalInfo'), icon: <PersonIcon /> },
    { id: 'security', label: t('profile.security'), icon: <SecurityIcon /> },
    { id: 'notifications', label: t('profile.notifications'), icon: <NotificationsIcon /> },
    { id: 'orders', label: t('profile.orderHistory'), icon: <OrdersIcon /> },
  ];

  // Show loading while auth is loading or profile is loading
  if (authLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Please log in to view your profile.
        </Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load profile data
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Alert */}
      {alert && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 3,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.background.paper, 0.8)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.background.paper, 1)})`,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
          {/* Avatar */}
          <Box position="relative">
            <Avatar
              src={previewAvatar || profile.avatar || undefined}
              sx={{ 
                width: 120, 
                height: 120,
                fontSize: '2.5rem',
                background: 'linear-gradient(45deg, #2196F3, #21CBF3)'
              }}
            >
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </Avatar>
            {editing && (
              <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: -8,
                  right: -8,
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  boxShadow: 2
                }}
              >
                <CameraIcon fontSize="small" />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </IconButton>
            )}
          </Box>

          {/* Profile Info */}
          <Box flex={1}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {profile.firstName} {profile.lastName}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {profile.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('profile.memberSince')}: {formatDate(profile.createdAt)}
            </Typography>
            
            {/* Stats */}
            <Stack direction="row" spacing={3} mt={2}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {profile.stats?.totalOrders || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('profile.totalOrders')}
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  ${(profile.stats?.totalSpent || 0).toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('profile.totalSpent')}
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {profile.stats?.loyaltyPoints || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('profile.loyaltyPoints')}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Actions */}
          <Stack spacing={2}>
            {editing ? (
              <>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ borderRadius: 2 }}
                >
                  {t('profile.saveChanges')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                  sx={{ borderRadius: 2 }}
                >
                  {t('profile.cancel')}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditing(true)}
                sx={{ borderRadius: 2 }}
              >
                {t('profile.editProfile')}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Navigation Tabs */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 1, 
          mb: 3, 
          borderRadius: 2,
          background: alpha(theme.palette.background.paper, 0.8),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {tabItems.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'contained' : 'text'}
              startIcon={tab.icon}
              onClick={() => setActiveTab(tab.id)}
              sx={{ 
                borderRadius: 1.5,
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontWeight: activeTab === tab.id ? 600 : 400
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>
      </Paper>

      {/* Content */}
      {activeTab === 'personal' && (
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {t('profile.personalInfo')}
                </Typography>
                
                <Grid container spacing={3} mt={1}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('profile.firstName')}
                      value={profile.firstName}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('profile.lastName')}
                      value={profile.lastName}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('profile.email')}
                      value={profile.email}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      type="email"
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('profile.phone')}
                      value={profile.phone || ''}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('profile.dateOfBirth')}
                      value={profile.dateOfBirth || ''}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant={editing ? 'outlined' : 'filled'}>
                      <InputLabel>{t('profile.gender')}</InputLabel>
                      <Select
                        value={profile.gender || ''}
                        label={t('profile.gender')}
                        disabled={!editing}
                        onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      >
                        <MenuItem value="male">{t('profile.male')}</MenuItem>
                        <MenuItem value="female">{t('profile.female')}</MenuItem>
                        <MenuItem value="other">{t('profile.other')}</MenuItem>
                        <MenuItem value="prefer-not-to-say">{t('profile.preferNotToSay')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('profile.country')}
                      value={profile.country || ''}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('profile.city')}
                      value={profile.city || ''}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('profile.address')}
                      value={profile.address || ''}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      multiline
                      rows={2}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('profile.zipCode')}
                      value={profile.zipCode || ''}
                      disabled={!editing}
                      variant={editing ? 'outlined' : 'filled'}
                      onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Settings */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {t('profile.accountSettings')}
                </Typography>

                <Stack spacing={3} mt={2}>
                  <FormControl fullWidth>
                    <InputLabel>{t('profile.preferredLanguage')}</InputLabel>
                    <Select
                      value={profile.preferences.language}
                      label={t('profile.preferredLanguage')}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        preferences: { ...profile.preferences, language: e.target.value }
                      })}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="rw">Kinyarwanda</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>{t('profile.currency')}</InputLabel>
                    <Select
                      value={profile.preferences.currency}
                      label={t('profile.currency')}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        preferences: { ...profile.preferences, currency: e.target.value }
                      })}
                    >
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="RWF">RWF (₣)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>{t('profile.timeZone')}</InputLabel>
                    <Select
                      value={profile.preferences.timeZone}
                      label={t('profile.timeZone')}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        preferences: { ...profile.preferences, timeZone: e.target.value }
                      })}
                    >
                      <MenuItem value="CAT">CAT (GMT+2)</MenuItem>
                      <MenuItem value="UTC">UTC (GMT+0)</MenuItem>
                      <MenuItem value="EST">EST (GMT-5)</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => setDeleteDialog(true)}
                  sx={{ borderRadius: 2 }}
                >
                  {t('profile.deleteAccount')}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 'security' && (
        <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('profile.security')}
            </Typography>

            <Stack spacing={3} mt={2}>
              <Button
                variant="outlined"
                onClick={() => setPasswordDialog(true)}
                sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
              >
                {t('profile.changePassword')}
              </Button>

              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {t('profile.twoFactorAuth')}
                </Typography>
                <FormControlLabel
                  control={<Switch defaultChecked={false} />}
                  label={profile.preferences.emailNotifications ? t('profile.enabled') : t('profile.disabled')}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('profile.notifications')}
            </Typography>

            <Stack spacing={3} mt={2}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={profile.preferences.emailNotifications}
                    onChange={(e) => setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, emailNotifications: e.target.checked }
                    })}
                  />
                }
                label={t('profile.emailNotifications')}
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={profile.preferences.smsNotifications}
                    onChange={(e) => setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, smsNotifications: e.target.checked }
                    })}
                  />
                }
                label={t('profile.smsNotifications')}
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={profile.preferences.pushNotifications}
                    onChange={(e) => setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, pushNotifications: e.target.checked }
                    })}
                  />
                }
                label={t('profile.pushNotifications')}
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={profile.preferences.marketingEmails}
                    onChange={(e) => setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, marketingEmails: e.target.checked }
                    })}
                  />
                }
                label={t('profile.marketingEmails')}
              />
            </Stack>
          </CardContent>
        </Card>
      )}

      {activeTab === 'orders' && (
        <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('profile.orderHistory')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              View your complete order history in the dedicated Orders page.
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2, borderRadius: 2 }}
              href="/orders"
            >
              View All Orders
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('profile.changePassword')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label={t('profile.currentPassword')}
              type="password"
              variant="outlined"
            />
            <TextField
              fullWidth
              label={t('profile.newPassword')}
              type="password"
              variant="outlined"
            />
            <TextField
              fullWidth
              label={t('profile.confirmNewPassword')}
              type="password"
              variant="outlined"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)} sx={{ borderRadius: 2 }}>
            {t('profile.cancel')}
          </Button>
          <Button 
            variant="contained" 
            sx={{ borderRadius: 2 }}
            onClick={() => {
              setPasswordDialog(false);
              setAlert({ type: 'success', message: t('profile.passwordChanged') });
              setTimeout(() => setAlert(null), 5000);
            }}
          >
            {t('profile.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle color="error.main">{t('profile.deleteAccount')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('profile.deleteAccountWarning')}
          </Alert>
          <Typography>
            {t('profile.confirmDelete')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} sx={{ borderRadius: 2 }}>
            {t('profile.cancel')}
          </Button>
          <Button 
            color="error" 
            variant="contained" 
            sx={{ borderRadius: 2 }}
            onClick={() => {
              setDeleteDialog(false);
              setAlert({ type: 'success', message: t('profile.accountDeleted') });
              setTimeout(() => setAlert(null), 5000);
            }}
          >
            {t('profile.deleteAccount')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}