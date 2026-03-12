import { useEffect, useState } from 'react';
import {
  Sparkles,
  Send,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  Heart,
  Loader2,
  RefreshCw,
  MessageSquare,
  PiggyBank,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiApi } from '@/api';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { toast } from 'sonner';

export default function AIInsightsPage() {
  const [insights, setInsights] = useState(null);
  const [savingTips, setSavingTips] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState({
    insights: true,
    tips: true,
    health: true,
    chat: false,
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    loadInsights();
    loadSavingTips();
    loadHealthScore();
  };

  const loadInsights = async () => {
    setIsLoading((prev) => ({ ...prev, insights: true }));
    try {
      const response = await aiApi.getInsights();
      setInsights(response.data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setIsLoading((prev) => ({ ...prev, insights: false }));
    }
  };

  const loadSavingTips = async () => {
    setIsLoading((prev) => ({ ...prev, tips: true }));
    try {
      const response = await aiApi.getSavingTips();
      setSavingTips(response.data);
    } catch (error) {
      console.error('Failed to load saving tips:', error);
    } finally {
      setIsLoading((prev) => ({ ...prev, tips: false }));
    }
  };

  const loadHealthScore = async () => {
    setIsLoading((prev) => ({ ...prev, health: true }));
    try {
      const response = await aiApi.getHealthScore();
      setHealthScore(response.data);
    } catch (error) {
      console.error('Failed to load health score:', error);
    } finally {
      setIsLoading((prev) => ({ ...prev, health: false }));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading((prev) => ({ ...prev, chat: true }));

    try {
      const response = await aiApi.chat(userMessage);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      toast.error('Failed to get response');
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading((prev) => ({ ...prev, chat: false }));
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Financial Insights
          </h1>
          <p className="text-muted-foreground">Powered by AI to help you make smarter decisions</p>
        </div>
        <Button onClick={loadAllData} variant="outline" data-testid="refresh-insights-btn">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh All
        </Button>
      </div>

      {/* Health Score Card */}
      <Card className="card-hover bg-gradient-to-br from-primary/5 to-accent/5" data-testid="health-score-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Financial Health Score</h3>
              </div>
              {isLoading.health ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : healthScore ? (
                <>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className={`text-5xl font-bold ${getHealthScoreColor(healthScore.score)}`}>
                      {healthScore.score}
                    </span>
                    <span className="text-muted-foreground">/ 100</span>
                    <span className={`text-sm font-medium ${getHealthScoreColor(healthScore.score)}`}>
                      {getHealthScoreLabel(healthScore.score)}
                    </span>
                  </div>
                  <Progress value={healthScore.score} className="h-3 mb-4" />
                  <p className="text-sm text-muted-foreground">{healthScore.analysis}</p>
                </>
              ) : (
                <p className="text-muted-foreground">Unable to calculate health score</p>
              )}
            </div>
            {healthScore?.metrics && (
              <div className="grid grid-cols-2 gap-4 md:w-64">
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Savings Rate</p>
                  <p className="text-lg font-semibold">
                    {formatPercentage(healthScore.metrics.savingsRate)}
                  </p>
                </div>
                <div className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Net Savings</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(healthScore.metrics.netSavings)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="insights" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="tips" className="gap-2">
            <PiggyBank className="h-4 w-4" />
            Saving Tips
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Ask AI
          </TabsTrigger>
        </TabsList>

        {/* Insights Tab */}
        <TabsContent value="insights" className="mt-6">
          <Card data-testid="insights-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Personalized Insights
              </CardTitle>
              <CardDescription>
                AI-generated analysis of your spending patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.insights ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 bg-muted/30 rounded-lg">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : insights?.insights?.length > 0 ? (
                <div className="space-y-4">
                  {insights.insights.map((insight, index) => (
                    <div
                      key={index}
                      className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Lightbulb}
                  message="Add more transactions to get personalized insights"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saving Tips Tab */}
        <TabsContent value="tips" className="mt-6">
          <Card data-testid="saving-tips-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-green-500" />
                Money-Saving Tips
              </CardTitle>
              <CardDescription>
                Personalized recommendations to help you save more
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.tips ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : savingTips?.tips ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="whitespace-pre-wrap text-sm">{savingTips.tips}</p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={PiggyBank}
                  message="Add expenses to get personalized saving tips"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-6">
          <Card data-testid="ai-chat-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Chat with AI
              </CardTitle>
              <CardDescription>
                Ask questions about your finances and get instant answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ScrollArea className="h-[400px] pr-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">Start a conversation</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Ask me anything about your finances
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[
                          'How can I save more?',
                          'Where am I spending most?',
                          'What\'s my spending pattern?',
                        ].map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            onClick={() => setChatInput(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {isLoading.chat && (
                        <div className="flex justify-start">
                          <div className="bg-muted p-3 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about your finances..."
                    disabled={isLoading.chat}
                    data-testid="ai-chat-input"
                  />
                  <Button type="submit" disabled={isLoading.chat || !chatInput.trim()} data-testid="ai-chat-send">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="text-center py-12">
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
