import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useMutation } from '@apollo/client';
import { useDispatch } from 'react-redux';
import { LOGIN } from '../../graphql/mutations';
import { loginSuccess } from '../../actions/authActions';
import { commonStyles, colors } from '../../utils/styles';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingIndicator from '../Common/LoadingIndicator';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const [login, { loading }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      dispatch(loginSuccess(data.login.token, data.login.user));
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    login({ variables: { email, password } });
  };

  return (
    <View style={[commonStyles.container, { justifyContent: 'center' }]}>
      <Text style={commonStyles.header}>Login</Text>

      {/* Explicit conditional rendering */}
      {error ? <ErrorMessage message={error} /> : null}

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
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <LoadingIndicator color={colors.darkBackground} />
        ) : (
          <Text style={commonStyles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <View style={{ marginTop: 20 }}>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={[commonStyles.text, { textAlign: 'center' }]}>
            Don't have an account? <Text style={{ color: colors.golden }}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}