import {useQuery, useQueryClient} from '@tanstack/react-query';
import {todoApi} from '../services/todoApi';

// Custom hook to demonstrate advanced TanStack Query patterns
export const useTodoQuery = (options = {}) => {
  const queryClient = useQueryClient();

  // Default query options
  const defaultOptions = {
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  };

  // Get all todos
  const getAllTodos = () => {
    return useQuery({
      queryKey: ['todos'],
      queryFn: () => todoApi.getTodos({}),
      ...defaultOptions,
    });
  };

  // Get a single todo by ID
  const getTodoById = id => {
    return useQuery({
      queryKey: ['todo', id],
      queryFn: () => todoApi.getTodoById(id),
      enabled: !!id, // Only run the query if we have an ID
      ...defaultOptions,
    });
  };

  // Prefetch a todo by ID (useful for improving UX)
  const prefetchTodo = async id => {
    if (!id) return;

    await queryClient.prefetchQuery({
      queryKey: ['todo', id],
      queryFn: () => todoApi.getTodoById(id),
      ...defaultOptions,
    });
  };

  // Get completed todos
  const getCompletedTodos = () => {
    return useQuery({
      queryKey: ['todos', 'completed'],
      queryFn: async () => {
        const result = await todoApi.getTodos({});
        return {
          ...result,
          todos: result.todos.filter(todo => todo.completed),
        };
      },
      ...defaultOptions,
    });
  };

  // Get incomplete todos
  const getIncompleteTodos = () => {
    return useQuery({
      queryKey: ['todos', 'incomplete'],
      queryFn: async () => {
        const result = await todoApi.getTodos({});
        return {
          ...result,
          todos: result.todos.filter(todo => !todo.completed),
        };
      },
      ...defaultOptions,
    });
  };

  return {
    getAllTodos,
    getTodoById,
    prefetchTodo,
    getCompletedTodos,
    getIncompleteTodos,
  };
};
