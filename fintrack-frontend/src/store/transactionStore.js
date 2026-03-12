import { create } from 'zustand';
import { transactionApi, categoryApi, analyticsApi } from '../api';

const useTransactionStore = create((set, get) => ({
  transactions: [],
  categories: [],
  analytics: null,
  isLoading: false,
  error: null,
  filters: {
    type: null,
    category: null,
    search: '',
    startDate: null,
    endDate: null,
  },

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),

  clearFilters: () => set({
    filters: {
      type: null,
      category: null,
      search: '',
      startDate: null,
      endDate: null,
    }
  }),

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await transactionApi.getAll(params);
      set({ transactions: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addTransaction: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await transactionApi.create(data);
      set((state) => ({
        transactions: [response.data, ...state.transactions],
        isLoading: false,
      }));
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to add transaction';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  updateTransaction: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await transactionApi.update(id, data);
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? response.data : t
        ),
        isLoading: false,
      }));
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to update transaction';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await transactionApi.delete(id);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to delete transaction';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  fetchCategories: async () => {
    try {
      const response = await categoryApi.getAll();
      set({ categories: response.data });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  },

  addCategory: async (data) => {
    try {
      const response = await categoryApi.create(data);
      set((state) => ({
        categories: [...state.categories, response.data],
      }));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  deleteCategory: async (id) => {
    try {
      await categoryApi.delete(id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchAnalytics: async () => {
    try {
      const response = await analyticsApi.getSummary();
      set({ analytics: response.data });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useTransactionStore;
