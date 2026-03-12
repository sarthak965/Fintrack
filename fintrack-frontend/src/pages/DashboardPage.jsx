import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Sparkles,
  Target,
  ChevronRight,
  Plus,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'recharts';
import useTransactionStore from '@/store/transactionStore';
import useGoalStore from '@/store/goalStore';
import { formatCurrency, formatCurrencyShort, formatDate, getShortMonthName } from '@/utils/formatters';
import { aiApi } from '@/api';
import { toast } from 'sonner';

const CHART_COLORS = ['#4f46e5', '#0d9488', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#ec4899'];

export default function DashboardPage() {
  const { transactions, analytics, fetchTransactions, fetchAnalytics, fetchCategories, isLoading } = useTransactionStore();
  const { goals, fetchGoals } = useGoalStore();
  const [aiInsights, setAiInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchAnalytics();
    fetchCategories();
    fetchGoals();
    loadAiInsights();
  }, []);

  const loadAiInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await aiApi.getInsights();
      setAiInsights(response.data);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Prepare chart data
  const monthlyData = analytics?.monthlyTrends?.slice(-6).map((item) => ({
    month: getShortMonthName(new Date(item.month + '-01').getMonth()),
    income: item.income,
    expense: item.expense,
  })) || [];

  const categoryData = analytics?.categoryBreakdown?.slice(0, 5).map((item, index) => ({
    name: item.category,
    value: item.amount,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  const weeklyData = analytics?.weeklyTrends?.map((item) => ({
    week: formatDate(item.week, 'short').split(' ')[0] + ' ' + formatDate(item.week, 'short').split(' ')[1],
    amount: item.amount,
  })) || [];

  const recentTransactions = transactions.slice(0, 5);
  const activeGoals = goals.slice(0, 3);

  if (isLoading && !analytics) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your financial overview</p>
        </div>
        <Link to="/transactions">
          <Button data-testid="add-transaction-btn">
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Balance"
          value={formatCurrency(analytics?.totalBalance || 0)}
          icon={Wallet}
          trend={analytics?.totalBalance >= 0 ? 'up' : 'down'}
          trendValue={analytics?.totalBalance >= 0 ? 'Positive' : 'Negative'}
          color="primary"
          testId="total-balance-card"
        />
        <StatsCard
          title="Total Income"
          value={formatCurrency(analytics?.totalIncome || 0)}
          icon={TrendingUp}
          trend="up"
          trendValue="This period"
          color="green"
          testId="total-income-card"
        />
        <StatsCard
          title="Total Expenses"
          value={formatCurrency(analytics?.totalExpense || 0)}
          icon={TrendingDown}
          trend="down"
          trendValue="This period"
          color="red"
          testId="total-expense-card"
        />
        <StatsCard
          title="Transactions"
          value={analytics?.transactionCount || 0}
          icon={CreditCard}
          trend="neutral"
          trendValue="Total count"
          color="purple"
          testId="transaction-count-card"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Chart */}
        <Card className="card-hover" data-testid="income-expense-chart">
          <CardHeader>
            <CardTitle className="text-lg">Income vs Expenses</CardTitle>
            <CardDescription>Monthly comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrencyShort(value)} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart message="No data available yet" />
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="card-hover" data-testid="category-chart">
          <CardHeader>
            <CardTitle className="text-lg">Expense by Category</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-[300px] flex items-center">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
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
                <div className="w-1/2 space-y-2">
                  {categoryData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm truncate max-w-[100px]">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrencyShort(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChart message="No expense data yet" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trends & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Spending Trends */}
        <Card className="lg:col-span-2 card-hover" data-testid="weekly-trends-chart">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Spending Trends</CardTitle>
            <CardDescription>Your spending patterns over time</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrencyShort(value)} className="text-muted-foreground" />
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
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart message="No weekly data yet" />
            )}
          </CardContent>
        </Card>

        {/* AI Insights Panel */}
        <Card className="card-hover" data-testid="ai-insights-panel">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">AI Insights</CardTitle>
              </div>
              <Link to="/ai-insights">
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : aiInsights?.insights?.length > 0 ? (
              <div className="space-y-3">
                {aiInsights.insights.slice(0, 3).map((insight, index) => (
                  <div
                    key={index}
                    className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground"
                  >
                    {insight}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add more transactions to get personalized AI insights about your spending patterns.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="card-hover" data-testid="recent-transactions">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <Link to="/transactions">
                <Button variant="ghost" size="sm">
                  View all
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'INCOME' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {transaction.type === 'INCOME' ? (
                          <ArrowUpRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.category} • {formatDate(transaction.transactionDate, 'relative')}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold tabular-nums ${
                      transaction.type === 'INCOME' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No transactions yet</p>
                <Link to="/transactions">
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first transaction
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Goals */}
        <Card className="card-hover" data-testid="financial-goals">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                <CardTitle className="text-lg">Financial Goals</CardTitle>
              </div>
              <Link to="/goals">
                <Button variant="ghost" size="sm">
                  View all
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeGoals.length > 0 ? (
              <div className="space-y-4">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{goal.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {goal.progress.toFixed(1)}% complete
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No goals set yet</p>
                <Link to="/goals">
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first goal
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, trend, trendValue, color, testId }) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-500',
    red: 'bg-red-500/10 text-red-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <Card className="card-hover" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <div className="flex items-center gap-1 text-xs">
              {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-green-500" />}
              {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
              <span className="text-muted-foreground">{trendValue}</span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-[250px] flex items-center justify-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
