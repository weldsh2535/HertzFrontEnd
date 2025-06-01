// src/redux/profileReducer.js
import { createSlice } from '@reduxjs/toolkit';
import { updateProfile, uploadAvatar, fetchProfile } from '../actions/profileActions';

const initialState = {
  user: null,
  loading: false,
  error: null,
  success: false,
  avatarUploading: false,
  avatarError: null
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    resetProfileState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.avatarUploading = false;
      state.avatarError = null;
    },
    setProfile: (state, action) => {
      state.user = action.payload;
    },
    clearProfileError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.success = true;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Upload Avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.avatarUploading = true;
        state.avatarError = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.avatarUploading = false;
        if (state.user) {
          state.user.avatar = action.payload.avatar;
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.avatarUploading = false;
        state.avatarError = action.payload;
      })

      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetProfileState, setProfile, clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;

// Selectors
export const selectProfile = (state) => state.profile.user;
export const selectProfileLoading = (state) => state.profile.loading;
export const selectProfileError = (state) => state.profile.error;
export const selectProfileSuccess = (state) => state.profile.success;
export const selectAvatarUploading = (state) => state.profile.avatarUploading;
export const selectAvatarError = (state) => state.profile.avatarError;