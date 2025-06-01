import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Dimensions, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { commonStyles, colors } from '../../utils/styles';
import ErrorMessage from '../../components/Common/ErrorMessage';
import LoadingIndicator from '../../components/Common/LoadingIndicator';
import MediaPicker from '../../components/Common/MediaPicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

export default function CreatePostScreen({ navigation }) {
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (!storedToken) {
          // If no token is found, redirect to login
          navigation.replace('Login');
          return;
        }
        setToken(storedToken);
      } catch (err) {
        console.error('Error reading token:', err);
        setError('Authentication error');
      }
    };

    getToken();
  }, [navigation]);

  const handlePickMedia = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          type === 'image'
            ? ImagePicker.MediaTypeOptions.Images
            : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: type === 'image' ? [4, 3] : [16, 9],
        quality: type === 'image' ? 0.8 : 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMedia(result.assets[0]);
        setMediaType(type);
        setError('');
      }
    } catch (err) {
      setError('Failed to select media. Please try again.');
      console.error(err);
    }
  };

  const handleRemoveMedia = () => {
    setMedia(null);
    setMediaType(null);
  };

  const handleCreatePost = async () => {
    if (!token) {
      setError('Please login to create a post');
      navigation.replace('Login');
      return;
    }

    if (!media || !mediaType) {
      setError('Please select a photo or video');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Platform-agnostic file handling
      const filename = media.fileName ||
        media.uri.split('/').pop() ||
        `upload.${mediaType === 'image' ? 'jpg' : 'mp4'}`;

      const fileType = mediaType === 'image' ? 'image/jpeg' : 'video/mp4';

      // Create the form data
      const formData = new FormData();

      // 1. Add operations JSON
      formData.append('operations', JSON.stringify({
        query: `
          mutation ($file: Upload!, $caption: String) {
            createPost(input: { file: $file, caption: $caption }) {
              id
            }
          }
        `,
        variables: {
          file: null,
          caption: caption.trim() || null
        }
      }));

      // 2. Add map JSON
      formData.append('map', JSON.stringify({
        '0': ['variables.file']
      }));

      // 3. Handle web vs native file attachment
      if (Platform.OS === 'web') {
        // Web-specific handling
        const response = await fetch(media.uri);
        const blob = await response.blob();
        formData.append('0', blob, filename);
      } else {
        // Native (iOS/Android) handling
        formData.append('0', {
          uri: media.uri,
          name: filename,
          type: fileType
        });
      }

      // Make the request
      const response = await fetch('http://10.0.2.2:4000/graphql', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      // Handle response
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON, got: ${text.substring(0, 100)}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Upload failed');
      }

      navigation.goBack();
    } catch (err) {
      console.error('Upload error:', err);
      if (err.message.includes('Authentication')) {
        // If there's an authentication error, clear the token and redirect to login
        await AsyncStorage.removeItem('token');
        navigation.replace('Login');
      }
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[commonStyles.container, { paddingTop: 20 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={commonStyles.header}>Create Post</Text>
        <View style={{ width: 28 }} />
      </View>

      {error && <ErrorMessage message={error} />}

      {!media ? (
        <MediaPicker
          onPickImage={() => handlePickMedia('image')}
          onPickVideo={() => handlePickMedia('video')}
        />
      ) : (
        <View style={styles.previewContainer}>
          {mediaType === 'image' ? (
            <Image source={{ uri: media.uri }} style={styles.preview} resizeMode="contain" />
          ) : (
            <View style={styles.videoContainer}>
              <Video
                source={{ uri: media.uri }}
                style={styles.preview}
                resizeMode="contain"
                shouldPlay
                isLooping
                useNativeControls
              />
              <View style={styles.videoOverlay} />
            </View>
          )}

          <TouchableOpacity style={styles.removeButton} onPress={handleRemoveMedia}>
            <Icon name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.captionContainer}>
        <TextInput
          style={[styles.captionInput, commonStyles.input]}
          placeholder="Write a caption..."
          placeholderTextColor={colors.secondaryText}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={2200}
        />
        <Text style={styles.charCount}>{caption.length}/2200</Text>
      </View>

      <TouchableOpacity
        style={[
          commonStyles.button,
          styles.postButton,
          (!media || uploading) && styles.disabledButton,
        ]}
        onPress={handleCreatePost}
        disabled={!media || uploading}
      >
        {uploading ? (
          <LoadingIndicator color={colors.lightBackground} />
        ) : (
          <Text style={commonStyles.buttonText}>Post</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  previewContainer: {
    width: '100%',
    height: screenWidth * 0.9,
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionContainer: {
    width: '100%',
    marginBottom: 20,
    position: 'relative',
  },
  captionInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingBottom: 25,
  },
  charCount: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    color: colors.secondaryText,
    fontSize: 12,
  },
  postButton: {
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
