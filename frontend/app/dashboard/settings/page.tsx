"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Alert,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Settings,
  Security,
  Notifications,
  Person,
  ShoppingCart,
  Favorite,
  History,
  Language,
  DarkMode,
  Delete,
  Edit,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '@utils/auth';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    bio: string;
    avatar: string;
  };
  preferences: {
    language: string;
    currency: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
    emailMarketing: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showPhone: boolean;
    allowDirectMessages: boolean;
    dataSharing: boolean;
    analyticsTracking: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    orderUpdates: boolean;
    priceAlerts: boolean;
    newProducts: boolean;
    promotions: boolean;
    securityAlerts: boolean;
    socialUpdates: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    loginAlerts: boolean;
    deviceManagement: boolean;
    sessionTimeout: number;
  };
  addresses: Array<{
    id: string;
    type: 'home' | 'work' | 'other';
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  }>;
}

export default function UserSettingsPage() {
  const { user, token, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      bio: '',
      avatar: ''
    },
    preferences: {
      language: 'en',
      currency: 'RWF',
      timezone: 'UTC',
      theme: 'auto',
      emailMarketing: false,
      smsNotifications: false,
      pushNotifications: true
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      allowDirectMessages: true,
      dataSharing: true,
      analyticsTracking: true
    },
    notifications: {
      emailNotifications: true,
      orderUpdates: true,
      priceAlerts: true,
      newProducts: false,
      promotions: true,
      securityAlerts: true,
      socialUpdates: false
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      deviceManagement: true,
      sessionTimeout: 30
    },
    addresses: []
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user, token]);

  const fetchSettings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data.settings }));
      } else {
        console.error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        setSuccess('Settings saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!token) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });

      if (response.ok) {
        setSuccess('Password changed successfully!');
        setShowPasswordDialog(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to change password');
      }
    } catch (err) {
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        logout();
        router.push('/');
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (err) {
      setError('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (section: keyof UserSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleLanguageChange = (language: string) => {
    updateSettings('preferences', 'language', language);
    i18n.changeLanguage(language);
  };

  const tabs = [
    { label: 'Profile', icon: <Person /> },
    { label: 'Preferences', icon: <Settings /> },
    { label: 'Privacy', icon: <Security /> },
    { label: 'Notifications', icon: <Notifications /> },
    { label: 'Security', icon: <Security /> },
    { label: 'Addresses', icon: <ShoppingCart /> }
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          fontWeight={800} 
          gutterBottom
          sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
        >
          Account Settings
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          Manage your account settings and preferences
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Sidebar Tabs */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: { xs: 1, sm: 2 } }}>
            <Tabs
              orientation={{ xs: 'horizontal', md: 'vertical' }}
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ 
                borderRight: { xs: 0, md: 1 }, 
                borderBottom: { xs: 1, md: 0 },
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minHeight: { xs: 40, sm: 48 }
                }
              }}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                  sx={{ 
                    justifyContent: 'flex-start', 
                    minHeight: { xs: 40, sm: 48 },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                />
              ))}
            </Tabs>
          </Paper>
        </Grid>

        {/* Settings Content */}
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Profile Settings */}
              {activeTab === 0 && (
                <Box>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    gutterBottom
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                  >
                    Personal Information
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    paragraph
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Update your personal information and profile details
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 3, 
                        mb: 2,
                        flexDirection: { xs: 'column', sm: 'row' },
                        textAlign: { xs: 'center', sm: 'left' }
                      }}
                    >
                      <Avatar
                        src={settings.profile.avatar}
                        sx={{ 
                          width: { xs: 60, sm: 80 }, 
                          height: { xs: 60, sm: 80 } 
                        }}
                      />
                      <Box>
                        <Button 
                          variant="outlined" 
                          startIcon={<Edit />}
                          size="small"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          Change Avatar
                        </Button>
                        <Typography 
                          variant="caption" 
                          display="block" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                        >
                          JPG, PNG or GIF. Max size 2MB.
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="First Name"
                          value={settings.profile.firstName}
                          onChange={(e) => updateSettings('profile', 'firstName', e.target.value)}
                          fullWidth
                          required
                          size="small"
                          sx={{ 
                            '& .MuiInputLabel-root': { fontSize: { xs: '0.75rem', sm: '0.875rem' } },
                            '& .MuiInputBase-input': { fontSize: { xs: '0.875rem', sm: '1rem' } }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Last Name"
                          value={settings.profile.lastName}
                          onChange={(e) => updateSettings('profile', 'lastName', e.target.value)}
                          fullWidth
                          required
                          size="small"
                          sx={{ 
                            '& .MuiInputLabel-root': { fontSize: { xs: '0.75rem', sm: '0.875rem' } },
                            '& .MuiInputBase-input': { fontSize: { xs: '0.875rem', sm: '1rem' } }
                          }}
                        />
                      </Grid>
                    </Grid>

                    <TextField
                      label="Email"
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => updateSettings('profile', 'email', e.target.value)}
                      fullWidth
                      required
                    />

                    <TextField
                      label="Phone Number"
                      value={settings.profile.phone}
                      onChange={(e) => updateSettings('profile', 'phone', e.target.value)}
                      fullWidth
                    />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Date of Birth"
                          type="date"
                          value={settings.profile.dateOfBirth}
                          onChange={(e) => updateSettings('profile', 'dateOfBirth', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Gender</InputLabel>
                          <Select
                            value={settings.profile.gender}
                            onChange={(e) => updateSettings('profile', 'gender', e.target.value)}
                            label="Gender"
                          >
                            <MenuItem value="male">Male</MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                            <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <TextField
                      label="Bio"
                      value={settings.profile.bio}
                      onChange={(e) => updateSettings('profile', 'bio', e.target.value)}
                      multiline
                      rows={3}
                      fullWidth
                      helperText="Tell us about yourself"
                    />
                  </Box>
                </Box>
              )}

              {/* Preferences Settings */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Preferences
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Customize your experience and preferences
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={settings.preferences.language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        label="Language"
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                        <MenuItem value="de">German</MenuItem>
                        <MenuItem value="it">Italian</MenuItem>
                        <MenuItem value="pt">Portuguese</MenuItem>
                        <MenuItem value="ru">Russian</MenuItem>
                        <MenuItem value="ja">Japanese</MenuItem>
                        <MenuItem value="ko">Korean</MenuItem>
                        <MenuItem value="zh">Chinese</MenuItem>
                      </Select>
                    </FormControl>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <FormControl fullWidth>
                          <InputLabel>Currency</InputLabel>
                          <Select
                            value={settings.preferences.currency}
                            onChange={(e) => updateSettings('preferences', 'currency', e.target.value)}
                            label="Currency"
                          >
                            <MenuItem value="RWF">RWF (Rwandan Franc)</MenuItem>
                            <MenuItem value="USD">USD</MenuItem>
                            <MenuItem value="EUR">EUR</MenuItem>
                            <MenuItem value="GBP">GBP</MenuItem>
                            <MenuItem value="CAD">CAD</MenuItem>
                            <MenuItem value="AUD">AUD</MenuItem>
                            <MenuItem value="JPY">JPY</MenuItem>
                            <MenuItem value="NGN">NGN (Nigerian Naira)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6}>
                        <FormControl fullWidth>
                          <InputLabel>Timezone</InputLabel>
                          <Select
                            value={settings.preferences.timezone}
                            onChange={(e) => updateSettings('preferences', 'timezone', e.target.value)}
                            label="Timezone"
                          >
                            <MenuItem value="UTC">UTC</MenuItem>
                            <MenuItem value="America/New_York">Eastern Time</MenuItem>
                            <MenuItem value="America/Chicago">Central Time</MenuItem>
                            <MenuItem value="America/Denver">Mountain Time</MenuItem>
                            <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                            <MenuItem value="Europe/London">London</MenuItem>
                            <MenuItem value="Europe/Paris">Paris</MenuItem>
                            <MenuItem value="Asia/Tokyo">Tokyo</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        value={settings.preferences.theme}
                        onChange={(e) => updateSettings('preferences', 'theme', e.target.value)}
                        label="Theme"
                      >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="auto">Auto</MenuItem>
                      </Select>
                    </FormControl>

                    <Divider />

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.preferences.emailMarketing}
                            onChange={(e) => updateSettings('preferences', 'emailMarketing', e.target.checked)}
                          />
                        }
                        label="Email Marketing"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Receive promotional emails and offers
                      </Typography>
                    </FormGroup>

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.preferences.smsNotifications}
                            onChange={(e) => updateSettings('preferences', 'smsNotifications', e.target.checked)}
                          />
                        }
                        label="SMS Notifications"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Receive notifications via SMS
                      </Typography>
                    </FormGroup>

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.preferences.pushNotifications}
                            onChange={(e) => updateSettings('preferences', 'pushNotifications', e.target.checked)}
                          />
                        }
                        label="Push Notifications"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Receive push notifications in your browser
                      </Typography>
                    </FormGroup>
                  </Box>
                </Box>
              )}

              {/* Privacy Settings */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Privacy Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Control your privacy and data sharing preferences
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Profile Visibility</InputLabel>
                      <Select
                        value={settings.privacy.profileVisibility}
                        onChange={(e) => updateSettings('privacy', 'profileVisibility', e.target.value)}
                        label="Profile Visibility"
                      >
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                        <MenuItem value="friends">Friends Only</MenuItem>
                      </Select>
                    </FormControl>

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.privacy.showEmail}
                            onChange={(e) => updateSettings('privacy', 'showEmail', e.target.checked)}
                          />
                        }
                        label="Show Email Address"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Allow others to see your email address
                      </Typography>
                    </FormGroup>

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.privacy.showPhone}
                            onChange={(e) => updateSettings('privacy', 'showPhone', e.target.checked)}
                          />
                        }
                        label="Show Phone Number"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Allow others to see your phone number
                      </Typography>
                    </FormGroup>

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.privacy.allowDirectMessages}
                            onChange={(e) => updateSettings('privacy', 'allowDirectMessages', e.target.checked)}
                          />
                        }
                        label="Allow Direct Messages"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Allow other users to send you direct messages
                      </Typography>
                    </FormGroup>

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.privacy.dataSharing}
                            onChange={(e) => updateSettings('privacy', 'dataSharing', e.target.checked)}
                          />
                        }
                        label="Data Sharing"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Allow platform to use your data for improvements
                      </Typography>
                    </FormGroup>

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.privacy.analyticsTracking}
                            onChange={(e) => updateSettings('privacy', 'analyticsTracking', e.target.checked)}
                          />
                        }
                        label="Analytics Tracking"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Allow tracking for analytics and personalization
                      </Typography>
                    </FormGroup>
                  </Box>
                </Box>
              )}

              {/* Notification Settings */}
              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Notification Preferences
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Choose which notifications you want to receive
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Email Notifications"
                        secondary="Receive notifications via email"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.notifications.emailNotifications}
                          onChange={(e) => updateSettings('notifications', 'emailNotifications', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="Order Updates"
                        secondary="Get notified about order status changes"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.notifications.orderUpdates}
                          onChange={(e) => updateSettings('notifications', 'orderUpdates', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="Price Alerts"
                        secondary="Get notified when prices drop on your wishlist items"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.notifications.priceAlerts}
                          onChange={(e) => updateSettings('notifications', 'priceAlerts', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="New Products"
                        secondary="Get notified about new products in your categories"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.notifications.newProducts}
                          onChange={(e) => updateSettings('notifications', 'newProducts', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="Promotions"
                        secondary="Get notified about special offers and promotions"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.notifications.promotions}
                          onChange={(e) => updateSettings('notifications', 'promotions', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="Security Alerts"
                        secondary="Get notified about security-related activities"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.notifications.securityAlerts}
                          onChange={(e) => updateSettings('notifications', 'securityAlerts', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>

                    <ListItem>
                      <ListItemText
                        primary="Social Updates"
                        secondary="Get notified about social activities and interactions"
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={settings.notifications.socialUpdates}
                          onChange={(e) => updateSettings('notifications', 'socialUpdates', e.target.checked)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Box>
              )}

              {/* Security Settings */}
              {activeTab === 4 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Security Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Manage your account security and authentication
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Change Password
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Update your password to keep your account secure
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => setShowPasswordDialog(true)}
                        startIcon={<Security />}
                      >
                        Change Password
                      </Button>
                    </Box>

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.security.twoFactorAuth}
                            onChange={(e) => updateSettings('security', 'twoFactorAuth', e.target.checked)}
                          />
                        }
                        label="Two-Factor Authentication"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Add an extra layer of security to your account
                      </Typography>
                    </FormGroup>

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.security.loginAlerts}
                            onChange={(e) => updateSettings('security', 'loginAlerts', e.target.checked)}
                          />
                        }
                        label="Login Alerts"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Get notified when someone logs into your account
                      </Typography>
                    </FormGroup>

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.security.deviceManagement}
                            onChange={(e) => updateSettings('security', 'deviceManagement', e.target.checked)}
                          />
                        }
                        label="Device Management"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Manage and monitor devices that can access your account
                      </Typography>
                    </FormGroup>

                    <TextField
                      label="Session Timeout (minutes)"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                      InputProps={{ inputProps: { min: 5, max: 480 } }}
                      fullWidth
                      helperText="Automatically log out after this period of inactivity"
                    />

                    <Divider />

                    <Box sx={{ p: 2, border: 1, borderColor: 'error.main', borderRadius: 1, bgcolor: 'error.light' }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom color="error">
                        Danger Zone
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Once you delete your account, there is no going back. Please be certain.
                      </Typography>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => setShowDeleteDialog(true)}
                        startIcon={<Delete />}
                      >
                        Delete Account
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Addresses Settings */}
              {activeTab === 5 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Addresses
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Manage your shipping and billing addresses
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {settings.addresses.length === 0 ? (
                      <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                          No addresses saved
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Add your first address to get started
                        </Typography>
                        <Button variant="contained" startIcon={<Edit />}>
                          Add Address
                        </Button>
                      </Paper>
                    ) : (
                      settings.addresses.map((address) => (
                        <Card key={address.id} sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {address.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {address.address}, {address.city}, {address.state} {address.zipCode}
                              </Typography>
                              <Chip
                                label={address.type}
                                size="small"
                                color={address.isDefault ? 'primary' : 'default'}
                                sx={{ mt: 1 }}
                              />
                            </Box>
                            <Box>
                              <IconButton size="small">
                                <Edit />
                              </IconButton>
                              <IconButton size="small" color="error">
                                <Delete />
                              </IconButton>
                            </Box>
                          </Box>
                        </Card>
                      ))
                    )}
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' }
                }}
              >
                <Button 
                  variant="outlined" 
                  onClick={() => window.location.reload()}
                  fullWidth={{ xs: true, sm: false }}
                  size="small"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Reset Changes
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading}
                  fullWidth={{ xs: true, sm: false }}
                  size="small"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordChange} variant="contained" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to delete your account? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All your data, orders, and preferences will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} variant="contained" color="error" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
