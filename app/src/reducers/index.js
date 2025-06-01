// src/reducers/index.js
import { combineReducers } from 'redux';
import authReducer from './authReducer';
import profileReducer from './profileReducer';

const rootReducer = combineReducers({
  profile: profileReducer,
  auth: authReducer
});

export default rootReducer;
