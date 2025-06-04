import React from 'react';
import { ActivityIndicator } from 'react-native';
import { colors } from '../../utils/styles';

const LoadingIndicator = ({ color = colors.golden, size = 'large' }) => {
  return <ActivityIndicator color={color} size={size} />;
};

export default LoadingIndicator;