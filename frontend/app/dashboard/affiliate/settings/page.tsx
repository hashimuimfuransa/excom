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
  Slider
} from '@mui/material';
import {
  Settings,
  Security,
  Notifications,
  Payment,
  Person,
  Share,
  Analytics,
  MonetizationOn,
  Link,
  Campaign,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '@utils/auth';
import { useTranslation } from 'react-i18next';
import AffiliateLayout from '@/components/AffiliateLayout';

interface AffiliateSettings {
  profile: {
    displayName: string;
    bio: string;
    website: string;
    socialMedia: {
      facebook: string;
      instagram: string;
      twitter: string;
      youtube: string;
      tiktok: string;
    };
    niche: string;
    targetAudience: string;
  };
  preferences: {
    commissionRate: number;
    preferredCategories: string[];
    autoApproveProducts: boolean;
    showPersonalBranding: boolean;
    allowDirectMessages: boolean;
  };
  payments: {
    payoutMethod: string;
    bankAccount: string;
    paypalEmail: string;
    stripeAccount: string;
    taxId: string;
    minimumPayout: number;
  };
  notifications: {
    emailNotifications: boolean;
    commissionNotifications: boolean;
    newProductNotifications: boolean;
    performanceNotifications: boolean;
    marketingTips: boolean;
    weeklyReports: boolean;
  };
  marketing: {
    trackingEnabled: boolean;
    customTrackingCode: string;
    utmParameters: {
      source: string;
      medium: string;
      campaign: string;
    };
    socialSharing: boolean;
    emailMarketing: boolean;
  };
  analytics: {
    trackClicks: boolean;
    trackConversions: boolean;
    trackRevenue: boolean;
    shareDataWithVendors: boolean;
    detailedReporting: boolean;
  };
}

export default function AffiliateSettingsPage() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<AffiliateSettings>({
    profile: {
      displayName: '',
      bio: '',
      website: '',
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        tiktok: ''
      },
      niche: '',
      targetAudience: ''
    },
    preferences: {
      commissionRate: 5,
      preferredCategories: [],
      autoApproveProducts: false,
      showPersonalBranding: true,
      allowDirectMessages: true
    },
    payments: {
      payoutMethod: 'paypal',
      bankAccount: '',
      paypalEmail: '',
      stripeAccount: '',
      taxId: '',
      minimumPayout: 25
    },
    notifications: {
      emailNotifications: true,
      commissionNotifications: true,
      newProductNotifications: true,
      performanceNotifications: true,
      marketingTips: true,
      weeklyReports: true
    },
    marketing: {
      trackingEnabled: true,
      customTrackingCode: '',
      utmParameters: {
        source: 'affiliate',
        medium: 'social',
        campaign: ''
      },
      socialSharing: true,
      emailMarketing: false
    },
    analytics: {
      trackClicks: true,
      trackConversions: true,
      trackRevenue: true,
      shareDataWithVendors: false,
      detailedReporting: true
    }
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/affiliate/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data.settings }));
      } else {
        console.error('Failed to fetch affiliate settings');
      }
    } catch (error) {
      console.error('Error fetching affiliate settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/affiliate/settings`, {
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

  const updateSettings = (section: keyof AffiliateSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateSocialMedia = (platform: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        socialMedia: {
          ...prev.profile.socialMedia,
          [platform]: value
        }
      }
    }));
  };

  const updateUtmParameters = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      marketing: {
        ...prev.marketing,
        utmParameters: {
          ...prev.marketing.utmParameters,
          [field]: value
        }
      }
    }));
  };

  const tabs = [
    { label: t('affiliate.affiliateProfile'), icon: <Person /> },
    { label: t('affiliate.affiliatePreferences'), icon: <Settings /> },
    { label: t('affiliate.paymentPayoutSettings'), icon: <Payment /> },
    { label: t('affiliate.notificationPreferences'), icon: <Notifications /> },
    { label: t('affiliate.marketingTracking'), icon: <Campaign /> },
    { label: t('affiliate.analyticsData'), icon: <Analytics /> }
  ];

  return (
    <AffiliateLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {t('affiliate.affiliateSettings')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('affiliate.manageAffiliateAccount')}
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
                      {t('affiliate.affiliateProfile')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {t('affiliate.setUpAffiliateProfile')}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <TextField
                        label={t('affiliate.displayName')}
                        value={settings.profile.displayName}
                        onChange={(e) => updateSettings('profile', 'displayName', e.target.value)}
                        fullWidth
                        required
                      />

                      <TextField
                        label={t('affiliate.bio')}
                        value={settings.profile.bio}
                        onChange={(e) => updateSettings('profile', 'bio', e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                        helperText={t('affiliate.tellYourAudience')}
                      />

                      <TextField
                        label={t('affiliate.website')}
                        value={settings.profile.website}
                        onChange={(e) => updateSettings('profile', 'website', e.target.value)}
                        fullWidth
                        placeholder="https://yourwebsite.com"
                      />

                      <Divider />

                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {t('affiliate.socialMediaLinks')}
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label={t('affiliate.facebook')}
                            value={settings.profile.socialMedia.facebook}
                            onChange={(e) => updateSocialMedia('facebook', e.target.value)}
                            fullWidth
                            placeholder="https://facebook.com/yourpage"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label={t('affiliate.instagram')}
                            value={settings.profile.socialMedia.instagram}
                            onChange={(e) => updateSocialMedia('instagram', e.target.value)}
                            fullWidth
                            placeholder="https://instagram.com/yourhandle"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label={t('affiliate.twitter')}
                            value={settings.profile.socialMedia.twitter}
                            onChange={(e) => updateSocialMedia('twitter', e.target.value)}
                            fullWidth
                            placeholder="https://twitter.com/yourhandle"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label={t('affiliate.youtube')}
                            value={settings.profile.socialMedia.youtube}
                            onChange={(e) => updateSocialMedia('youtube', e.target.value)}
                            fullWidth
                            placeholder="https://youtube.com/yourchannel"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label={t('affiliate.tiktok')}
                            value={settings.profile.socialMedia.tiktok}
                            onChange={(e) => updateSocialMedia('tiktok', e.target.value)}
                            fullWidth
                            placeholder="https://tiktok.com/@yourhandle"
                          />
                        </Grid>
                      </Grid>

                      <Divider />

                      <TextField
                        label={t('affiliate.niche')}
                        value={settings.profile.niche}
                        onChange={(e) => updateSettings('profile', 'niche', e.target.value)}
                        fullWidth
                        helperText="e.g., Fashion, Tech, Home & Garden, Fitness"
                      />

                      <TextField
                        label={t('affiliate.targetAudience')}
                        value={settings.profile.targetAudience}
                        onChange={(e) => updateSettings('profile', 'targetAudience', e.target.value)}
                        multiline
                        rows={2}
                        fullWidth
                        helperText={t('affiliate.describeTargetAudience')}
                      />
                    </Box>
                  </Box>
                )}

                {/* Preferences Settings */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {t('affiliate.affiliatePreferences')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {t('affiliate.configureAffiliateProgram')}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          {t('affiliate.preferredCommissionRate')}: {settings.preferences.commissionRate}%
                        </Typography>
                        <Slider
                          value={settings.preferences.commissionRate}
                          onChange={(_, value) => updateSettings('preferences', 'commissionRate', value)}
                          min={1}
                          max={20}
                          step={0.5}
                          marks={[
                            { value: 1, label: '1%' },
                            { value: 5, label: '5%' },
                            { value: 10, label: '10%' },
                            { value: 15, label: '15%' },
                            { value: 20, label: '20%' }
                          ]}
                          valueLabelDisplay="auto"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {t('affiliate.preferredRateNote')}
                        </Typography>
                      </Box>

                      <FormControl fullWidth>
                        <InputLabel>{t('affiliate.preferredCategories')}</InputLabel>
                        <Select
                          multiple
                          value={settings.preferences.preferredCategories}
                          onChange={(e) => updateSettings('preferences', 'preferredCategories', e.target.value)}
                          label={t('affiliate.preferredCategories')}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(selected as string[]).map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          <MenuItem value="fashion">{t('affiliate.fashion')}</MenuItem>
                          <MenuItem value="electronics">{t('affiliate.electronics')}</MenuItem>
                          <MenuItem value="home">{t('affiliate.homeGarden')}</MenuItem>
                          <MenuItem value="beauty">{t('affiliate.beautyHealth')}</MenuItem>
                          <MenuItem value="sports">{t('affiliate.sportsFitness')}</MenuItem>
                          <MenuItem value="books">{t('affiliate.booksMedia')}</MenuItem>
                          <MenuItem value="toys">{t('affiliate.toysGames')}</MenuItem>
                          <MenuItem value="automotive">{t('affiliate.automotive')}</MenuItem>
                        </Select>
                      </FormControl>

                      <Divider />

                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.preferences.autoApproveProducts}
                              onChange={(e) => updateSettings('preferences', 'autoApproveProducts', e.target.checked)}
                            />
                          }
                          label={t('affiliate.autoApproveProducts')}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {t('affiliate.autoApproveProductsDesc')}
                        </Typography>
                      </FormGroup>

                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.preferences.showPersonalBranding}
                              onChange={(e) => updateSettings('preferences', 'showPersonalBranding', e.target.checked)}
                            />
                          }
                          label={t('affiliate.showPersonalBranding')}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {t('affiliate.showPersonalBrandingDesc')}
                        </Typography>
                      </FormGroup>

                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.preferences.allowDirectMessages}
                              onChange={(e) => updateSettings('preferences', 'allowDirectMessages', e.target.checked)}
                            />
                          }
                          label={t('affiliate.allowDirectMessages')}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {t('affiliate.allowDirectMessagesDesc')}
                        </Typography>
                      </FormGroup>
                    </Box>
                  </Box>
                )}

                {/* Payment Settings */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {t('affiliate.paymentPayoutSettings')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {t('affiliate.configureCommissionPayouts')}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>{t('affiliate.payoutMethod')}</InputLabel>
                        <Select
                          value={settings.payments.payoutMethod}
                          onChange={(e) => updateSettings('payments', 'payoutMethod', e.target.value)}
                          label={t('affiliate.payoutMethod')}
                        >
                          <MenuItem value="paypal">{t('affiliate.paypal')}</MenuItem>
                          <MenuItem value="bank">{t('affiliate.bankTransfer')}</MenuItem>
                          <MenuItem value="stripe">{t('affiliate.stripe')}</MenuItem>
                        </Select>
                      </FormControl>

                      {settings.payments.payoutMethod === 'paypal' && (
                        <TextField
                          label={t('affiliate.paypalEmail')}
                          type="email"
                          value={settings.payments.paypalEmail}
                          onChange={(e) => updateSettings('payments', 'paypalEmail', e.target.value)}
                          fullWidth
                          required
                        />
                      )}

                      {settings.payments.payoutMethod === 'bank' && (
                        <TextField
                          label={t('affiliate.bankAccountDetails')}
                          value={settings.payments.bankAccount}
                          onChange={(e) => updateSettings('payments', 'bankAccount', e.target.value)}
                          multiline
                          rows={3}
                          fullWidth
                          helperText={t('affiliate.bankAccountHelper')}
                        />
                      )}

                      <TextField
                        label={t('affiliate.taxId')}
                        value={settings.payments.taxId}
                        onChange={(e) => updateSettings('payments', 'taxId', e.target.value)}
                        fullWidth
                        helperText={t('affiliate.taxIdHelper')}
                      />

                      <TextField
                        label={t('affiliate.minimumPayoutAmount')}
                        type="number"
                        value={settings.payments.minimumPayout}
                        onChange={(e) => updateSettings('payments', 'minimumPayout', parseFloat(e.target.value))}
                        InputProps={{ inputProps: { min: 10, step: 1 } }}
                        fullWidth
                        helperText={t('affiliate.minimumPayoutHelper')}
                      />
                    </Box>
                  </Box>
                )}

                {/* Notification Settings */}
                {activeTab === 3 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {t('affiliate.notificationPreferences')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {t('affiliate.chooseNotifications')}
                    </Typography>

                    <List>
                      <ListItem>
                        <ListItemText
                          primary={t('affiliate.emailNotifications')}
                          secondary={t('affiliate.receiveEmailNotifications')}
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
                          primary={t('affiliate.commissionNotifications')}
                          secondary={t('affiliate.getNotifiedCommissions')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.commissionNotifications}
                            onChange={(e) => updateSettings('notifications', 'commissionNotifications', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary={t('affiliate.newProductNotifications')}
                          secondary={t('affiliate.getNotifiedNewProducts')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.newProductNotifications}
                            onChange={(e) => updateSettings('notifications', 'newProductNotifications', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary={t('affiliate.performanceNotifications')}
                          secondary={t('affiliate.getNotifiedPerformance')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.performanceNotifications}
                            onChange={(e) => updateSettings('notifications', 'performanceNotifications', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary={t('affiliate.marketingTips')}
                          secondary={t('affiliate.receiveMarketingTips')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.marketingTips}
                            onChange={(e) => updateSettings('notifications', 'marketingTips', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary={t('affiliate.weeklyReports')}
                          secondary={t('affiliate.receiveWeeklyReports')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.notifications.weeklyReports}
                            onChange={(e) => updateSettings('notifications', 'weeklyReports', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </Box>
                )}

                {/* Marketing Settings */}
                {activeTab === 4 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {t('affiliate.marketingTracking')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {t('affiliate.configureMarketingTools')}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.marketing.trackingEnabled}
                              onChange={(e) => updateSettings('marketing', 'trackingEnabled', e.target.checked)}
                            />
                          }
                          label={t('affiliate.enableTracking')}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {t('affiliate.trackClicksConversions')}
                        </Typography>
                      </FormGroup>

                      <TextField
                        label={t('affiliate.customTrackingCode')}
                        value={settings.marketing.customTrackingCode}
                        onChange={(e) => updateSettings('marketing', 'customTrackingCode', e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                        helperText={t('affiliate.customTrackingCodeHelper')}
                      />

                      <Divider />

                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
{t('affiliate.utmParameters')}
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label={t('affiliate.source')}
                            value={settings.marketing.utmParameters.source}
                            onChange={(e) => updateUtmParameters('source', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label={t('affiliate.medium')}
                            value={settings.marketing.utmParameters.medium}
                            onChange={(e) => updateUtmParameters('medium', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label={t('affiliate.campaign')}
                            value={settings.marketing.utmParameters.campaign}
                            onChange={(e) => updateUtmParameters('campaign', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                      </Grid>

                      <Divider />

                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.marketing.socialSharing}
                              onChange={(e) => updateSettings('marketing', 'socialSharing', e.target.checked)}
                            />
                          }
                          label={t('affiliate.socialMediaSharing')}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {t('affiliate.enableSocialSharing')}
                        </Typography>
                      </FormGroup>

                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.marketing.emailMarketing}
                              onChange={(e) => updateSettings('marketing', 'emailMarketing', e.target.checked)}
                            />
                          }
                          label={t('affiliate.emailMarketingIntegration')}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {t('affiliate.integrateEmailMarketing')}
                        </Typography>
                      </FormGroup>
                    </Box>
                  </Box>
                )}

                {/* Analytics Settings */}
                {activeTab === 5 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {t('affiliate.analyticsData')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {t('affiliate.controlDataTracking')}
                    </Typography>

                    <List>
                      <ListItem>
                        <ListItemText
                          primary={t('affiliate.trackClicks')}
                          secondary={t('affiliate.monitorClickThroughRates')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.analytics.trackClicks}
                            onChange={(e) => updateSettings('analytics', 'trackClicks', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary={t('affiliate.trackConversions')}
                          secondary={t('affiliate.monitorPurchaseConversions')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.analytics.trackConversions}
                            onChange={(e) => updateSettings('analytics', 'trackConversions', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary={t('affiliate.trackRevenue')}
                          secondary={t('affiliate.monitorCommissionEarnings')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.analytics.trackRevenue}
                            onChange={(e) => updateSettings('analytics', 'trackRevenue', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary={t('affiliate.shareDataWithVendors')}
                          secondary={t('affiliate.allowVendorsSeeData')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.analytics.shareDataWithVendors}
                            onChange={(e) => updateSettings('analytics', 'shareDataWithVendors', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemText
                          primary={t('affiliate.detailedReporting')}
                          secondary={t('affiliate.enableDetailedAnalytics')}
                        />
                        <ListItemSecondaryAction>
                          <Switch
                            checked={settings.analytics.detailedReporting}
                            onChange={(e) => updateSettings('analytics', 'detailedReporting', e.target.checked)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" onClick={() => window.location.reload()}>
                    {t('affiliate.resetChanges')}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? t('affiliate.saving') : t('affiliate.saveSettings')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AffiliateLayout>
  );
}
