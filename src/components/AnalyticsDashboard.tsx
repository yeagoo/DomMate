import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from 'recharts';

interface DashboardData {
  expiryDistribution: Array<{ period: string; count: number }>;
  monthlyTrend: Array<{ month: string; monthDisplay: string; count: number }>;
  statusHistory: Array<{ date: string; normal: number; expiring: number; expired: number; failed: number }>;
}

interface AnalyticsDashboardProps {
  language?: 'zh' | 'en';
}

export function AnalyticsDashboard({ language = 'zh' }: AnalyticsDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const labels = language === 'en' ? {
    title: 'Analytics Dashboard',
    description: 'Comprehensive domain monitoring analytics',
    expiryDistribution: 'Expiry Distribution',
    monthlyTrend: 'Monthly Expiry Trend',
    statusHistory: 'Status History (7 Days)',
    refresh: 'Refresh',
    loading: 'Loading analytics...',
    error: 'Failed to load analytics',
    noData: 'No data available'
  } : {
    title: '数据分析仪表板',
    description: '全面的域名监控数据分析',
    expiryDistribution: '到期时间分布',
    monthlyTrend: '月度到期趋势',
    statusHistory: '状态变化历史（7天）',
    refresh: '刷新数据',
    loading: '加载分析数据中...',
    error: '加载分析数据失败',
    noData: '暂无数据'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/analytics');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      console.error('加载仪表板数据失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{labels.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <p className="text-red-800 font-medium">{labels.error}</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <Button 
              onClick={loadData} 
              variant="outline" 
              size="sm" 
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {labels.refresh}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground p-8">
        {labels.noData}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题和刷新按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{labels.title}</h2>
          <p className="text-muted-foreground">{labels.description}</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {labels.refresh}
        </Button>
      </div>

      {/* 第一行：到期时间分布 */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{labels.expiryDistribution}</CardTitle>
              <CardDescription>域名按到期时间段的分布情况</CardDescription>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.expiryDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 第二行：月度趋势和状态历史 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{labels.monthlyTrend}</CardTitle>
              <CardDescription>未来12个月域名到期趋势</CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="monthDisplay" 
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{labels.statusHistory}</CardTitle>
              <CardDescription>最近7天域名状态变化趋势</CardDescription>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.statusHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={10}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString();
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="normal" 
                  stroke="#22c55e" 
                  name={language === 'en' ? 'Normal' : '正常'}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="expiring" 
                  stroke="#eab308" 
                  name={language === 'en' ? 'Expiring' : '即将到期'}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="expired" 
                  stroke="#ef4444" 
                  name={language === 'en' ? 'Expired' : '已过期'}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#8884d8" 
                  name={language === 'en' ? 'Failed' : '失败'}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 