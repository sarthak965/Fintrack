import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Tag,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useTransactionStore from '@/store/transactionStore';
import { toast } from 'sonner';

const COLORS = [
  '#4f46e5', '#0d9488', '#8b5cf6', '#f59e0b', '#ef4444',
  '#22c55e', '#3b82f6', '#ec4899', '#06b6d4', '#eab308',
];

const ICONS = [
  'utensils', 'car', 'shopping-bag', 'film', 'file-text',
  'heart-pulse', 'graduation-cap', 'plane', 'wallet', 'laptop',
  'trending-up', 'plus-circle', 'home', 'gift', 'coffee',
];

export default function CategoriesPage() {
  const { categories, fetchCategories, addCategory, deleteCategory, isLoading } = useTransactionStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'tag',
    color: COLORS[0],
    type: 'EXPENSE',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');
  const incomeCategories = categories.filter((c) => c.type === 'INCOME');

  const openCreateForm = (type = 'EXPENSE') => {
    setFormData({
      name: '',
      icon: 'tag',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      type,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const result = await addCategory(formData);
    setFormLoading(false);

    if (result.success) {
      toast.success('Category created!');
      setIsFormOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  const confirmDelete = (category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    const result = await deleteCategory(selectedCategory.id);
    if (result.success) {
      toast.success('Category deleted');
      setIsDeleteOpen(false);
      setSelectedCategory(null);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Organize your transactions</p>
        </div>
        <Button onClick={() => openCreateForm()} data-testid="add-category-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories Tabs */}
      <Tabs defaultValue="expense" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="expense" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Expense ({expenseCategories.length})
          </TabsTrigger>
          <TabsTrigger value="income" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Income ({incomeCategories.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="mt-6">
          {isLoading ? (
            <CategoriesSkeleton />
          ) : expenseCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {expenseCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onDelete={() => confirmDelete(category)}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="expense" onCreate={() => openCreateForm('EXPENSE')} />
          )}
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          {isLoading ? (
            <CategoriesSkeleton />
          ) : incomeCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {incomeCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onDelete={() => confirmDelete(category)}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="income" onCreate={() => openCreateForm('INCOME')} />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>Add a new category to organize your transactions</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Groceries"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                data-testid="category-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger data-testid="category-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg transition-all ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} data-testid="category-submit-btn">
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the "{selectedCategory?.name}" category. Existing transactions with this category will not be affected.
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

function CategoryCard({ category, onDelete }) {
  return (
    <Card className="card-hover group" data-testid={`category-${category.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <Tag className="h-5 w-5" style={{ color: category.color }} />
            </div>
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{category.type.toLowerCase()}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ type, onCreate }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        {type === 'expense' ? (
          <TrendingDown className="h-8 w-8 text-muted-foreground" />
        ) : (
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="text-lg font-medium mb-2">No {type} categories</h3>
      <p className="text-muted-foreground mb-4">Create your first {type} category to get started</p>
      <Button onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" />
        Add {type} category
      </Button>
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
