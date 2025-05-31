import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { GET_POST_COMMENTS, ADD_COMMENT, ADD_REPLY } from '../../graphql/queries';
import { commonStyles, colors } from '../../utils/styles';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingIndicator from '../Common/LoadingIndicator';

export default function CommentsScreen({ route }) {
  const { postId } = route.params;
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [error, setError] = useState('');

  const { loading, error: queryError, data, refetch } = useQuery(GET_POST_COMMENTS, {
    variables: { postId },
  });

  const [addComment] = useMutation(ADD_COMMENT, {
    variables: { postId, text: newComment },
    onCompleted: () => {
      setNewComment('');
      refetch();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const [addReply] = useMutation(ADD_REPLY, {
    variables: { commentId: replyingTo, text: newComment },
    onCompleted: () => {
      setNewComment('');
      setReplyingTo(null);
      refetch();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (replyingTo) {
      addReply();
    } else {
      addComment();
    }
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
      <View style={styles.commentContent}>
        <Text style={styles.username}>{item.user.username}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <TouchableOpacity onPress={() => setReplyingTo(item.id)}>
          <Text style={styles.replyText}>Reply</Text>
        </TouchableOpacity>

        {item.replies?.length > 0 && (
          <FlatList
            data={item.replies}
            renderItem={({ item: reply }) => (
              <View style={[styles.commentContainer, styles.replyContainer]}>
                <Image source={{ uri: reply.user.avatar }} style={styles.avatar} />
                <View style={styles.commentContent}>
                  <Text style={styles.username}>{reply.user.username}</Text>
                  <Text style={styles.commentText}>{reply.text}</Text>
                  <Text style={styles.timestamp}>
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}
            keyExtractor={(reply) => reply.id}
          />
        )}
      </View>
    </View>
  );

  if (loading && !data) return <LoadingIndicator />;
  if (queryError) return <ErrorMessage message={queryError.message} />;

  return (
    <View style={[commonStyles.container, { paddingBottom: 80 }]}>
      <FlatList
        data={data?.postComments || []}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={[commonStyles.text, { textAlign: 'center', marginTop: 20 }]}>
            No comments yet. Be the first to comment!
          </Text>
        }
      />

      <View style={styles.inputContainer}>
        {replyingTo && (
          <View style={styles.replyingTo}>
            <Text style={styles.replyingToText}>
              Replying to {data.postComments.find(c => c.id === replyingTo)?.user.username}
            </Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Text style={styles.cancelReply}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        <TextInput
          style={[commonStyles.input, styles.commentInput]}
          placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
          placeholderTextColor={colors.secondaryText}
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity style={styles.postButton} onPress={handleSubmit}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  replyContainer: {
    marginLeft: 40,
    marginTop: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  username: {
    color: colors.lightText,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  commentText: {
    color: colors.lightText,
    marginBottom: 3,
  },
  timestamp: {
    color: colors.secondaryText,
    fontSize: 12,
  },
  replyText: {
    color: colors.golden,
    marginTop: 5,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.darkerBackground,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.golden,
  },
  commentInput: {
    marginBottom: 10,
  },
  postButton: {
    backgroundColor: colors.golden,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  postButtonText: {
    color: colors.darkBackground,
    fontWeight: 'bold',
  },
  replyingTo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  replyingToText: {
    color: colors.goldenLight,
    fontSize: 12,
  },
  cancelReply: {
    color: colors.secondaryText,
    fontSize: 12,
  },
});