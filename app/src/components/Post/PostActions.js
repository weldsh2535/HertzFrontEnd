import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../utils/styles';
import StarRating from '../Common/StarRating';

export default function PostActions({ item, onLike, onRate, liked, rating, likeCount }) {
  return (
    <View style={styles.actionsContainer}>
      <View style={styles.leftActions}>
        <TouchableOpacity onPress={onLike} style={styles.actionButton}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={30}
            color={liked ? colors.golden : colors.lightText}
          />
          <Text style={styles.actionText}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name="comment" size={28} color={colors.lightText} />
          <Text style={styles.actionText}>{item.commentCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="share" size={28} color={colors.lightText} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ratingContainer}>
        <StarRating 
          rating={rating} 
          onRate={onRate} 
          starSize={24}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    alignItems: 'center',
  },
  leftActions: {
    position: 'absolute',
    left: 20,
    bottom: 100,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: colors.lightText,
    fontSize: 12,
    marginTop: 5,
  },
  ratingContainer: {
    marginBottom: 20,
  },
});