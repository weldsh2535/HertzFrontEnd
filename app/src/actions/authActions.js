import { LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT } from './types';
import { LOGIN_USER } from '../graphql/queries';
import client from '../apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const loginSuccess = (token, user) => ({
  type: LOGIN_SUCCESS,
  payload: { token, user },
});

export const loginUser = (credentials) => {
  return async (dispatch) => {
    dispatch({ type: LOGIN_REQUEST });
    try {
      const { data } = await client.mutate({
        mutation: LOGIN_USER,
        variables: credentials,
      });

      await AsyncStorage.setItem('token', data.login.token);
      
      dispatch({
        type: LOGIN_SUCCESS,
        payload: data.login,
      });
      
      return data;
    } catch (error) {
      dispatch({
        type: LOGIN_FAILURE,
        payload: error.message,
      });
      throw error;
    }
  };
};

export const logout = () => {
  return async (dispatch) => {
    await AsyncStorage.removeItem('token');
    client.resetStore();
    dispatch({ type: LOGOUT });
  };
};