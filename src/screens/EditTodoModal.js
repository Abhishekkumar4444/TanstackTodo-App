'use client';

import {useState, useEffect} from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useMutation, useQueryClient, useQuery} from '@tanstack/react-query';
import {todoApi} from '../services/todoApi';

const EditTodoModal = ({visible, todoId, onClose}) => {
  const [title, setTitle] = useState('');
  const queryClient = useQueryClient();

  // Query to fetch the todo details
  const {
    data: todo,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['todo', todoId],
    queryFn: () => todoApi.getTodoById(todoId),
    // Only fetch when modal is visible and we have a todoId
    enabled: visible && !!todoId,
    // Use the cached data if available
    initialData: () => {
      // Try to get the todo from the todos list cache
      const todosData = queryClient.getQueryData(['todos']);
      if (!todosData) return undefined;

      // Find the todo in the cached data
      for (const page of todosData.pages) {
        const foundTodo = page.todos.find(t => t.id === todoId);
        if (foundTodo) return foundTodo;
      }
      return undefined;
    },
  });

  // Update the title when the todo data is loaded
  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
    }
  }, [todo]);

  // Update todo mutation
  const updateMutation = useMutation({
    mutationFn: updatedTodo => todoApi.updateTodo(updatedTodo),
    // Optimistic update
    onMutate: async updatedTodo => {
      await queryClient.cancelQueries({queryKey: ['todos']});
      await queryClient.cancelQueries({queryKey: ['todo', todoId]});

      // Snapshot the previous values
      const previousTodos = queryClient.getQueryData(['todos']);
      const previousTodo = queryClient.getQueryData(['todo', todoId]);

      // Optimistically update the todos list
      queryClient.setQueryData(['todos'], old => {
        if (!old) return {pages: []};

        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            todos: page.todos.map(t =>
              t.id === updatedTodo.id ? {...t, ...updatedTodo} : t,
            ),
          })),
        };
      });

      // Optimistically update the individual todo
      queryClient.setQueryData(['todo', todoId], old => {
        return {...old, ...updatedTodo};
      });

      return {previousTodos, previousTodo};
    },
    onError: (err, updatedTodo, context) => {
      queryClient.setQueryData(['todos'], context.previousTodos);
      queryClient.setQueryData(['todo', todoId], context.previousTodo);
      Alert.alert('Error', 'Failed to update todo');
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['todos']});
      queryClient.invalidateQueries({queryKey: ['todo', todoId]});
    },
    onSuccess: () => {
      onClose();
    },
  });

  const handleUpdate = () => {
    if (title.trim() === '') {
      Alert.alert('Error', 'Todo title cannot be empty');
      return;
    }

    if (todo) {
      updateMutation.mutate({
        ...todo,
        title: title.trim(),
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Edit Todo</Text>

          {isLoading ? (
            <ActivityIndicator size="small" color="#0066cc" />
          ) : isError ? (
            <Text style={styles.errorText}>Error loading todo</Text>
          ) : (
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Todo title"
              autoFocus
            />
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={updateMutation.isPending}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.updateButton,
                (updateMutation.isPending || title.trim() === '') &&
                  styles.buttonDisabled,
              ]}
              onPress={handleUpdate}
              disabled={updateMutation.isPending || title.trim() === ''}>
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.updateButtonText}>Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  updateButton: {
    backgroundColor: '#0066cc',
  },
  buttonDisabled: {
    backgroundColor: '#99ccff',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  updateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
});

export default EditTodoModal;
