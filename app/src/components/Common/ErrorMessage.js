import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/styles';

export default function ErrorMessage({ message }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkerBackground,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.error,
  },
  text: {
    color: colors.error,
    textAlign: 'center',
  },
});