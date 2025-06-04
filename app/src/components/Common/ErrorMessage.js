import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/styles';

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.error,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  text: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ErrorMessage;