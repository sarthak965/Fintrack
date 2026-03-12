import { create } from 'zustand';
import { goalApi } from '../api';

const useGoalStore = create((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await goalApi.getAll();
      set({ goals: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  addGoal: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await goalApi.create(data);
      set((state) => ({
        goals: [...state.goals, response.data],
        isLoading: false,
      }));
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to add goal';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  updateGoal: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await goalApi.update(id, data);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? response.data : g)),
        isLoading: false,
      }));
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to update goal';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  deleteGoal: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await goalApi.delete(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to delete goal';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  clearError: () => set({ error: null }),
}));

export default useGoalStore;
