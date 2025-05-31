import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useMutation } from '@apollo/client';
import { useDispatch } from 'react-redux';
import { SIGNUP } from '../../graphql/mutations';
import { loginSuccess } from '../../actions/types';
import { commonStyles, colors } from '../../utils/styles';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingIndicator from '../Common/LoadingIndicator';

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const [signup, { loading }] = useMutation(SIGNUP, {
    onCompleted: (data) => {
      dispatch(loginSuccess(data.signup.token, data.signup.user));
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
    signup({ variables: { username, email, password } });
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