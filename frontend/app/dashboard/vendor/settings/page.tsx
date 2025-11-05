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
  InputLabel
} from '@mui/material';
import {
  Settings,
  Security,
  Notifications,
  Payment,
  Store,
  Mail,
  Person,
  Business,
  MonetizationOn,
  Inventory,
  LocalShipping,
  Analytics
} from '@mui/icons-material';
import { useAuth } from '@utils/auth';
import { useTranslation } from 'react-i18next';
import VendorLayout from '@/components/VendorLayout';

interface VendorSettings {
  profile: {
    businessName: string;
    businessType: string;
    description: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    website: string;
    taxId: string;
  };
  store: {
    storeName: string;
    storeDescription: string;
    storeLogo: string;
    bannerImage: string;
    autoApproveProducts: boolean;
    allowBargaining: boolean;
    minimumBargainDiscount: number;
    maximumBargainDiscount: number;
  };
  payments: {
    payoutMethod: string;
    bankAccount: string;
    paypalEmail: string;
    stripeAccount: string;
    taxRate: number;
    currency: string;
  };
  notifications: {
    emailNotifications: boolean;
    orderNotifications: boolean;
    lowStockAlerts: boolean;
    newReviewNotifications: boolean;
    bargainNotifications: boolean;
    payoutNotifications: boolean;
  };
  shipping: {
    freeShippingThreshold: number;
    shippingCost: number;
    processingTime: number;
    returnPolicy: string;
    shippingRegions: string[];
  };
  analytics: {
    trackSales: boolean;
    trackInventory: boolean;
    trackCustomerBehavior: boolean;
    shareDataWithPlatform: boolean;
  };
}

export default function VendorSettingsPage() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<VendorSettings>({
    profile: {
      businessName: '',
      businessType: 'retail',
      description: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      website: '',
      taxId: ''
    },
    store: {
      storeName: '',
      storeDescription: '',
      storeLogo: '',
      bannerImage: '',
      autoApproveProducts: false,
      allowBargaining: true,
      minimumBargainDiscount: 5,
      maximumBargainDiscount: 30
    },
    payments: {
      payoutMethod: 'bank',
      bankAccount: '',
      paypalEmail: '',
      stripeAccount: '',
      taxRate: 0,
      currency: 'RWF'
    },
    notifications: {
      emailNotifications: true,
      orderNotifications: true,
      lowStockAlerts: true,
      newReviewNotifications: true,
      bargainNotifications: true,
      payoutNotifications: true
    },
    shipping: {
      freeShippingThreshold: 50,
      shippingCost: 5.99,
      processingTime: 2,
      returnPolicy: '',
      shippingRegions: ['US']
    },
    analytics: {
      trackSales: true,
      trackInventory: true,
      trackCustomerBehavior: false,
      shareDataWithPlatform: true
    }
  });

  useEffect(() => {
    if (user) {
      // Load user settings from API
      fetchSettings();
    }
  }, [user, token]);

  const fetchSettings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data.settings }));
      } else {
        console.error('Failed to fetch vendor settings');
      }
    } catch (error) {
      console.error('Error fetching vendor settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sellers/settings`, {
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

  const updateSettings = (section: keyof VendorSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const tabs = [
    { label: 'Profile', icon: <Person /> },
    { label: 'Store', icon: <Store /> },
    { label: 'Payments', icon: <Payment /> },
    { label: 'Notifications', icon: <Notifications /> },
    { label: 'Shipping', icon: <LocalShipping /> },
    { label: 'Analytics', icon: <Analytics /> }
  ];

  return (
    <VendorLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {t('vendor.settings')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your vendor account settings and preferences
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
                {/* Profile Settings */}
                {activeTab === 0 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Business Profile
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Update your business information and contact details
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        label="Business Name"
                        value={settings.profile.businessName}
                        onChange={(e) => updateSettings('profile', 'businessName', e.target.value)}
                        fullWidth
                        required
                      />
                      
                      <FormControl fullWidth>
                        <InputLabel>Business Type</InputLabel>
                        <Select
                          value={settings.profile.businessType}
                          onChange={(e) => updateSettings('profile', 'businessType', e.target.value)}
                          label="Business Type"
                        >
                          <MenuItem value="retail">Retail</MenuItem>
                          <MenuItem value="wholesale">Wholesale</MenuItem>
                          <MenuItem value="manufacturer">Manufacturer</MenuItem>
                          <MenuItem value="service">Service Provider</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        label="Business Description"
                        value={settings.profile.description}
                        onChange={(e) => updateSettings('profile', 'description', e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                      />

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Phone Number"
                            value={settings.profile.phone}
                            onChange={(e) => updateSettings('profile', 'phone', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Website"
                            value={settings.profile.website}
                            onChange={(e) => updateSettings('profile', 'website', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                      </Grid>

                      <TextField
                        label="Address"
                        value={settings.profile.address}
                        onChange={(e) => updateSettings('profile', 'address', e.target.value)}
                        fullWidth
                      />

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="City"
                            value={settings.profile.city}
                            onChange={(e) => updateSettings('profile', 'city', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="State"
                            value={settings.profile.state}
                            onChange={(e) => updateSettings('profile', 'state', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="ZIP Code"
                            value={settings.profile.zipCode}
                            onChange={(e) => updateSettings('profile', 'zipCode', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                      </Grid>

                      <TextField
                        label="Tax ID"
                        value={settings.profile.taxId}
                        onChange={(e) => updateSettings('profile', 'taxId', e.target.value)}
                        fullWidth
                        helperText="Required for tax reporting"
                      />
                    </Box>
                  </Box>
                )}

                {/* Store Settings */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Store Configuration
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure your store appearance and policies
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        label="Store Name"
                        value={settings.store.storeName}
                        onChange={(e) => updateSettings('store', 'storeName', e.target.value)}
                        fullWidth
                        required
                      />

                      <TextField
                        label="Store Description"
                        value={settings.store.storeDescription}
                        onChange={(e) => updateSettings('store', 'storeDescription', e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                      />

                      <Divider />

                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.store.autoApproveProducts}
                              onChange={(e) => updateSettings('store', 'autoApproveProducts', e.target.checked)}
                            />
                          }
                          label="Auto-approve Products"
                        />
                        <Typography variant="caption" color="text.secondary">
                          Automatically approve new products without admin review
                        </Typography>
                      </FormGroup>

                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.store.allowBargaining}
                              onChange={(e) => updateSettings('store', 'allowBargaining', e.target.checked)}
                            />
                          }
                          label="Allow Bargaining"
                        />
                        <Typography variant="caption" color="text.secondary">
                          Allow customers to negotiate prices on your products
                        </Typography>
                      </FormGroup>

                      {settings.store.allowBargaining && (
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              label="Minimum Discount (%)"
                              type="number"
                              value={settings.store.minimumBargainDiscount}
                              onChange={(e) => updateSettings('store', 'minimumBargainDiscount', parseFloat(e.target.value))}
                              InputProps={{ inputProps: { min: 0, max: 100 } }}
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Maximum Discount (%)"
                              type="number"
                              value={settings.store.maximumBargainDiscount}
                              onChange={(e) => updateSettings('store', 'maximumBargainDiscount', parseFloat(e.target.value))}
                              InputProps={{ inputProps: { min: 0, max: 100 } }}
                              fullWidth
                            />
                          </Grid>
                        </Grid>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Payment Settings */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Payment & Payout Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure how you receive payments and payouts
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Payout Method</InputLabel>
                        <Select
                          value={settings.payments.payoutMethod}
                          onChange={(e) => updateSettings('payments', 'payoutMethod', e.target.value)}
                          label="Payout Method"
                        >
                          <MenuItem value="bank">Bank Transfer</MenuItem>
                          <MenuItem value="paypal">PayPal</MenuItem>
                          <MenuItem value="stripe">Stripe</MenuItem>
                        </Select>
                      </FormControl>

                      {settings.payments.payoutMethod === 'bank' && (
                        <TextField
                          label="Bank Account Details"
                          value={settings.payments.bankAccount}
                          onChange={(e) => updateSettings('payments', 'bankAccount', e.target.value)}
                          multiline
                          rows={3}
                          fullWidth
                          helperText="Include bank name, account number, and routing number"
                        />
                      )}

                      {settings.payments.payoutMethod === 'paypal' && (
                        <TextField
                          label="PayPal Email"
                          type="email"
                          value={settings.payments.paypalEmail}
                          onChange={(e) => updateSettings('payments', 'paypalEmail', e.target.value)}
                          fullWidth
                        />
                      )}

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            label="Tax Rate (%)"
                            type="number"
                            value={settings.payments.taxRate}
                            onChange={(e) => updateSettings('payments', 'taxRate', parseFloat(e.target.value))}
                            InputProps={{ inputProps: { min: 0, max: 100, step: 0.01 } }}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <FormControl fullWidth>
                            <InputLabel>Currency</InputLabel>
                            <Select
                              value={settings.payments.currency}
                              onChange={(e) => updateSettings('payments', 'currency', e.target.value)}
                              label="Currency"
                            >
                              <MenuItem value="RWF">RWF (Rwandan Franc)</MenuItem>
                              <MenuItem value="USD">USD</MenuItem>
                              <MenuItem value="EUR">EUR</MenuItem>
                              <MenuItem value="GBP">GBP</MenuItem>
                              <MenuItem value="CAD">CAD</MenuItem>
                              <MenuItem value="NGN">NGN (Nigerian Naira)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
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
                          primary="Order Notifications"
                          secondary="Get notified when new orders are placed"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.orderNotifications}
                            onChange={(e) => updateSettings('notifications', 'orderNotifications', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary="Low Stock Alerts"
                          secondary="Get notified when inventory is running low"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.lowStockAlerts}
                            onChange={(e) => updateSettings('notifications', 'lowStockAlerts', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary="New Review Notifications"
                          secondary="Get notified when customers leave reviews"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.newReviewNotifications}
                            onChange={(e) => updateSettings('notifications', 'newReviewNotifications', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary="Bargain Notifications"
                          secondary="Get notified when customers make offers"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.bargainNotifications}
                            onChange={(e) => updateSettings('notifications', 'bargainNotifications', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary="Payout Notifications"
                          secondary="Get notified about payout status"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.payoutNotifications}
                            onChange={(e) => updateSettings('notifications', 'payoutNotifications', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </Box>
                )}

                {/* Shipping Settings */}
                {activeTab === 4 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Shipping & Returns
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Configure shipping options and return policies
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            label="Free Shipping Threshold ($)"
                            type="number"
                            value={settings.shipping.freeShippingThreshold}
                            onChange={(e) => updateSettings('shipping', 'freeShippingThreshold', parseFloat(e.target.value))}
                            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Standard Shipping Cost ($)"
                            type="number"
                            value={settings.shipping.shippingCost}
                            onChange={(e) => updateSettings('shipping', 'shippingCost', parseFloat(e.target.value))}
                            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                            fullWidth
                          />
                        </Grid>
                      </Grid>

                      <TextField
                        label="Processing Time (days)"
                        type="number"
                        value={settings.shipping.processingTime}
                        onChange={(e) => updateSettings('shipping', 'processingTime', parseInt(e.target.value))}
                        InputProps={{ inputProps: { min: 1, max: 30 } }}
                        fullWidth
                        helperText="How many days it takes to process and ship orders"
                      />

                      <TextField
                        label="Return Policy"
                        value={settings.shipping.returnPolicy}
                        onChange={(e) => updateSettings('shipping', 'returnPolicy', e.target.value)}
                        multiline
                        rows={4}
                        fullWidth
                        helperText="Describe your return and refund policy"
                      />
                    </Box>
                  </Box>
                )}

                {/* Analytics Settings */}
                {activeTab === 5 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Analytics & Data
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Control what data is tracked and shared
                    </Typography>

                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Track Sales Data"
                          secondary="Monitor sales performance and trends"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.analytics.trackSales}
                            onChange={(e) => updateSettings('analytics', 'trackSales', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary="Track Inventory"
                          secondary="Monitor stock levels and movement"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.analytics.trackInventory}
                            onChange={(e) => updateSettings('analytics', 'trackInventory', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary="Track Customer Behavior"
                          secondary="Analyze customer browsing and purchase patterns"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.analytics.trackCustomerBehavior}
                            onChange={(e) => updateSettings('analytics', 'trackCustomerBehavior', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary="Share Data with Platform"
                          secondary="Allow platform to use your data for improvements"
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.analytics.shareDataWithPlatform}
                            onChange={(e) => updateSettings('analytics', 'shareDataWithPlatform', e.target.checked)}
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
    </VendorLayout>
  );
}
