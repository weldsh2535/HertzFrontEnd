import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  Alert,
  Animated,
  StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { Camera } from 'expo-camera';
import { commonStyles, colors } from '../../utils/styles';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingIndicator from '../Common/LoadingIndicator';
import MediaPicker from '../Common/MediaPicker';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define camera types constants
const CAMERA_TYPES = {
  BACK: 'back',
  FRONT: 'front'
};

export default function CreatePostScreen({ navigation }) {
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [token, setToken] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraType, setCameraType] = useState(CAMERA_TYPES.BACK);
  const [showCamera, setShowCamera] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const cameraRef = useRef(null);
  const recordingTimer = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const getToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (!storedToken) {
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

  useEffect(() => {
    (async () => {
      try {
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
          setError('Camera and microphone permissions are required');
          setHasPermission(false);
        } else if (libraryStatus !== 'granted') {
          setError('Media library permission is required');
          setHasPermission(false);
        } else {
          setHasPermission(true);
          setError('');
        }
      } catch (err) {
        console.error('Permission error:', err);
        setError('Failed to get permissions');
        setHasPermission(false);
      }
    })();
  }, []);

  const handlePickMedia = async (type) => {
    try {
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant media library permission to select media',
          [{ text: 'OK' }]
        );
        return;
      }

      const options = {
        mediaTypes: type === 'image'
          ? ImagePicker.MediaTypeOptions.Images
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: type === 'image' ? [4, 3] : [16, 9],
        quality: type === 'image' ? 0.8 : 0.7,
        videoMaxDuration: 60,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // For videos, check duration if available
        if (type === 'video' && asset.duration && asset.duration > 60000) {
          setError('Video must be 60 seconds or less');
          return;
        }

        setMedia(asset);
        setMediaType(type);
        setError('');
        setShowCamera(false);
      }
    } catch (err) {
      console.error('Media picker error:', err);
      setError('Failed to select media. Please try again.');
    }
  };

  const resetForm = () => {
    setMedia(null);
    setMediaType(null);
    setCaption('');
    setError('');
    setUploading(false);
    setShowCamera(false);
    setIsRecording(false);
    setRecordingTime(0);
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
      const filename = media.fileName ||
        media.uri.split('/').pop() ||
        `upload.${mediaType === 'image' ? 'jpg' : 'mp4'}`;

      const fileType = mediaType === 'image' ? 'image/jpeg' : 'video/mp4';

      // Create FormData
      const formData = new FormData();

      // Add the GraphQL operation
      formData.append('operations', JSON.stringify({
        query: `
        mutation CreatePost($input: CreatePostInput!) {
          createPost(input: $input) {
            id
            mediaUrl
            caption
          }
        }
        `,
        variables: {
          input: {
            caption: caption.trim() || null
          }
        }
      }));

      // Add the file mapping
      formData.append('map', JSON.stringify({
        "0": ["req.file"]
      }));

      // Add the file
      if (Platform.OS === 'web') {
        const blob = await fetch(media.uri).then(r => r.blob());
        formData.append('0', blob, filename);
      } else {
        formData.append('0', {
          uri: media.uri,
          name: filename,
          type: fileType
        });
      }

      const response = await fetch('https://hertz-blond.vercel.app/api', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      if (err.message.includes('Authentication')) {
        await AsyncStorage.removeItem('token');
        navigation.replace('Login');
      }
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      const videoData = await cameraRef.current.recordAsync({
        maxDuration: 60,
        quality: '720p',
        mute: false,
      });

      if (videoData.uri) {
        setMedia({ ...videoData, type: 'video' });
        setMediaType('video');
        setShowCamera(false);
      }
    } catch (err) {
      console.error('Recording error:', err);
      Alert.alert('Error', 'Failed to record video');
    } finally {
      setIsRecording(false);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      await cameraRef.current.stopRecording();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    } catch (err) {
      console.error('Stop recording error:', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  // Update camera type toggle
  const toggleCameraType = () => {
    setCameraType(current =>
      current === CAMERA_TYPES.BACK ? CAMERA_TYPES.FRONT : CAMERA_TYPES.BACK
    );
  };

  if (showCamera) {
    return (
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" />
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={cameraType}
          ratio="16:9"
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <MaterialIcons name="close" size={28} color="white" />
              </TouchableOpacity>
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.cameraControl}
                  onPress={toggleCameraType}
                >
                  <MaterialIcons name="flip-camera-ios" size={25} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraControl}>
                  <MaterialIcons name="flash-off" size={25} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {mediaType === 'video' && (
              <View style={styles.recordingTimer}>
                <MaterialIcons
                  name="fiber-manual-record"
                  size={24}
                  color={isRecording ? 'red' : 'white'}
                />
                <Text style={styles.timerText}>
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            )}

            <View style={styles.cameraFooter}>
              {mediaType === 'video' ? (
                <TouchableOpacity
                  style={[styles.captureButton, isRecording && styles.recordingButton]}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  <View style={{
                    width: isRecording ? 24 : 54,
                    height: isRecording ? 24 : 54,
                    borderRadius: isRecording ? 4 : 27,
                    backgroundColor: '#FFFFFF',
                  }} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={async () => {
                    try {
                      const photo = await cameraRef.current?.takePictureAsync({
                        quality: 0.8,
                        skipProcessing: Platform.OS === 'android',
                      });
                      if (photo?.uri) {
                        setMedia(photo);
                        setMediaType('image');
                        setShowCamera(false);
                      }
                    } catch (err) {
                      console.error('Camera error:', err);
                      Alert.alert('Error', 'Failed to take picture');
                    }
                  }}
                >
                  <View style={styles.innerCaptureButton} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Camera>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent"  />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert(
              'Discard Changes',
              'Are you sure you want to discard your changes?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Discard',
                  style: 'destructive',
                  onPress: () => {
                    resetForm();
                    navigation.goBack();
                  }
                }
              ]
            );
          }}
        >
          <MaterialIcons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[
            styles.headerButton,
            styles.postButton,
            (!media || uploading) && styles.disabledButton
          ]}
          onPress={handleCreatePost}
          disabled={!media || uploading}
        >
          {uploading ? (
            <LoadingIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && <ErrorMessage message={error} />}

      <View style={styles.content}>
        {!media ? (
          <MediaPicker
            onPickImage={() => handlePickMedia('image')}
            onPickVideo={() => handlePickMedia('video')}
            onOpenCamera={() => {
              setMediaType('image');
              setShowCamera(true);
            }}
            onOpenVideoCamera={() => {
              setMediaType('video');
              setShowCamera(true);
            }}
          />
        ) : (
          <Animated.View style={[styles.mediaPreview, { opacity: fadeAnim }]}>
            {mediaType === 'image' ? (
              <Image source={{ uri: media.uri }} style={styles.mediaContent} resizeMode="contain" />
            ) : (
              <Video
                source={{ uri: media.uri }}
                style={styles.mediaContent}
                resizeMode="contain"
                shouldPlay
                isLooping
                useNativeControls
              />
            )}
            <TouchableOpacity
              style={styles.removeMedia}
              onPress={() => {
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  setMedia(null);
                  setMediaType(null);
                  fadeAnim.setValue(1);
                });
              }}
            >
              <MaterialIcons name="close" size={20} color="white" />
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2200}
            returnKeyType="done"
          />
          <Text style={styles.charCount}>{caption.length}/2200</Text>
        </View>
      </View>

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <LoadingIndicator size="large" color={colors.primary} />
          <Text style={styles.uploadingText}>Creating post...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerButton: {
    padding: 8,
    backgroundColor: colors.white,
    borderRadius: 40,
    minWidth: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  postButton: {
    backgroundColor: '#FF3B7F',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: '#FF3B7F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: colors.goldenLight,
  },
  content: {
    flex: 1,
  },
  mediaPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.darkBackground,
  },
  mediaContent: {
    width: '100%',
    height: '100%',
  },
  removeMedia: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  captionContainer: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  captionInput: {
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 0,
    paddingBottom: 25,
  },
  charCount: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraControls: {
    flexDirection: 'row',
  },
  cameraControl: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  cameraFooter: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B7F',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  innerCaptureButton: {
    flex: 1,
    borderRadius: 36,
    backgroundColor: 'white',
  },
  recordingButton: {
    backgroundColor: '#FF2D55',
    borderColor: '#FF2D55',
    transform: [{ scale: 1.1 }],
  },
  recordingTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 32,
    left: 0,
    right: 0,
  },
  timerText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
});