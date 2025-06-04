import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../utils/styles';

const LoadingComments = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingCommentsPlaceholder}>
      {[1, 2, 3].map((_, index) => (
        <View key={index} style={styles.loadingCommentItem}>
          <View style={styles.loadingAvatar} />
          <View style={styles.loadingContent}>
            <View style={styles.loadingUsername} />
            <View style={styles.loadingText1} />
            <View style={styles.loadingText2} />
          </View>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  loadingCommentsPlaceholder: {
    width: '100%',
    paddingHorizontal: 16,
  },
  loadingCommentItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingVertical: 12,
  },
  loadingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 12,
  },
  loadingContent: {
    flex: 1,
  },
  loadingUsername: {
    width: '30%',
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 7,
    marginBottom: 8,
  },
  loadingText1: {
    width: '80%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    marginBottom: 6,
  },
  loadingText2: {
    width: '60%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
});

export default LoadingComments; 