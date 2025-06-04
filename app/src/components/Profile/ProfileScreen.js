import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { GET_USER } from '../../graphql/queries';
import { commonStyles, colors } from '../../utils/styles';
import LoadingIndicator from '../Common/LoadingIndicator';
import ErrorMessage from '../Common/ErrorMessage';

const { width, height } = Dimensions.get('window');

const CenteredLoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <LoadingIndicator size="large" color={colors.golden} />
    <Text style={styles.loadingText}>Loading profile...</Text>
  </View>
);

export default function ProfileScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('posts');
  const { user: currentUser } = useSelector((state) => state.auth);
  const { loading, error, data, refetch } = useQuery(GET_USER, {
    variables: { userId: currentUser.id },
    skip: !currentUser.id
  });

  // Handle profile refresh when returning from edit screen
  useEffect(() => {
    if (route.params?.refreshProfile) {
      refetch();
    }
    if (route.params?.updatedUser) {
      // Update local state if needed
    }
  }, [route.params?.refreshProfile, route.params?.updatedUser, refetch]);

  if (loading) return <CenteredLoadingIndicator />;
  if (error) return <ErrorMessage message={error.message} />;

  const user = route.params?.updatedUser || data?.getUser || currentUser;

  const renderPost = ({ item }) => (
    <TouchableOpacity style={styles.postItem}>
      {item.mediaType === 'image' ? (
        <Image 
          source={{ uri: item.mediaUrl }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.postImage}>
          <Text style={styles.videoIndicator}>▶</Text>
        </View>
      )}
      <View style={styles.postStats}>
        <Text style={styles.postStatsText}>♥ {item.likes || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  const TabButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity 
      style={[styles.tabButton, isActive && styles.activeTabButton]} 
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[commonStyles.container, styles.container]}>
      <View style={styles.header}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.username}>@{user.username}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.following?.length || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.followers?.length || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.posts?.length || 0}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
      </View>

      <Text style={styles.bio}>{user.bio || 'No bio yet'}</Text>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile', { user })}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <View style={styles.tabContainer}>
        <TabButton 
          title="Posts" 
          isActive={activeTab === 'posts'} 
          onPress={() => setActiveTab('posts')}
        />
        <TabButton 
          title="Liked" 
          isActive={activeTab === 'liked'} 
          onPress={() => setActiveTab('liked')}
        />
      </View>

      <FlatList
        data={user.posts || []}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsGrid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.golden,
    marginBottom: 15,
  },
  username: {
    color: colors.lightText,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: colors.lightText,
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 5,
  },
  statLabel: {
    color: colors.secondaryText,
    fontSize: 13,
  },
  bio: {
    color: colors.lightText,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.golden,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 40,
    marginHorizontal: 30,
    marginBottom: 25,
  },
  editButtonText: {
    color: colors.golden,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.secondaryText,
    marginBottom: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.golden,
  },
  tabButtonText: {
    color: colors.secondaryText,
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: colors.lightText,
  },
  postsGrid: {
    flexGrow: 1,
  },
  postItem: {
    width: width / 3,
    height: width / 3,
    padding: 1,
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
  postStats: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatsText: {
    color: colors.lightText,
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.darkBackground,
    justifyContent: 'center',
    alignItems: 'center',
    height: height,
  },
  loadingText: {
    color: colors.lightText,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
});