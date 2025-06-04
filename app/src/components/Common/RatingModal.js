import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../utils/styles';

const RatingModal = ({ 
  visible, 
  onClose, 
  onRate, 
  currentRating = 0,
  isLoading = false 
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>Rate this post</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => onRate(star)}
                disabled={isLoading}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= currentRating ? "star" : "star-outline"}
                  size={32}
                  color={star <= currentRating ? colors.golden : colors.lightText}
                />
              </TouchableOpacity>
            ))}
          </View>
          {isLoading ? (
            <ActivityIndicator color={colors.golden} />
          ) : (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  ratingContainer: {
    backgroundColor: colors.darkBackground,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  ratingTitle: {
    color: colors.lightText,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 5,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelButtonText: {
    color: colors.lightText,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RatingModal; 