import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../utils/styles';

export default function MediaPicker({ onPickImage, onPickVideo }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPickImage}>
        <Ionicons name="image" size={24} color={colors.golden} />
        <Text style={styles.buttonText}>Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onPickVideo}>
        <MaterialIcons name="video-library" size={24} color={colors.golden} />
        <Text style={styles.buttonText}>Video</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.golden,
    width: '45%',
  },
  buttonText: {
    color: colors.golden,
    marginTop: 5,
  },
});