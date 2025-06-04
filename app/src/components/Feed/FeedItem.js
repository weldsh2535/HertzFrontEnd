import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  TouchableOpacity,
  Platform,
  Share
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@apollo/client';
import { LIKE_POST, RATE_POST } from '../../graphql/mutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../utils/styles';
import { formatTimestamp } from '../../utils/dateUtils';
import RatingModal from '../Common/RatingModal';
import { gql } from '@apollo/client';

const { height, width } = Dimensions.get('window');

const LIKE_POST_WITH_USER = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likeCount
      likes {
        id
      }
    }
  }
`;

const FeedItem = ({ item, isActive, index }) => {
  const [liked, setLiked] = useState(item.liked || false);
  const [likeCount, setLikeCount] = useState(item.likeCount || 0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(!isActive);
  const [showControls, setShowControls] = useState(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const [ratePost] = useMutation(RATE_POST, {
    onError: (err) => {
      console.error('Rating error:', err);
      setError(err.message);
      setIsRating(false);
    },
    onCompleted: (data) => {
      if (data?.ratePost?.ratings) {
        const ratings = data.ratePost.ratings;
        const sum = ratings.reduce((acc, r) => acc + r.value, 0);
        setAverageRating(sum / ratings.length);
      }
      setIsRating(false);
      setShowRatingModal(false);
    },
    update: (cache, { data: { ratePost } }) => {
      cache.modify({
        id: `Post:${item.id}`,
        fields: {
          ratings: () => ratePost.ratings
        }
      });
    }
  });

  // Set initial rating state
  useEffect(() => {
    if (item.ratings && item.ratings.length > 0) {
      setAverageRating(calculateAverageRating(item.ratings));
    
      setCurrentRating(0); // Reset to default state
    }
  }, [item.ratings]);

  // Calculate average rating from ratings array
  const calculateAverageRating = (ratings = []) => {
    if (!ratings.length) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.value, 0);
    return sum / ratings.length;
  };

  const handleRating = async (rating) => {
    try {
      setIsRating(true);
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        setError('Please log in to rate posts');
        return;
      }

      const userData = JSON.parse(userDataString);
      if (!userData || !userData.id) {
        setError('User data is invalid');
        return;
      }

      await ratePost({
        variables: {
          postId: item.id,
          rating
        },
        optimisticResponse: {
          __typename: 'Mutation',
          ratePost: {
            __typename: 'Post',
            id: item.id,
            ratings: [
              ...(item.ratings || []).filter(r => r.user.id !== userData.id),
              {
                __typename: 'Rating',
                user: {
                  __typename: 'User',
                  id: userData.id,
                  username: userData.username || 'You'
                },
                value: rating
              }
            ]
          }
        }
      });

      setCurrentRating(rating);
    } catch (error) {
      console.error('Error rating post:', error);
      if (error instanceof SyntaxError) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to rate post. Please try again.');
      }
      setIsRating(false);
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: item.caption,
        url: item.mediaUrl,
        title: 'Check out this post!'
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setError('Failed to share post');
    }
  };

  // Update your useEffect for video handling:
  useEffect(() => {
    const handleVideoPlayback = async () => {
      if (isActive) {
        setPaused(false);
        try {
          if (videoRef.current) {
            await videoRef.current.setPositionAsync(0);
            await videoRef.current.playAsync();
          }
        } catch (error) {
          console.error('Video playback error:', error);
        }
      } else {
        setPaused(true);
        setShowControls(false);
        try {
          if (videoRef.current) {
            await videoRef.current.pauseAsync();
          }
        } catch (error) {
          console.error('Video pause error:', error);
        }
      }
    };

    handleVideoPlayback();
  }, [isActive]);

  // Update your toggleControls function:
  const toggleControls = () => {
    Animated.timing(opacityAnim, {
      toValue: showControls ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setShowControls(!showControls);
  };

  const [likePost] = useMutation(LIKE_POST_WITH_USER, {
    onError: (err) => {
      console.error('Like error:', err);
      setError(err.message);
      // Revert optimistic update
      setLiked(!liked);
      setLikeCount(likeCount);
    }
  });

  const handleLike = async () => {
    const newLiked = !liked;
    const newLikeCount = newLiked ? likeCount + 1 : likeCount - 1;

    try {
      // Get current user data
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        setError('Please log in to like posts');
        return;
      }
      const userData = JSON.parse(userDataString);

      // Optimistic update
      setLiked(newLiked);
      setLikeCount(newLikeCount);

      await likePost({
        variables: { postId: item.id },
        optimisticResponse: {
          likePost: {
            __typename: 'Post',
            id: item.id,
            likeCount: newLikeCount,
            likes: newLiked 
              ? [...(item.likes || []), { 
                  __typename: 'User',
                  id: userData.id
                }]
              : (item.likes || []).filter(like => like.id !== userData.id)
          }
        },
        update: (cache, { data: { likePost } }) => {
          cache.modify({
            id: `Post:${item.id}`,
            fields: {
              likeCount: () => likePost.likeCount,
              likes: () => likePost.likes
            }
          });
        }
      });
    } catch (err) {
      console.error('Like failed:', err);
      // Revert optimistic update
      setLiked(!newLiked);
      setLikeCount(newLikeCount);
      setError(err.message || 'Failed to like post');
    }
  };

  const handleCommentPress = () => {
    navigation.navigate('Comments', { 
      postId: item.id,
      commentCount: item.commentCount || 0
    });
  };

  return (
    <View style={styles.container}>
      {item.mediaType === 'video' ? (
        <TouchableWithoutFeedback onPress={toggleControls}>
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: item.mediaUrl }}
              style={styles.video}
              shouldPlay={isActive && !paused}
              isLooping
              resizeMode="cover"
              useNativeControls={false}
              onError={(error) => console.error('Video error:', error)}
              onReadyForDisplay={() => {
                if (isActive && videoRef.current) {
                  videoRef.current.playAsync().catch(console.error);
                }
              }}
            />

            {/* Custom Controls Overlay */}
            <Animated.View style={[styles.controlsOverlay, { opacity: opacityAnim }]}>
              <TouchableWithoutFeedback onPress={() => setPaused(!paused)}>
                <View style={styles.playButton}>
                  <Ionicons
                    name={paused ? "play" : "pause"}
                    size={48}
                    color="white"
                  />
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      ) : (
        <Image source={{ uri: item.mediaUrl }} style={styles.media} resizeMode="cover" />
      )}

      {/* User Info and Caption Overlay */}
      <View style={styles.overlay}>
        {/* User Info */}
        <View style={styles.userContainer}>
          <TouchableOpacity style={styles.userInfo}>
            <Image 
              source={{ uri: item.user.avatar }} 
              style={styles.avatar}
            />
            <View style={styles.userTextContainer}>
              <Text style={styles.username}>@{item.user.username}</Text>
              <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Caption */}
        <Text style={styles.caption} numberOfLines={3}>
          {item.caption}
        </Text>
      </View>

      {/* Right Sidebar Actions */}
      <View style={styles.sidebar}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <Animated.View>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={32}
              color={liked ? "red" : "white"}
            />
          </Animated.View>
          <Text style={styles.actionText}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleCommentPress} 
          style={styles.actionButton}
        >
          <Ionicons name="chatbubble-outline" size={32} color="white" />
          <Text style={styles.actionText}>{item.commentCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowRatingModal(true)}
        >
          <Ionicons 
            name={currentRating > 0 ? "star" : "star-outline"} 
            size={32} 
            color={currentRating > 0 ? colors.golden : "white"} 
          />
          <Text style={styles.actionText}>
            {averageRating.toFixed(1)} ({item.ratings?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShare}
        >
          <Ionicons name="share-social-outline" size={32} color="white" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onRate={handleRating}
        currentRating={currentRating}
        isLoading={isRating}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: 'black',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  userTextContainer: {
    flex: 1,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  followButton: {
    backgroundColor: colors.golden,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '600',
  },
  caption: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  sidebar: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 120 : 100,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  media: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FeedItem;