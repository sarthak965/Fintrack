import { useEffect, useState } from 'react';
import {
  Plus,
  Target,
  Trash2,
  Pencil,
  Trophy,
  Calendar,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import useGoalStore from '@/store/goalStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function GoalsPage() {
  const { goals, fetchGoals, addGoal, updateGoal, deleteGoal, isLoading } = useGoalStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: null,
    category: '',
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const openCreateForm = () => {
    setSelectedGoal(null);
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '0',
      deadline: null,
      category: '',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (goal) => {
    setSelectedGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline,
      category: goal.category || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const data = {
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount || 0),
      deadline: formData.deadline,
      category: formData.category || null,
    };

    let result;
    if (selectedGoal) {
      result = await updateGoal(selectedGoal.id, data);
    } else {
      result = await addGoal(data);
    }

    setFormLoading(false);

    if (result.success) {
      toast.success(selectedGoal ? 'Goal updated!' : 'Goal created!');
      setIsFormOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  const confirmDelete = (goal) => {
    setSelectedGoal(goal);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedGoal) return;

    const result = await deleteGoal(selectedGoal.id);
    if (result.success) {
      toast.success('Goal deleted');
      setIsDeleteOpen(false);
      setSelectedGoal(null);
    } else {
      toast.error(result.error);
    }
  };

  const completedGoals = goals.filter((g) => g.progress >= 100);
  const activeGoals = goals.filter((g) => g.progress < 100);
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financial Goals</h1>
          <p className="text-muted-foreground">Track your savings and targets</p>
        </div>
        <Button onClick={openCreateForm} data-testid="add-goal-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Goals</p>
                <p className="text-2xl font-bold">{goals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Saved</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSaved)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Trophy className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedGoals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Active Goals</h2>
        {isLoading ? (
          <GoalsSkeleton />
        ) : activeGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => openEditForm(goal)}
                onDelete={() => confirmDelete(goal)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No active goals</h3>
              <p className="text-muted-foreground mb-4">Create your first financial goal to start tracking</p>
              <Button onClick={openCreateForm}>
                <Plus className="mr-2 h-4 w-4" />
                Create Goal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Completed Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => openEditForm(goal)}
                onDelete={() => confirmDelete(goal)}
                completed
              />
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{selectedGoal ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
            <DialogDescription>
              {selectedGoal ? 'Update your financial goal' : 'Set a new financial target'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                placeholder="e.g., Emergency Fund"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                data-testid="goal-name-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount (₹)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  min="0"
                  placeholder="100000"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetAmount: e.target.value }))}
                  required
                  data-testid="goal-target-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentAmount">Current Savings (₹)</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currentAmount: e.target.value }))}
                  data-testid="goal-current-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.deadline ? format(new Date(formData.deadline), 'PPP') : 'Pick a deadline'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.deadline ? new Date(formData.deadline) : undefined}
                    onSelect={(date) =>
                      setFormData((prev) => ({
                        ...prev,
                        deadline: date?.toISOString() || null,
                      }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                placeholder="e.g., Savings, Investment"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                data-testid="goal-category-input"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} data-testid="goal-submit-btn">
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedGoal ? 'Update' : 'Create'} Goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{selectedGoal?.name}" goal. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GoalCard({ goal, onEdit, onDelete, completed }) {
  const progressColor = completed
    ? 'bg-green-500'
    : goal.progress >= 75
    ? 'bg-primary'
    : goal.progress >= 50
    ? 'bg-yellow-500'
    : 'bg-red-500';

  return (
    <Card className={`card-hover ${completed ? 'border-green-500/30' : ''}`} data-testid={`goal-${goal.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${completed ? 'bg-green-500/20' : 'bg-primary/10'}`}>
              {completed ? (
                <Trophy className="h-5 w-5 text-green-500" />
              ) : (
                <Target className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{goal.name}</h3>
              {goal.category && (
                <p className="text-xs text-muted-foreground">{goal.category}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{goal.progress.toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(goal.progress, 100)} className="h-2" />
          <div className="flex justify-between text-sm">
            <span>{formatCurrency(goal.currentAmount)}</span>
            <span className="text-muted-foreground">of {formatCurrency(goal.targetAmount)}</span>
          </div>
          {goal.deadline && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
              <Calendar className="h-3 w-3" />
              <span>Deadline: {formatDate(goal.deadline)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GoalsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-2 w-full mb-2" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
