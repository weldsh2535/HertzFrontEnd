import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import FeedScreen from '../components/Feed/FeedScreen';
import CreatePostScreen from '../components/Post/CreatePostScreen';
import ProfileScreen from '../components/Profile/ProfileScreen';
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
        component={FeedScreen}
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
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}