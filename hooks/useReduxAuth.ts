import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store';
import { 
  login as loginAction,
  logout as logoutAction,
  loadStoredAuth,
  updateProfile,
  clearError
} from '../app/store/slices/authSlice';
import { useAuth } from './useAuth';

export const useReduxAuth = () => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);
  const { logout: contextLogout } = useAuth();

  // Load stored auth on mount
  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  const login = async (phone_number: string, password: string) => {
    try {
      await dispatch(loginAction({ phone_number, password })).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await dispatch(logoutAction()).unwrap();
    // Also logout from context for compatibility
    await contextLogout();
  };

  const updateUserProfile = async (data: any) => {
    try {
      await dispatch(updateProfile(data)).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    ...authState,
    login,
    logout,
    updateProfile: updateUserProfile,
    clearError: clearAuthError,
  };
};