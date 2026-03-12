import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import useTransactionStore from '@/store/transactionStore';
import { formatCurrency, formatDate, toDateString } from '@/utils/formatters';
import { toast } from 'sonner';
import { aiApi } from '@/api';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
  const {
    transactions,
    categories,
    fetchTransactions,
    fetchCategories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    filters,
    setFilters,
    clearFilters,
    isLoading,
  } = useTransactionStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formLoading, setFormLoading] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    type: 'EXPENSE',
    transactionDate: new Date().toISOString(),
    merchantName: '',
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setFilters({ search: searchQuery });
      fetchTransactions();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value === 'all' ? null : value });
    setCurrentPage(1);
    fetchTransactions();
  };

  const openCreateForm = () => {
    setSelectedTransaction(null);
    setFormData({
      amount: '',
      category: '',
      description: '',
      type: 'EXPENSE',
      transactionDate: new Date().toISOString(),
      merchantName: '',
    });
    setSuggestedCategory(null);
    setIsFormOpen(true);
  };

  const openEditForm = (transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      type: transaction.type,
      transactionDate: transaction.transactionDate,
      merchantName: transaction.merchantName || '',
    });
    setSuggestedCategory(null);
    setIsFormOpen(true);
  };

  const handleDescriptionChange = async (description) => {
    setFormData((prev) => ({ ...prev, description }));
    
    // Smart category detection
    if (description.length > 3 && !formData.category) {
      try {
        const response = await aiApi.categorize(description);
        setSuggestedCategory(response.data.suggestedCategory);
      } catch (error) {
        console.error('Category suggestion failed:', error);
      }
    }
  };

  const applySuggestedCategory = () => {
    if (suggestedCategory) {
      setFormData((prev) => ({ ...prev, category: suggestedCategory }));
      setSuggestedCategory(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const data = {
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      type: formData.type,
      transactionDate: formData.transactionDate,
      merchantName: formData.merchantName || null,
    };

    let result;
    if (selectedTransaction) {
      result = await updateTransaction(selectedTransaction.id, data);
    } else {
      result = await addTransaction(data);
    }

    setFormLoading(false);

    if (result.success) {
      toast.success(selectedTransaction ? 'Transaction updated!' : 'Transaction added!');
      setIsFormOpen(false);
      fetchTransactions();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;
    
    const result = await deleteTransaction(selectedTransaction.id);
    if (result.success) {
      toast.success('Transaction deleted');
      setIsDeleteOpen(false);
      setSelectedTransaction(null);
    } else {
      toast.error(result.error);
    }
  };

  const confirmDelete = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteOpen(true);
  };

  // Pagination
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');
  const incomeCategories = categories.filter((c) => c.type === 'INCOME');
  const currentCategories = formData.type === 'INCOME' ? incomeCategories : expenseCategories;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage your income and expenses</p>
        </div>
        <Button onClick={openCreateForm} data-testid="add-transaction-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger className="w-full sm:w-[150px]" data-testid="type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filters.type || filters.category || filters.search) && (
              <Button
                variant="ghost"
                onClick={() => {
                  clearFilters();
                  setSearchQuery('');
                  fetchTransactions();
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card data-testid="transactions-table">
        <CardContent className="p-0">
          {isLoading ? (
            <TransactionsSkeleton />
          ) : paginatedTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Description</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <span className="text-sm">{formatDate(transaction.transactionDate)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            transaction.type === 'INCOME' ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {transaction.type === 'INCOME' ? (
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            {transaction.merchantName && (
                              <p className="text-xs text-muted-foreground">{transaction.merchantName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{transaction.category}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={transaction.type === 'INCOME' ? 'default' : 'destructive'}>
                          {transaction.type}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-semibold tabular-nums ${
                          transaction.type === 'INCOME' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`transaction-actions-${transaction.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditForm(transaction)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDelete(transaction)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No transactions found</p>
              <Button onClick={openCreateForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, transactions.length)} of {transactions.length} transactions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </DialogTitle>
            <DialogDescription>
              {selectedTransaction
                ? 'Update your transaction details'
                : 'Enter the details of your transaction'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value, category: '' }))}
                >
                  <SelectTrigger data-testid="transaction-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  data-testid="transaction-amount-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Starbucks coffee"
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                required
                data-testid="transaction-description-input"
              />
              {suggestedCategory && (
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    AI suggests: <strong>{suggestedCategory}</strong>
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={applySuggestedCategory}
                    data-testid="apply-suggested-category"
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger data-testid="transaction-category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.transactionDate
                        ? format(new Date(formData.transactionDate), 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={new Date(formData.transactionDate)}
                      onSelect={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          transactionDate: date?.toISOString() || new Date().toISOString(),
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="merchantName">Merchant (Optional)</Label>
              <Input
                id="merchantName"
                placeholder="e.g., Starbucks"
                value={formData.merchantName}
                onChange={(e) => setFormData((prev) => ({ ...prev, merchantName: e.target.value }))}
                data-testid="transaction-merchant-input"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} data-testid="transaction-submit-btn">
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedTransaction ? 'Update' : 'Add'} Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the transaction.
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

function TransactionsSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}
