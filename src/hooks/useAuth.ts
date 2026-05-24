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

  const {user, isAuthenticated, isLoading, error, otpSent, pendingEmail} =
    useSelector((state: RootState) => state.auth);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    otpSent,
    pendingEmail,
    sendOtp: (params: {email: string; fullName?: string; phone?: string}) =>
      dispatch(sendOtp(params)).unwrap(),
    verifyOtp: (params: {email: string; token: string}) =>
      dispatch(verifyOtp(params)).unwrap(),
    logout: () => dispatch(logout()).unwrap(),
    demoLogin: () => dispatch(demoLogin()),
    clearError: () => dispatch(clearError()),
  };
};

export default useAuth;
