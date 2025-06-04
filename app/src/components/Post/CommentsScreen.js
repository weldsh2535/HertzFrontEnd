import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, Animated, Platform, Keyboard, Pressable, Dimensions, PanResponder, ActivityIndicator } from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_POST_COMMENTS } from '../../graphql/queries';
import { ADD_COMMENT,ADD_REPLY } from '../../graphql/mutations';
import {  colors } from '../../utils/styles';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingComments from '../Common/LoadingComments';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { gql } from '@apollo/client';
import { useApolloClient } from '@apollo/client';
import { formatTimestamp } from '../../utils/dateUtils';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAG_THRESHOLD = 50;

export default function CommentsScreen({ route, navigation }) {

  const { postId, commentCount } = route.params || {};
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);
  const inputHeight = useRef(new Animated.Value(50)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const client = useApolloClient();

  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => navigation.goBack());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
          // Calculate opacity based on drag
          const newOpacity = 1 - (gestureState.dy / (SCREEN_HEIGHT / 2));
          backdropOpacity.setValue(Math.max(0, newOpacity));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD) {
          closeModal();
        } else {
          // Snap back to opened position
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true
            })
          ]).start();
        }
      }
    })
  ).current;

  const { loading, error: queryError, data, refetch } = useQuery(GET_POST_COMMENTS, {
    variables: { postId },
    fetchPolicy: 'network-only',
  });

  const [addComment, { loading: addCommentLoading }] = useMutation(ADD_COMMENT, {
    variables: { postId, text: newComment },
    onCompleted: async (data) => {
      setNewComment('');
      setIsSubmitting(false);
      
      // Optimistically update the UI
      const newComment = data.addComment;
      
      // Update Apollo cache
      client.cache.modify({
        fields: {
          postComments(existingComments = []) {
            const newCommentRef = client.cache.writeFragment({
              data: newComment,
              fragment: gql`
                fragment NewComment on Comment {
                  id
                  text
                  createdAt
                  user {
                    id
                    username
                    avatar
                  }
                }
              `
            });
            return [...existingComments, newCommentRef];
          }
        }
      });

      // Refetch to ensure data consistency
      await refetch();
    },
    onError: (err) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const [addReply, { loading: addReplyLoading }] = useMutation(ADD_REPLY, {
    variables: { commentId: replyingTo, text: newComment },
    onCompleted: async (data) => {
      setNewComment('');
      setReplyingTo(null);
      setIsSubmitting(false);
      
      // Optimistically update the UI
      const newReply = data.addReply;
      
      // Update Apollo cache
      client.cache.modify({
        id: client.cache.identify({ __typename: 'Comment', id: replyingTo }),
        fields: {
          replies(existingReplies = []) {
            const newReplyRef = client.cache.writeFragment({
              data: newReply,
              fragment: gql`
                fragment NewReply on Reply {
                  id
                  text
                  createdAt
                  user {
                    id
                    username
                    avatar
                  }
                }
              `
            });
            return [...existingReplies, newReplyRef];
          }
        }
      });

      // Refetch to ensure data consistency
      await refetch();
    },
    onError: (err) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (replyingTo) {
        await addReply();
      } else {
        await addComment();
      }
    } catch (err) {
      console.error('Error submitting:', err);
      setError('Failed to submit. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderComment = ({ item }) => (
    <Pressable 
      style={styles.commentContainer}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
    >
      <TouchableOpacity style={styles.avatarContainer}>
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
      </TouchableOpacity>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <TouchableOpacity>
            <Text style={styles.username}>{item.user.username}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
        <View style={styles.commentFooter}>
          <Text style={styles.timestamp}>
            {formatTimestamp(item.createdAt)}
          </Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setReplyingTo(item.id)}
          >
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.interactionContainer}>
          <TouchableOpacity style={styles.likeButton}>
            <Icon name="favorite-border" size={20} color={colors.secondaryText} />
            <Text style={styles.likeCount}>0</Text>
          </TouchableOpacity>
        </View>

        {item.replies?.length > 0 && (
          <View style={styles.repliesContainer}>
            <FlatList
              data={item.replies}
              renderItem={({ item: reply }) => (
                <Pressable 
                  style={styles.replyContainer}
                  android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <TouchableOpacity style={styles.avatarContainer}>
                    <Image source={{ uri: reply.user.avatar }} style={styles.replyAvatar} />
                  </TouchableOpacity>
                  <View style={styles.replyContent}>
                    <TouchableOpacity>
                      <Text style={styles.username}>{reply.user.username}</Text>
                    </TouchableOpacity>
                    <Text style={styles.commentText}>{reply.text}</Text>
                    <View style={styles.commentFooter}>
                      <Text style={styles.timestamp}>
                        {formatTimestamp(reply.createdAt)}
                      </Text>
                      <TouchableOpacity style={styles.likeButton}>
                        <Icon name="favorite-border" size={16} color={colors.secondaryText} />
                        <Text style={styles.likeCount}>0</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Pressable>
              )}
              keyExtractor={(reply) => reply.id}
            />
          </View>
        )}
      </View>
    </Pressable>
  );

  if (loading && !data) {
    return (
      <View style={styles.modalContainer}>
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: backdropOpacity }
          ]}
        >
          <TouchableOpacity 
            style={styles.backdropTouchable}
            activeOpacity={1} 
            onPress={closeModal}
          />
        </Animated.View>

        <Animated.View 
          style={[
            styles.container,
            {
              transform: [{
                translateY: slideAnim
              }]
            }
          ]}
        >
          <View style={styles.contentContainer}>
            <View style={styles.headerContainer}>
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
              <View {...panResponder.panHandlers} style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={closeModal}
                >
                  <Icon name="close" size={24} color={colors.lightText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{commentCount || 0} comments</Text>
                <View style={styles.iconButton} />
              </View>
            </View>
            <LoadingComments />
          </View>
        </Animated.View>
      </View>
    );
  }

  if (queryError) return <ErrorMessage message={queryError.message} />;

  return (
    <View style={styles.modalContainer}>
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: backdropOpacity }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdropTouchable}
          activeOpacity={1} 
          onPress={closeModal}
        />
      </Animated.View>

      <Animated.View 
        style={[
          styles.container,
          {
            transform: [{
              translateY: slideAnim
            }]
          }
        ]}
      >
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <View {...panResponder.panHandlers} style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={closeModal}
              >
                <Icon name="close" size={24} color={colors.lightText} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{commentCount || 0} comments</Text>
              <View style={styles.iconButton} />
            </View>
          </View>

          <FlatList
            data={data?.postComments || []}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            style={styles.flatList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Be the first one to comment!
                </Text>
              </View>
            }
          />

          <Animated.View style={[styles.inputContainer, { height: inputHeight }]}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.inputContent}>
              {replyingTo && (
                <View style={styles.replyingTo}>
                  <Text style={styles.replyingToText}>
                    Replying to{' '}
                    <Text style={styles.replyUsername}>
                      @{data?.postComments.find(c => c.id === replyingTo)?.user.username}
                    </Text>
                  </Text>
                  <TouchableOpacity 
                    style={styles.cancelReplyButton}
                    onPress={() => setReplyingTo(null)}
                  >
                    <Icon name="close" size={20} color={colors.secondaryText} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.commentInput,
                    isSubmitting && styles.commentInputDisabled
                  ]}
                  placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                  placeholderTextColor={colors.secondaryText}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={150}
                  editable={!isSubmitting}
                  textAlignVertical="center"
                  onContentSizeChange={(event) => {
                    const height = Math.min(100, Math.max(48, event.nativeEvent.contentSize.height));
                    Animated.timing(inputHeight, {
                      toValue: height + (replyingTo ? 70 : 20),
                      duration: 150,
                      useNativeDriver: false
                    }).start();
                  }}
                />
                <TouchableOpacity 
                  style={[
                    styles.postButton,
                    (!newComment.trim() || isSubmitting) && styles.postButtonDisabled
                  ]} 
                  onPress={handleSubmit}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.lightText} />
                  ) : (
                    <Text style={[
                      styles.postButtonText,
                      !newComment.trim() && styles.postButtonTextDisabled
                    ]}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.darkBackground,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    minHeight: SCREEN_HEIGHT * 0.75, 
    maxHeight: SCREEN_HEIGHT * 0.9, 
    width: SCREEN_WIDTH,
  },
  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  headerContainer: {
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  handleContainer: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.lightText,
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatList: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 20,
  },
  commentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.darkerBackground,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    color: colors.lightText,
    fontWeight: '500',
    fontSize: 14,
  },
  commentText: {
    color: colors.lightText,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    color: colors.secondaryText,
    fontSize: 12,
    marginRight: 16,
  },
  actionButton: {
    marginRight: 16,
  },
  actionText: {
    color: colors.secondaryText,
    fontSize: 12,
    fontWeight: '500',
  },
  interactionContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingLeft: 16,
  },
  likeButton: {
    alignItems: 'center',
  },
  likeCount: {
    color: colors.secondaryText,
    fontSize: 12,
    marginTop: 2,
  },
  repliesContainer: {
    marginTop: 8,
    marginLeft: 16,
  },
  replyContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.darkerBackground,
  },
  replyContent: {
    flex: 1,
    marginLeft: 8,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.darkBackground,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Add padding for iPhone X and later
    zIndex: 10,
  },
  inputContent: {
    flex: 1,
    backgroundColor: colors.darkBackground,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.darkBackground,
  },
  commentInput: {
    flex: 1,
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    color: colors.lightText,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 48,
    textAlignVertical: 'center',
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.golden,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 64,
    height: 36,
  },
  postButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  postButtonText: {
    color: colors.darkBackground,
    fontWeight: '600',
    fontSize: 14,
  },
  postButtonTextDisabled: {
    color: colors.secondaryText,
  },
  replyingTo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.darkBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  replyingToText: {
    color: colors.secondaryText,
    fontSize: 13,
    flex: 1,
  },
  replyUsername: {
    color: colors.golden,
    fontWeight: '500',
  },
  cancelReplyButton: {
    padding: 4,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.secondaryText,
    fontSize: 15,
  },
  errorText: {
    color: '#ff4d4f', // Error red color
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 16,
    textAlign: 'center',
  },
  commentInputDisabled: {
    opacity: 0.7,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});