"use client";
import React, { useState } from 'react';
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
  Chip
} from '@mui/material';
import {
  Settings,
  Security,
  Notifications,
  Payment,
  Store,
  Mail,
  Shield,
  Cloud,
  Code
} from '@mui/icons-material';
import AdminLayout from '@/components/admin/AdminLayout';

interface PlatformSettings {
  general: {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    maintenanceMode: boolean;
    allowRegistrations: boolean;
  };
  payments: {
    stripeEnabled: boolean;
    paypalEnabled: boolean;
    commissionRate: number;
    minimumPayout: number;
  };
  notifications: {
    emailNotifications: boolean;
    orderNotifications: boolean;
    storeApprovalNotifications: boolean;
    systemAlerts: boolean;
  };
  security: {
    requireEmailVerification: boolean;
    twoFactorAuth: boolean;
    maxLoginAttempts: number;
    sessionTimeout: number;
  };
  features: {
    aiRecommendations: boolean;
    multiVendor: boolean;
    guestCheckout: boolean;
    productReviews: boolean;
    wishlist: boolean;
  };
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<PlatformSettings>({
    general: {
      siteName: 'ExCom Marketplace',
      siteDescription: 'Universal marketplace for products, rentals, services, and more.',
      supportEmail: 'support@excom.local',
      maintenanceMode: false,
      allowRegistrations: true
    },
    payments: {
      stripeEnabled: true,
      paypalEnabled: false,
      commissionRate: 5.0,
      minimumPayout: 25.0
    },
    notifications: {
      emailNotifications: true,
      orderNotifications: true,
      storeApprovalNotifications: true,
      systemAlerts: true
    },
    security: {
      requireEmailVerification: true,
      twoFactorAuth: false,
      maxLoginAttempts: 5,
      sessionTimeout: 30
    },
    features: {
      aiRecommendations: true,
      multiVendor: true,
      guestCheckout: true,
      productReviews: true,
      wishlist: true
    }
  });

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (section: keyof PlatformSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const tabs = [
    { label: 'General', icon: <Settings /> },
    { label: 'Payments', icon: <Payment /> },
    { label: 'Notifications', icon: <Notifications /> },
    { label: 'Security', icon: <Security /> },
    { label: 'Features', icon: <Store /> }
  ];

  return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Platform Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure your platform settings and preferences
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

        <Grid container spacing={3}>
          {/* Sidebar Tabs */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Tabs
                orientation="vertical"
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ borderRight: 1, borderColor: 'divider' }}
              >
                {tabs.map((tab, index) => (
                  <Tab
                    key={index}
                    icon={tab.icon}
                    label={tab.label}
                    iconPosition="start"
                    sx={{ justifyContent: 'flex-start', minHeight: 48 }}
                  />
                ))}
              </Tabs>
            </Paper>
          </Grid>

          {/* Settings Content */}
          <Grid item xs={12} md={9}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                {/* General Settings */}
                {activeTab === 0 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      General Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure basic platform information and global settings
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        label="Site Name"
                        value={settings.general.siteName}
                        onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                        fullWidth
                      />
                      
                      <TextField
                        label="Site Description"
                        value={settings.general.siteDescription}
                        onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                      />
                      
                      <TextField
                        label="Support Email"
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) => updateSettings('general', 'supportEmail', e.target.value)}
                        fullWidth
                      />

                      <Divider />

                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.general.maintenanceMode}
                              onChange={(e) => updateSettings('general', 'maintenanceMode', e.target.checked)}
                            />
                          }
                          label="Maintenance Mode"
                        />
                        <Typography variant="caption" color="text.secondary">
                          When enabled, the site will show a maintenance page to visitors
                        </Typography>
                      </FormGroup>

                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.general.allowRegistrations}
                              onChange={(e) => updateSettings('general', 'allowRegistrations', e.target.checked)}
                            />
                          }
                          label="Allow New Registrations"
                        />
                        <Typography variant="caption" color="text.secondary">
                          Allow new users to register on the platform
                        </Typography>
                      </FormGroup>
                    </Box>
                  </Box>
                )}

                {/* Payment Settings */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Payment Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure payment methods and commission settings
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.payments.stripeEnabled}
                              onChange={(e) => updateSettings('payments', 'stripeEnabled', e.target.checked)}
                            />
                          }
                          label="Enable Stripe Payments"
                        />
                      </FormGroup>

                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.payments.paypalEnabled}
                              onChange={(e) => updateSettings('payments', 'paypalEnabled', e.target.checked)}
                            />
                          }
                          label="Enable PayPal Payments"
                        />
                      </FormGroup>

                      <TextField
                        label="Commission Rate (%)"
                        type="number"
                        value={settings.payments.commissionRate}
                        onChange={(e) => updateSettings('payments', 'commissionRate', parseFloat(e.target.value))}
                        InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                      />

                      <TextField
                        label="Minimum Payout Amount ($)"
                        type="number"
                        value={settings.payments.minimumPayout}
                        onChange={(e) => updateSettings('payments', 'minimumPayout', parseFloat(e.target.value))}
                        InputProps={{ inputProps: { min: 1, step: 0.01 } }}
                      />
                    </Box>
                  </Box>
                )}

                {/* Notification Settings */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Notification Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure notification preferences for admins and users
                    </Typography>

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.emailNotifications}
                            onChange={(e) => updateSettings('notifications', 'emailNotifications', e.target.checked)}
                          />
                        }
                        label="Enable Email Notifications"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.orderNotifications}
                            onChange={(e) => updateSettings('notifications', 'orderNotifications', e.target.checked)}
                          />
                        }
                        label="Order Notifications"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.storeApprovalNotifications}
                            onChange={(e) => updateSettings('notifications', 'storeApprovalNotifications', e.target.checked)}
                          />
                        }
                        label="Store Approval Notifications"
                      />
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.systemAlerts}
                            onChange={(e) => updateSettings('notifications', 'systemAlerts', e.target.checked)}
                          />
                        }
                        label="System Alerts"
                      />
                    </FormGroup>
                  </Box>
                )}

                {/* Security Settings */}
                {activeTab === 3 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Security Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure security and authentication settings
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.security.requireEmailVerification}
                              onChange={(e) => updateSettings('security', 'requireEmailVerification', e.target.checked)}
                            />
                          }
                          label="Require Email Verification"
                        />
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.security.twoFactorAuth}
                              onChange={(e) => updateSettings('security', 'twoFactorAuth', e.target.checked)}
                            />
                          }
                          label="Enable Two-Factor Authentication"
                        />
                      </FormGroup>

                      <TextField
                        label="Maximum Login Attempts"
                        type="number"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        InputProps={{ inputProps: { min: 1, max: 10 } }}
                      />

                      <TextField
                        label="Session Timeout (minutes)"
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                        InputProps={{ inputProps: { min: 5, max: 480 } }}
                      />
                    </Box>
                  </Box>
                )}

                {/* Feature Settings */}
                {activeTab === 4 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Feature Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Enable or disable platform features
                    </Typography>

                    <List>
                      <ListItem>
                        <ListItemText
                          primary="AI Recommendations"
                          secondary="Enable AI-powered product recommendations"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.features.aiRecommendations}
                            onChange={(e) => updateSettings('features', 'aiRecommendations', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      <ListItem>
                        <ListItemText
                          primary="Multi-Vendor Support"
                          secondary="Allow multiple vendors to sell on the platform"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.features.multiVendor}
                            onChange={(e) => updateSettings('features', 'multiVendor', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      <ListItem>
                        <ListItemText
                          primary="Guest Checkout"
                          secondary="Allow users to checkout without registration"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.features.guestCheckout}
                            onChange={(e) => updateSettings('features', 'guestCheckout', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      <ListItem>
                        <ListItemText
                          primary="Product Reviews"
                          secondary="Enable product review and rating system"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.features.productReviews}
                            onChange={(e) => updateSettings('features', 'productReviews', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      
                      <ListItem>
                        <ListItemText
                          primary="Wishlist"
                          secondary="Allow users to save products to wishlist"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.features.wishlist}
                            onChange={(e) => updateSettings('features', 'wishlist', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" onClick={() => window.location.reload()}>
                    Reset Changes
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
}