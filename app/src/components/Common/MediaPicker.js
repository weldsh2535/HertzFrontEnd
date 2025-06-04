import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../utils/styles';

const MediaPicker = ({ 
  onPickImage, 
  onPickVideo, 
  onOpenCamera, 
  onOpenVideoCamera 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={onPickImage}>
          <MaterialIcons name="photo-library" size={24} color={colors.golden} />
          <Text style={styles.buttonText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onPickVideo}>
          <MaterialIcons name="video-library" size={24} color={colors.golden} />
          <Text style={styles.buttonText}>Video Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.golden,
    width: '48%',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  buttonText: {
    color: colors.golden,
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MediaPicker;