import { fetchAccountAPI } from "@/services/api";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

// cái này là thunk
export const fetchAccountThunk = createAsyncThunk(
  "auth/fetchAccount", // ✅ tên action: dùng để sinh ra các action phụ
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await fetchAccountAPI();
      if (res && res.data) {
        dispatch(setAuth({ isAuthenticated: true, user: res.data.user }));
        return res.data; // ✅ // thành công: sẽ kích hoạt fulfilled
      }
      return rejectWithValue("Không nhận được dữ liệu!"); //❌ // lỗi: sẽ kích hoạt rejected
    } catch (error: any) {
      return rejectWithValue(
        error.mesage || "Lấy thông tin tài khoản thất bại!" // ❌ // lỗi
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{ isAuthenticated: boolean; user: IUser | null }>
    ) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      state.user = action.payload.user;
      state.error = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
    },
  },

  // cái này là thunk
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchAccountThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;
