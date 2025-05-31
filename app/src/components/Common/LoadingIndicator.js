import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../utils/styles';

export default function LoadingIndicator({ color }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color || colors.golden} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});