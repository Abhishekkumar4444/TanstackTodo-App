'use client';

import {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // ✅ Vector Icon import
import {useMutation, useQueryClient} from '@tanstack/react-query';
import EditTodoModal from '../screens/EditTodoModal';
import {todoApi} from '../services/todoApi';

const TodoItem = ({todo}) => {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const queryClient = useQueryClient();

  // ✅ Toggle complete status mutation
  const toggleMutation = useMutation({
    mutationFn: id => todoApi.toggleTodoStatus(id),
    onMutate: async id => {
      await queryClient.cancelQueries({queryKey: ['todos']});
      const previousTodos = queryClient.getQueryData(['todos']);

      queryClient.setQueryData(['todos'], old => ({
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          todos: page.todos.map(t =>
            t.id === id ? {...t, completed: !t.completed} : t,
          ),
        })),
      }));

      return {previousTodos};
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['todos'], context.previousTodos);
      Alert.alert('Error', 'Failed to update todo status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['todos']});
    },
  });

  // ✅ Delete todo mutation
  const deleteMutation = useMutation({
    mutationFn: id => todoApi.deleteTodo(id),
    onMutate: async id => {
      await queryClient.cancelQueries({queryKey: ['todos']});
      const previousTodos = queryClient.getQueryData(['todos']);

      queryClient.setQueryData(['todos'], old => ({
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          todos: page.todos.filter(t => t.id !== id),
        })),
      }));

      return {previousTodos};
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['todos'], context.previousTodos);
      Alert.alert('Error', 'Failed to delete todo');
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['todos']});
    },
  });

  const handleToggle = () => {
    toggleMutation.mutate(todo.id);
  };

  const handleDelete = () => {
    Alert.alert('Delete Todo', `Delete "${todo.title}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        onPress: () => deleteMutation.mutate(todo.id),
        style: 'destructive',
      },
    ]);
  };

  const handleEdit = () => {
    setIsEditModalVisible(true);
  };

  return (
    <>
      <View
        style={[styles.container, todo.completed && styles.completedContainer]}>
        {/* ✅ Checkbox with FontAwesome */}
        <TouchableOpacity
          style={styles.checkbox}
          onPress={handleToggle}
          disabled={toggleMutation.isPending}>
          <Icon
            name={todo.completed ? 'check-square' : 'square-o'}
            size={24}
            color={todo.completed ? '#0066cc' : '#ccc'}
          />
        </TouchableOpacity>

        {/* Todo Title */}
        <Text
          style={[styles.title, todo.completed && styles.completedTitle]}
          numberOfLines={2}>
          {todo.title}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            disabled={deleteMutation.isPending}>
            <Text style={styles.deleteButtonText}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <EditTodoModal
        visible={isEditModalVisible}
        todoId={todo.id}
        onClose={() => setIsEditModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  completedContainer: {
    backgroundColor: '#f0f0f0',
  },
  checkbox: {
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: '#d32f2f',
  },
});

export default TodoItem;
