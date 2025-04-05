import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {todoApi} from '../services/todoApi';

const AddTodoForm = () => {
  const [title, setTitle] = useState('');
  const queryClient = useQueryClient();

  // Create todo mutation
  const createMutation = useMutation({
    mutationFn: newTodo => todoApi.createTodo(newTodo),
    // When mutate is called:
    onMutate: async newTodo => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({queryKey: ['todos']});

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData(['todos']);

      // Optimistically update to the new value
      queryClient.setQueryData(['todos'], old => {
        if (!old) return {pages: []};

        // Create a temporary ID for the optimistic update
        const tempTodo = {
          id: 'temp-' + Date.now(),
          title: newTodo.title,
          completed: false,
        };

        // Add to the first page
        const newPages = [...old.pages];
        if (newPages.length > 0) {
          newPages[0] = {
            ...newPages[0],
            todos: [tempTodo, ...newPages[0].todos],
            totalCount: (newPages[0].totalCount || 0) + 1,
          };
        }

        return {
          ...old,
          pages: newPages,
        };
      });

      // Return a context with the previous and new todo
      return {previousTodos, newTodo};
    },
    // If the mutation fails, use the context we returned above
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['todos'], context.previousTodos);
      Alert.alert('Error', 'Failed to create todo');
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: ['todos']});
    },
    // When the mutation succeeds, update the input
    onSuccess: () => {
      setTitle('');
    },
  });

  const handleSubmit = () => {
    if (title.trim() === '') {
      Alert.alert('Error', 'Todo title cannot be empty');
      return;
    }

    createMutation.mutate({title: title.trim()});
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Add a new todo..."
        value={title}
        placeholderTextColor={'#999'}
        onChangeText={setTitle}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        autoCapitalize="sentences"
        autoCorrect={true}
        editable={!createMutation.isPending}
      />
      <TouchableOpacity
        style={[
          styles.addButton,
          createMutation.isPending && styles.addButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={createMutation.isPending || title.trim() === ''}>
        {createMutation.isPending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.addButtonText}>Add</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    fontSize: 16,
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: '#0066cc',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#99ccff',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddTodoForm;
