import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Platform, 
  Animated, 
  StatusBar, 
  SafeAreaView,
  Pressable 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { commonStyles, colors } from '../../utils/styles';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingIndicator from '../Common/LoadingIndicator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';

export default function EditProfileScreen({ navigation, route }) {
  const { user } = route.params;
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    bio: user.bio || '',
    avatar: user.avatar
  });
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [token, setToken] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);
  const scaleAnim = new Animated.Value(1);

  // Animation for button press
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

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

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleChange('avatar', result.assets[0]);
      }
    } catch (err) {
      setError('Failed to select image');
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!formData.username || !formData.email) {
      setError('Username and email are required');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formDataToSend = new FormData();

      // 1. Add operations JSON
      formDataToSend.append('operations', JSON.stringify({
        query: `
          mutation UpdateProfile($input: UpdateProfileInput!) {
            updateProfile(input: $input) {
              id
              username
              email
              bio
              avatar
              email
              posts {
                id
                mediaUrl
                mediaType
                caption
                createdAt
                likeCount
                commentCount
              }
            }
          }
        `,
        variables: {
          input: {
            username: formData.username,
            email: formData.email,
            bio: formData.bio || null
          }
        }
      }));

      // 2. Add map JSON
      formDataToSend.append('map', JSON.stringify({
        '0': ['req.file']
      }));

      // 3. Handle file attachment if avatar exists
      if (formData.avatar && typeof formData.avatar === 'object') {
        const filename = formData.avatar.fileName || 
          formData.avatar.uri.split('/').pop() || 
          `avatar-${Date.now()}.jpg`;

        if (Platform.OS === 'web') {
          const response = await fetch(formData.avatar.uri);
          const blob = await response.blob();
          formDataToSend.append('0', blob, filename);
        } else {
          formDataToSend.append('0', {
            uri: formData.avatar.uri,
            name: filename,
            type: 'image/jpeg'
          });
        }
      }

      // Make the request
      const response = await fetch('https://hertz-blond.vercel.app/api', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend
      });

      // Handle response
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON, got: ${text.substring(0, 100)}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Update failed');
      }

      // Navigate back and trigger refresh
      navigation.navigate('ProfileMain', { 
        updatedUser: result.data.updateProfile,
        refreshProfile: Date.now() // Add timestamp to force refresh
      });
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Update failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar  backgroundColor={colors.darkBackground} />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="close" size={24} color={colors.lightText} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity 
              style={[styles.saveButton, uploading && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={uploading}
            >
              {uploading ? (
                <LoadingIndicator color={colors.golden} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {error && <ErrorMessage message={error} />}

        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.avatarContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <Pressable 
              onPress={handlePickAvatar}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Image 
                source={{ 
                  uri: typeof formData.avatar === 'string' ? 
                    formData.avatar : 
                    formData.avatar?.uri || 'https://via.placeholder.com/150'
                }} 
                style={styles.avatar} 
              />
              <View style={styles.avatarOverlay}>
                <Icon name="camera-alt" size={24} color={colors.lightText} />
              </View>
            </Pressable>
          </Animated.View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'username' && styles.inputFocused
                ]}
                placeholder="Add a username"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.username}
                onChangeText={(text) => handleChange('username', text)}
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'email' && styles.inputFocused
                ]}
                placeholder="Add your email"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.bioInput,
                  focusedInput === 'bio' && styles.inputFocused
                ]}
                placeholder="Tell others about yourself"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.bio}
                onChangeText={(text) => handleChange('bio', text)}
                multiline
                maxLength={80}
                onFocus={() => setFocusedInput('bio')}
                onBlur={() => setFocusedInput(null)}
              />
              <Text style={styles.charCount}>
                {(formData.bio || '').length}/80
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.darkBackground,
    marginTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: colors.darkBackground,
  },
  headerContainer: {
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: Platform.OS === 'ios' ? 44 : 56,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.lightText,
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.golden,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.darkBackground,
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.golden,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.golden,
    borderRadius: 24,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formSection: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: colors.secondaryText,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: 16,
    color: colors.lightText,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputFocused: {
    borderColor: colors.golden,
    backgroundColor: 'rgba(255,255,255,0.12)',
    shadowColor: colors.golden,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    // elevation: 2,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 5,
  },
  charCount: {
    color: colors.secondaryText,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});

