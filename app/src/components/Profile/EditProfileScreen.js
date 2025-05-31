import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@apollo/client';
import { UPDATE_PROFILE } from '../../graphql/mutations';
import { commonStyles, colors } from '../../utils/styles';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingIndicator from '../Common/LoadingIndicator';

export default function EditProfileScreen({ navigation, route }) {
  const { user } = route.params;
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    onCompleted: () => {
      navigation.goBack();
    },
    onError: (err) => {
      setError(err.message);
      setUploading(false);
    },
  });

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!username || !email) {
      setError('Username and email are required');
      return;
    }

    setUploading(true);
    
    // In a real app, you would upload the avatar to a storage service first
    // and then use the returned URL in the mutation
    updateProfile({
      variables: {
        username,
        email,
        bio: bio || null,
        avatar: avatar || null,
      },
    });
  };

  return (
    <View style={[commonStyles.container, { paddingTop: 20 }]}>
      <Text style={commonStyles.header}>Edit Profile</Text>
      
      {error && <ErrorMessage message={error} />}

      <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarContainer}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <Text style={styles.changeAvatarText}>Change Profile Photo</Text>
      </TouchableOpacity>

      <TextInput
        style={commonStyles.input}
        placeholder="Username"
        placeholderTextColor={colors.secondaryText}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={commonStyles.input}
        placeholder="Email"
        placeholderTextColor={colors.secondaryText}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={[commonStyles.input, { height: 100, textAlignVertical: 'top' }]}
        placeholder="Bio"
        placeholderTextColor={colors.secondaryText}
        value={bio}
        onChangeText={setBio}
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