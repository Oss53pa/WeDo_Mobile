/**
 * useUser Hook
 * Custom hook for user profile state and actions.
 */
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '@store/store';
import {
  fetchUserProfile,
  updateUserProfile,
  fetchUserStatistics,
  fetchMobileMoneyAccounts,
  addMobileMoneyAccount,
  removeMobileMoneyAccount,
  clearUserData,
  clearError,
} from '@store/slices/user.slice';
import {User, MobileMoneyAccount} from '@types';

export const useUser = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {profile, statistics, mobileMoneyAccounts, isLoading, error} =
    useSelector((state: RootState) => state.user);

  return {
    profile,
    statistics,
    mobileMoneyAccounts,
    isLoading,
    error,
    fetchUserProfile: () => dispatch(fetchUserProfile()).unwrap(),
    updateUserProfile: (data: Partial<User>) =>
      dispatch(updateUserProfile(data)).unwrap(),
    fetchUserStatistics: () => dispatch(fetchUserStatistics()).unwrap(),
    fetchMobileMoneyAccounts: () =>
      dispatch(fetchMobileMoneyAccounts()).unwrap(),
    addMobileMoneyAccount: (
      account: Omit<MobileMoneyAccount, 'id' | 'userId' | 'createdAt'>,
    ) => dispatch(addMobileMoneyAccount(account)).unwrap(),
    removeMobileMoneyAccount: (accountId: string) =>
      dispatch(removeMobileMoneyAccount(accountId)).unwrap(),
    clearUserData: () => dispatch(clearUserData()),
    clearError: () => dispatch(clearError()),
  };
};

export default useUser;
