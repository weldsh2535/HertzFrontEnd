import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../components/Auth/LoginScreen';
import SignupScreen from '../components/Auth/SignupScreen';
import CommentsScreen from '../components/Post/CommentsScreen';
const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Comments" 
        component={CommentsScreen} 
        options={({ route }) => ({ 
          title: `Comments (${route.params.commentCount || 0})` 
        })}
      />
    </Stack.Navigator>
  );
}