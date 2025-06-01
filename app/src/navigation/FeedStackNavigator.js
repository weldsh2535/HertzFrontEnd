// components/Navigation/FeedStackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import FeedScreen from '../components/Feed/FeedScreen';
import CommentsScreen from '../components/Post/CommentsScreen';
import { colors } from '../utils/styles'; // Make sure this path is correct

const Stack = createStackNavigator();


export default function FeedStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="FeedMain" component={FeedScreen} />
      <Stack.Screen name="Comments" component={CommentsScreen} />
    </Stack.Navigator>
  );
}