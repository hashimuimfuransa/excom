'use client';

import React, { useState, useEffect } from 'react';
import { 
  Alert, Box, Button, Card, CardContent, Container, Grid, LinearProgress, 
  Paper, Stack, TextField, Typography, Divider, Avatar, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, IconButton, Tooltip, Tabs, Tab
} from '@mui/material';
import { 
  Trophy, 
  Medal, 
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  EmojiEvents
} from '@mui/icons-material';
import { apiGet } from '@utils/api';
import { useTranslation } from 'react-i18next';

interface LeaderboardEntry {
  _id: string;
  rank: number;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  vendor: {
    _id: string;
    name: string;
  };
  referralCode: string;
  totalEarnings: number;
  totalCommissions: number;
  totalClicks: number;
  totalConversions: number;
  badge: {
    name: string;
    color: string;
  };
}

interface LeaderboardData {
  period: string;
  leaderboard: LeaderboardEntry[];
  totalAffiliates: number;
}

export default function AffiliateLeaderboardPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedPeriod]);

  const fetchLeaderboard = async () => {
    try {
      const leaderboardData = await apiGet<LeaderboardData>(`/affiliate-gamification/leaderboard?period=${selectedPeriod}&limit=50`);
      setData(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy sx={{ color: 'gold', fontSize: 32 }} />;
    if (rank === 2) return <Medal sx={{ color: 'silver', fontSize: 32 }} />;
    if (rank === 3) return <Medal sx={{ color: '#CD7F32', fontSize: 32 }} />;
    return (
      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
        <Typography variant="h6" fontWeight={700}>
          {rank}
        </Typography>
      </Avatar>
    );
  };

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'gold': return 'warning';
      case 'silver': return 'default';
      case 'bronze': return 'secondary';
      case 'blue': return 'info';
      case 'green': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4} textAlign="center">
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Affiliate Leaderboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          See the top performing affiliates and compete for the top spots!
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs 
          value={selectedPeriod} 
          onChange={(e, newValue) => setSelectedPeriod(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          centered
        >
          <Tab label="Last 7 Days" value="7d" />
          <Tab label="Last 30 Days" value="30d" />
          <Tab label="Last 90 Days" value="90d" />
          <Tab label="All Time" value="all" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {data && (
            <>
              {/* Top 3 Podium */}
              <Grid container spacing={3} mb={4}>
                {data.leaderboard.slice(0, 3).map((entry, index) => (
                  <Grid item xs={12} md={4} key={entry._id}>
                    <Card 
                      sx={{ 
                        textAlign: 'center', 
                        p: 3,
                        ...(index === 0 && { 
                          border: 2, 
                          borderColor: 'warning.main',
                          boxShadow: 3
                        })
                      }}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="center" mb={2}>
                          {getRankIcon(entry.rank)}
                        </Box>
                        <Typography variant="h5" fontWeight={600} gutterBottom>
                          {entry.user.name}
                        </Typography>
                        <Chip 
                          label={entry.badge.name}
                          color={getBadgeColor(entry.badge.color)}
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                        <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
                          ${entry.totalEarnings.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {entry.totalConversions} conversions
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {entry.totalClicks} clicks
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Vendor: {entry.vendor.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Full Leaderboard */}
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <TrendingUp color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Complete Leaderboard
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Showing {data.leaderboard.length} of {data.totalAffiliates} affiliates
                  </Typography>
                  
                  <Stack spacing={2}>
                    {data.leaderboard.map((entry) => (
                      <Paper key={entry._id} sx={{ p: 2, border: 1, borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box display="flex" alignItems="center" justifyContent="center" width={40}>
                              {getRankIcon(entry.rank)}
                            </Box>
                            <Avatar sx={{ bgcolor: 'grey.300', width: 40, height: 40 }}>
                              {entry.user.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {entry.user.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {entry.vendor.name}
                              </Typography>
                            </Box>
                          </Box>
                          <Box display="flex" alignItems="center" gap={3}>
                            <Box textAlign="center">
                              <Typography variant="body2" color="text.secondary">
                                Earnings
                              </Typography>
                              <Typography variant="subtitle1" fontWeight={600} color="success.main">
                                ${entry.totalEarnings.toFixed(2)}
                              </Typography>
                            </Box>
                            <Box textAlign="center">
                              <Typography variant="body2" color="text.secondary">
                                Conversions
                              </Typography>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {entry.totalConversions}
                              </Typography>
                            </Box>
                            <Box textAlign="center">
                              <Typography variant="body2" color="text.secondary">
                                Clicks
                              </Typography>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {entry.totalClicks}
                              </Typography>
                            </Box>
                            <Chip 
                              label={entry.badge.name}
                              color={getBadgeColor(entry.badge.color)}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              {/* Stats Summary */}
              <Grid container spacing={3} mt={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <CardContent>
                      <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                        <Users />
                      </Avatar>
                      <Typography variant="h4" fontWeight={700}>
                        {data.totalAffiliates}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Affiliates
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <CardContent>
                      <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2 }}>
                        <DollarSign />
                      </Avatar>
                      <Typography variant="h4" fontWeight={700}>
                        ${data.leaderboard.reduce((sum, entry) => sum + entry.totalEarnings, 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Earnings
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card sx={{ textAlign: 'center', p: 2 }}>
                    <CardContent>
                      <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                        <Target />
                      </Avatar>
                      <Typography variant="h4" fontWeight={700}>
                        {data.leaderboard.reduce((sum, entry) => sum + entry.totalConversions, 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Conversions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}