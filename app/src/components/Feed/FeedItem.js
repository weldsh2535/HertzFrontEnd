import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  TouchableOpacity
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@apollo/client';
import { LIKE_POST } from '../../graphql/mutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
const { height, width } = Dimensions.get('window');

const FeedItem = ({ item, isActive, index }) => {
  const [liked, setLiked] = useState(item.liked || false);
  const [likeCount, setLikeCount] = useState(item.likeCount || 0);
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(!isActive);
  const [showControls, setShowControls] = useState(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [error, setError] = useState('');
  const navigation = useNavigation(); 



  // Update your useEffect for video handling:
  useEffect(() => {

    const handleVideoPlayback = async () => {
      if (isActive) {
        setPaused(false);
        try {
          if (videoRef.current) {
            await videoRef.current.setPositionAsync(0); // Replace seek(0)
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


  // Video handling remains the same
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

  const [likePost] = useMutation(LIKE_POST, {
    onError: (err) => {
      console.error('Like error:', err);
      setError(err.message);
      setLiked(!liked);
      setLikeCount(liked ? likeCount + 1 : likeCount - 1);
    }
  });

  const handleLike = async () => {
   
    const newLiked = !liked;
    const newLikeCount = newLiked ? likeCount + 1 : likeCount - 1;

    // Get current user ID
    const currentUser = await AsyncStorage.getItem('userData');
    const userDatas = JSON.parse(currentUser);
    // Optimistic update
    setLiked(newLiked);
    setLikeCount(newLikeCount);

    try {
      const result = await likePost({
        variables: { postId: item.id },
        optimisticResponse: {
          __typename: 'Mutation',
          likePost: {
            __typename: 'Post',
            id: item.id,
            likeCount: newLikeCount,
            likes: newLiked
              ? [...(item.likes || []), { __typename: 'User', id: userDatas.id }]
              : (item.likes || []).filter(like => like.id !== userDatas.id)
          }
        },
        update: (cache, { data: { likePost } }) => {
          cache.modify({
            id: `Post:${item.id}`,
            fields: {
              likes: () => likePost.likes,
              likeCount: () => likePost.likeCount
            }
          });
        }
      });

      console.log('Like successful:', result);
    } catch (err) {
      console.error('Like failed:', {
        error: err,
        postId: item.id,
        userId: currentUserId
      });
      setError(err.message);
      setLiked(!newLiked);
      setLikeCount(likeCount);
    }
  };
  const handleCommentPress = () => {
    console.log('Comment pressed');
    console.log(item.id);
    console.log(item.commentCount);
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

      {/* Right Sidebar Actions */}
      <View style={styles.sidebar}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={36}
            color={liked ? "red" : "white"}
          />
          <Text style={styles.actionText}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleCommentPress} 
          style={styles.actionButton}
        >
          <Ionicons name="chatbubble-outline" size={32} color="white" />
          <Text style={styles.actionText}>{item.commentCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="arrow-redo-outline" size={32} color="white" />
          <Text style={styles.actionText}>{item.shareCount || 0}</Text>
        </TouchableOpacity>

        <View style={styles.musicBox}>
          <Ionicons name="musical-note" size={20} color="white" />
        </View>
      </View>

      {/* Bottom User Info */}
      <View style={styles.bottomBar}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{item.user.username}</Text>
          <Text style={styles.caption}>{item.caption}</Text>
          <View style={styles.musicRow}>
            <Ionicons name="musical-note" size={14} color="white" />
            <Text style={styles.musicText}>{item.music || "Original Sound"}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: 'black',
    position: 'relative',
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
  sidebar: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
  },
  actionButton: {
    marginBottom: 24,
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  },
  musicBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '30deg' }],
  },
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 100,
  },
  userInfo: {
    marginBottom: 16,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  caption: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  musicText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 6,
  },
});

export default FeedItem;