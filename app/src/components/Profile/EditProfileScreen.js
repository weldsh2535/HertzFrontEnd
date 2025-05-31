import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { commonStyles, colors } from '../../utils/styles';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingIndicator from '../Common/LoadingIndicator';


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
  const [token, setToken] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4MzU5ZTc1ZmQwNjYxOTZjZDE5YjJmZiIsImlhdCI6MTc0ODUyODUzNiwiZXhwIjoxNzQ5MTMzMzM2fQ.QgNkRkBvP-3CJs4sOfOn4ynrqM27h0-API5HpGFgQVI");


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
          mutation ($file: Upload, $username: String, $email: String, $bio: String) {
            updateProfile(input: { 
              avatar: $file,
              username: $username,
              email: $email,
              bio: $bio
            }) {
              id
              username
              email
              bio
              avatar
            }
          }
        `,
        variables: {
          file: null,
          username: formData.username,
          email: formData.email,
          bio: formData.bio || null
        }
      }));

      // 2. Add map JSON
      formDataToSend.append('map', JSON.stringify({
        '0': ['variables.file']
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
      const response = await fetch('http://192.168.0.139:4000/graphql', {
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

      navigation.navigate('Profile', { updatedUser: result.data.updateProfile });
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Update failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[commonStyles.container, { paddingTop: 20 }]}>
      <Text style={commonStyles.header}>Edit Profile</Text>
      
      {error && <ErrorMessage message={error} />}

      <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarContainer}>
        <Image 
          source={{ uri: 
            typeof formData.avatar === 'string' ? 
              formData.avatar : 
              formData.avatar?.uri || 'https://via.placeholder.com/150' 
          }} 
          style={styles.avatar} 
        />
        <Text style={styles.changeAvatarText}>Change Profile Photo</Text>
      </TouchableOpacity>

      <TextInput
        style={commonStyles.input}
        placeholder="Username"
        placeholderTextColor={colors.secondaryText}
        value={formData.username}
        onChangeText={(text) => handleChange('username', text)}
      />

      <TextInput
        style={commonStyles.input}
        placeholder="Email"
        placeholderTextColor={colors.secondaryText}
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={[commonStyles.input, { height: 100, textAlignVertical: 'top' }]}
        placeholder="Bio"
        placeholderTextColor={colors.secondaryText}
        value={formData.bio}
        onChangeText={(text) => handleChange('bio', text)}
        multiline
      />

      <TouchableOpacity
        style={commonStyles.button}
        onPress={handleSave}
        disabled={uploading}
      >
        {uploading ? (
          <LoadingIndicator color={colors.darkBackground} />
        ) : (
          <Text style={commonStyles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.golden,
    marginBottom: 10,
  },
  changeAvatarText: {
    color: colors.golden,
    fontSize: 16,
  },
});