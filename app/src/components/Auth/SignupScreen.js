import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useMutation } from '@apollo/client';
import { useDispatch } from 'react-redux';
import { SIGNUP } from '../../graphql/mutations';
import { loginSuccess } from '../../actions/types';
import { commonStyles, colors } from '../../utils/styles';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingIndicator from '../Common/LoadingIndicator';
import client from '../../apollo/client';  
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [signup, { loading }] = useMutation(SIGNUP, {
    onCompleted: async (data) => {
      if (!data?.register?.token) {
        setError("Invalid Register response");
        return;
      }

      try {
        // Save token and user data to AsyncStorage
        await AsyncStorage.setItem('token', data.register.token);
        await AsyncStorage.setItem('userData', JSON.stringify({
          id: data.register.user.id,
          email: data.register.user.email,
          role: data.register.user.role,
        }));

        // Reset Apollo Client cache
        await client.resetStore();

        // Navigate to Main screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } catch (err) {
        setError("Failed to save Register data");
        console.error("AsyncStorage error:", err);
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSignup = () => {
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    signup({ 
      variables: { 
        input: { 
          username,
          email, 
          password 
        } 
      } 
    });
  };

  return (
    <View style={[commonStyles.container, { justifyContent: 'center' }]}>
      <Text style={commonStyles.header}>Create Account</Text>
      
      {error && <ErrorMessage message={error} />}

      <TextInput
        style={commonStyles.input}
        placeholder="Username"
        placeholderTextColor={colors.secondaryText}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
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
        style={commonStyles.input}
        placeholder="Password"
        placeholderTextColor={colors.secondaryText}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={commonStyles.button}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <LoadingIndicator color={colors.darkBackground} />
        ) : (
          <Text style={commonStyles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={[commonStyles.text, { textAlign: 'center', marginTop: 20 }]}>
          Already have an account? <Text style={{ color: colors.golden }}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}