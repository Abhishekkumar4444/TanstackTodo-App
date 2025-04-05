import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import TodoList from '../screens/TodoList';
import EditTodoModal from '../screens/EditTodoModal';

const RootNavigation = () => {
  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Home" component={TodoList} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigation;
