/**
 * useAuth Hook
 * Custom hook for authentication state and actions (Supabase OTP flow).
 */
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '@store/store';
import {
  sendOtp,
  verifyOtp,
  logout,
  clearError,
  demoLogin,
} from '@store/slices/auth.slice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {user, isAuthenticated, isLoading, error, otpSent, pendingEmail, pendingPhone} =
    useSelector((state: RootState) => state.auth);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    otpSent,
    pendingEmail,
    pendingPhone,
    sendOtp: (params: {
      channel?: 'email' | 'phone';
      email?: string;
      phone?: string;
      fullName?: string;
    }) => dispatch(sendOtp(params)).unwrap(),
    verifyOtp: (params: {
      channel?: 'email' | 'phone';
      email?: string;
      phone?: string;
      token: string;
    }) => dispatch(verifyOtp(params)).unwrap(),
    logout: () => dispatch(logout()).unwrap(),
    demoLogin: () => dispatch(demoLogin()),
    clearError: () => dispatch(clearError()),
  };
};

export default useAuth;
