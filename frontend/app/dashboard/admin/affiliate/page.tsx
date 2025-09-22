'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/utils/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  DollarSign, 
  Eye,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface GlobalStats {
  totalAffiliates: number;
  activeAffiliates: number;
  pendingAffiliates: number;
  totalClicks: number;
  totalConversions: number;
  totalCommissions: number;
  platformRevenue: number;
  conversionRate: number;
}

interface TopVendor {
  _id: string;
  name: string;
  email: string;
  affiliateCount: number;
  totalCommissions: number;
  platformRevenue: number;
}

interface SuspiciousActivity {
  _id: string;
  affiliate: {
    _id: string;
    referralCode: string;
    user: {
      name: string;
      email: string;
    };
  };
  vendor: {
    name: string;
  };
  suspiciousClicks: number;
  suspiciousConversions: number;
  riskScore: number;
  lastActivity: string;
}

export default function AdminAffiliatePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GlobalStats>({
    totalAffiliates: 0,
    activeAffiliates: 0,
    pendingAffiliates: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalCommissions: 0,
    platformRevenue: 0,
    conversionRate: 0
  });
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch global stats
      const statsResponse = await fetch('/api/admin/affiliate/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch top vendors
      const vendorsResponse = await fetch('/api/admin/affiliate/top-vendors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (vendorsResponse.ok) {
        const vendorsData = await vendorsResponse.json();
        setTopVendors(vendorsData);
      }

      // Fetch suspicious activities
      const suspiciousResponse = await fetch('/api/admin/affiliate/suspicious', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (suspiciousResponse.ok) {
        const suspiciousData = await suspiciousResponse.json();
        setSuspiciousActivities(suspiciousData);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return 'bg-red-100 text-red-800';
    if (riskScore >= 60) return 'bg-orange-100 text-orange-800';
    if (riskScore >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore >= 80) return 'High Risk';
    if (riskScore >= 60) return 'Medium Risk';
    if (riskScore >= 40) return 'Low Risk';
    return 'Safe';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Affiliate Management</h1>
        <p className="text-gray-600 mt-2">Monitor global affiliate activity and detect fraud</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAffiliates}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAffiliates} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.conversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.platformRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From processing fees
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendors">Top Vendors</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Affiliate Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Approved</span>
                    </div>
                    <span className="font-semibold">{stats.activeAffiliates}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span>Pending</span>
                    </div>
                    <span className="font-semibold">{stats.pendingAffiliates}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-semibold">{stats.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Commissions</span>
                    <span className="font-semibold">${stats.totalCommissions.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Platform Revenue</span>
                    <span className="font-semibold">${stats.platformRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topVendors.map((vendor, index) => (
                  <div key={vendor._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{vendor.name}</h3>
                        <p className="text-sm text-gray-600">{vendor.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{vendor.affiliateCount} affiliates</p>
                      <p className="text-sm text-gray-600">
                        ${vendor.totalCommissions.toFixed(2)} commissions
                      </p>
                      <p className="text-xs text-green-600">
                        ${vendor.platformRevenue.toFixed(2)} platform revenue
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Suspicious Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suspiciousActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No Suspicious Activity</h3>
                    <p className="text-gray-600">All affiliate activities appear to be legitimate.</p>
                  </div>
                ) : (
                  suspiciousActivities.map((activity) => (
                    <div key={activity._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{activity.affiliate.user.name}</h3>
                          <p className="text-sm text-gray-600">
                            Code: {activity.affiliate.referralCode} | 
                            Vendor: {activity.vendor.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Last activity: {new Date(activity.lastActivity).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getRiskColor(activity.riskScore)}>
                            {getRiskLabel(activity.riskScore)}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            Risk Score: {activity.riskScore}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-sm text-gray-600">Suspicious Clicks</p>
                          <p className="font-semibold">{activity.suspiciousClicks}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Suspicious Conversions</p>
                          <p className="font-semibold">{activity.suspiciousConversions}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button size="sm" variant="outline">
                          Investigate
                        </Button>
                        <Button size="sm" variant="destructive">
                          Ban Affiliate
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
