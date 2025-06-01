// components/Navigation/MainTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import FeedStackNavigator from './FeedStackNavigator'; // Updated import
import CreatePostScreen from '../components/Post/CreatePostScreen';
import ProfileStackNavigator from '../components/Profile/ProfileStackNavigator';
import { colors } from '../utils/styles';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.darkBackground,
          borderTopColor: colors.golden,
        },
        tabBarActiveTintColor: colors.golden,
        tabBarInactiveTintColor: colors.lightText,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedStackNavigator} // Updated component
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreatePostScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
          title: 'Profile'
        }}
      />
    </Tab.Navigator>
  );
}