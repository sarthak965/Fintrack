import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
} from 'recharts';
import useTransactionStore from '@/store/transactionStore';
import { analyticsApi } from '@/api';
import { formatCurrency, formatCurrencyShort, getShortMonthName } from '@/utils/formatters';

const CHART_COLORS = ['#4f46e5', '#0d9488', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#ec4899'];

export default function AnalyticsPage() {
  const { analytics, fetchAnalytics, isLoading } = useTransactionStore();
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  useEffect(() => {
    fetchAnalytics();
    loadHeatmap();
  }, []);

  const loadHeatmap = async () => {
    try {
      const response = await analyticsApi.getHeatmap();
      setHeatmapData(response.data);
    } catch (error) {
      console.error('Failed to load heatmap:', error);
    }
  };

  // Process data for charts
  const monthlyData = analytics?.monthlyTrends?.slice(-6).map((item) => ({
    month: getShortMonthName(new Date(item.month + '-01').getMonth()),
    income: item.income,
    expense: item.expense,
    net: item.income - item.expense,
  })) || [];

  const categoryData = analytics?.categoryBreakdown?.slice(0, 8).map((item, index) => ({
    name: item.category,
    value: item.amount,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  const weeklyData = analytics?.weeklyTrends?.map((item, index) => ({
    week: `W${index + 1}`,
    amount: item.amount,
  })) || [];

  // Calculate insights
  const totalExpense = analytics?.totalExpense || 0;
  const topCategory = categoryData[0];
  const avgMonthlyExpense = monthlyData.length > 0
    ? monthlyData.reduce((acc, m) => acc + m.expense, 0) / monthlyData.length
    : 0;

  if (isLoading && !analytics) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Deep insights into your finances</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg Monthly Expense"
          value={formatCurrency(avgMonthlyExpense)}
          icon={BarChart3}
          color="primary"
        />
        <StatCard
          title="Top Category"
          value={topCategory?.name || 'N/A'}
          subtitle={topCategory ? formatCurrency(topCategory.value) : ''}
          icon={PieChartIcon}
          color="purple"
        />
        <StatCard
          title="Total Tracked"
          value={formatCurrency((analytics?.totalIncome || 0) + (analytics?.totalExpense || 0))}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Savings Rate"
          value={`${analytics?.totalIncome > 0
            ? (((analytics.totalIncome - analytics.totalExpense) / analytics.totalIncome) * 100).toFixed(1)
            : 0}%`}
          icon={TrendingDown}
          color="teal"
        />
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-6 space-y-6">
          {/* Income vs Expense Trend */}
          <Card data-testid="trends-chart">
            <CardHeader>
              <CardTitle>Income vs Expenses Over Time</CardTitle>
              <CardDescription>Monthly comparison with net savings</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrencyShort(value)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="net" stroke="#4f46e5" strokeWidth={3} name="Net" dot={{ fill: '#4f46e5' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="No trend data available" />
              )}
            </CardContent>
          </Card>

          {/* Weekly Spending */}
          <Card data-testid="weekly-chart">
            <CardHeader>
              <CardTitle>Weekly Spending Analysis</CardTitle>
              <CardDescription>Track your weekly spending patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrencyShort(value)} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#0d9488"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorWeekly)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="No weekly data available" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="mt-6 space-y-6">
          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="pie-chart">
              <CardHeader>
                <CardTitle>Expense Distribution</CardTitle>
                <CardDescription>Where your money goes</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value) => formatCurrency(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart message="No category data available" />
                )}
              </CardContent>
            </Card>

            <Card data-testid="bar-chart">
              <CardHeader>
                <CardTitle>Category Comparison</CardTitle>
                <CardDescription>Spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 10, left: 80, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrencyShort(value)} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart message="No category data available" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category List */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(cat.value)}</p>
                      <p className="text-xs text-muted-foreground">
                        {totalExpense > 0 ? ((cat.value / totalExpense) * 100).toFixed(1) : 0}% of total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="mt-6">
          <Card data-testid="heatmap-chart">
            <CardHeader>
              <CardTitle>Monthly Spending Heatmap</CardTitle>
              <CardDescription>Daily spending intensity over time</CardDescription>
            </CardHeader>
            <CardContent>
              {heatmapData.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {generateHeatmapGrid(heatmapData).map((day, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-sm transition-colors"
                        style={{
                          backgroundColor: day
                            ? `rgba(79, 70, 229, ${Math.min(day.intensity, 1)})`
                            : 'hsl(var(--muted))',
                        }}
                        title={day ? `${day.date}: ${formatCurrency(day.amount)}` : 'No data'}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 justify-end text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-1">
                      {[0.1, 0.3, 0.5, 0.7, 1].map((opacity) => (
                        <div
                          key={opacity}
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: `rgba(79, 70, 229, ${opacity})` }}
                        />
                      ))}
                    </div>
                    <span>More</span>
                  </div>
                </div>
              ) : (
                <EmptyChart message="No heatmap data available" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    purple: 'bg-purple-500/10 text-purple-500',
    green: 'bg-green-500/10 text-green-500',
    teal: 'bg-teal-500/10 text-teal-500',
  };

  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function generateHeatmapGrid(data) {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const dataMap = {};
  data.forEach((d) => {
    dataMap[d.date] = { ...d, intensity: d.amount / maxAmount };
  });

  // Generate last 12 weeks
  const grid = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 84); // 12 weeks

  for (let i = 0; i < 84; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    grid.push(dataMap[dateStr] || null);
  }

  return grid;
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
