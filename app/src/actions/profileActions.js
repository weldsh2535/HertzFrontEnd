import { createAsyncThunk } from '@reduxjs/toolkit';

export const updateProfile = createAsyncThunk(
    'profile/update',
    async (profileData, { rejectWithValue }) => {
      try {
        // This action now just manages the Redux state
        // The actual mutation happens in the component
        return profileData;
      } catch (error) {
        return rejectWithValue(error.message);
      }
    }
  );