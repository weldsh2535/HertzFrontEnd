import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { GET_USER } from '../../graphql/queries';
import { commonStyles, colors } from '../../utils/styles';
import LoadingIndicator from '../Common/LoadingIndicator';
import ErrorMessage from '../Common/ErrorMessage';

export default function ProfileScreen({ navigation }) {
  const { user: currentUser } = useSelector((state) => state.auth);
  const { loading, error, data } = useQuery(GET_USER, {
    variables: { userId: currentUser.id }, 
    skip: !currentUser.id
  });

  if (loading) return <LoadingIndicator />;
  if (error) return <ErrorMessage message={error.message} />;

  const user = data?.getUser || currentUser;

  const renderPost = ({ item }) => (
    <TouchableOpacity style={styles.postItem}>
      {item.mediaType === 'image' ? (
        <Image source={{ uri: item.mediaUrl }} style={styles.postImage} />
      ) : (
        <View style={styles.postImage}>
          <Text style={styles.videoIndicator}>▶</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={commonStyles.container}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.posts?.length || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.followers?.length || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.following?.length || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.bio}>{user.bio || 'No bio yet'}</Text>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile', { user })}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <FlatList
        data={user.posts || []}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.postsGrid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.golden,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: colors.lightText,
    fontWeight: 'bold',
    fontSize: 18,
  },
  statLabel: {
    color: colors.secondaryText,
    fontSize: 14,
  },
  userInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  username: {
    color: colors.lightText,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  bio: {
    color: colors.lightText,
    fontSize: 14,
  },
  editButton: {
    backgroundColor: colors.darkerBackground,
    borderWidth: 1,
    borderColor: colors.golden,
    borderRadius: 5,
    padding: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.golden,
    fontWeight: 'bold',
  },
  postsGrid: {
    flexGrow: 1,
  },
  postItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
  },
  postImage: {
    flex: 1,
    backgroundColor: colors.darkerBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicator: {
    color: colors.lightText,
    fontSize: 24,
  },
});