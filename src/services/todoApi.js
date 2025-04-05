// This is a mock API service that simulates backend calls
// In a real app, you would replace these with actual API calls

import {delay} from '../utils/delay';

// Initial todos for demo
let todos = [
  {id: '1', title: 'Learn React Native', completed: true},
  {id: '2', title: 'Learn TanStack Query', completed: false},
  {id: '3', title: 'Build a todo app', completed: false},
];

export const todoApi = {
  // Get all todos with optional pagination
  getTodos: async ({pageParam = 0, pageSize = 10}) => {
    await delay(500); // Simulate network delay
    const start = pageParam * pageSize;
    const end = start + pageSize;
    const paginatedTodos = todos.slice(start, end);

    return {
      todos: paginatedTodos,
      nextPage: todos.length > end ? pageParam + 1 : undefined,
      totalCount: todos.length,
    };
  },

  // Get a single todo by ID
  getTodoById: async id => {
    await delay(300);
    const todo = todos.find(todo => todo.id === id);
    if (!todo) throw new Error('Todo not found');
    return todo;
  },

  // Create a new todo
  createTodo: async newTodo => {
    await delay(500);
    const todo = {
      id: Date.now().toString(),
      title: newTodo.title,
      completed: false,
    };
    todos = [todo, ...todos];
    return todo;
  },

  // Update an existing todo
  updateTodo: async updatedTodo => {
    await delay(500);
    const index = todos.findIndex(todo => todo.id === updatedTodo.id);
    if (index === -1) throw new Error('Todo not found');

    todos = [...todos.slice(0, index), updatedTodo, ...todos.slice(index + 1)];

    return updatedTodo;
  },

  // Delete a todo
  deleteTodo: async id => {
    await delay(500);
    const index = todos.findIndex(todo => todo.id === id);
    if (index === -1) throw new Error('Todo not found');

    todos = [...todos.slice(0, index), ...todos.slice(index + 1)];
    return {id};
  },

  // Toggle todo completion status
  toggleTodoStatus: async id => {
    await delay(300);
    const index = todos.findIndex(todo => todo.id === id);
    if (index === -1) throw new Error('Todo not found');

    const updatedTodo = {
      ...todos[index],
      completed: !todos[index].completed,
    };

    todos = [...todos.slice(0, index), updatedTodo, ...todos.slice(index + 1)];

    return updatedTodo;
  },
};
