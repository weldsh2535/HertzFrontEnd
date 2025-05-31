import { 
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGOUT
} from '../actions/types';

const initialState = {
  token: null,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

export default (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case LOGIN_SUCCESS:
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null
      };
      
    case LOGIN_FAILURE:
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
      
    case LOGOUT:
      return initialState;
      
    default:
      return state;
  }
};