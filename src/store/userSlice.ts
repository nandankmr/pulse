// src/store/userSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  name: string;
  email: string;
}

const initialState: UserState = {
  name: '',
  email: '',
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      return { ...state, ...action.payload };
    },
    clearUser: () => initialState,
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
