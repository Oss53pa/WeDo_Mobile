/**
 * useTontines Hook
 * Custom hook for tontine state and actions
 */

import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '@store/store';
import {
  fetchMyTontines,
  fetchPublicTontines,
  fetchTontineDetail,
  createTontine,
  joinTontine,
  leaveTontine,
  clearError,
  setFilters,
  clearCurrentTontine,
} from '@store/slices/tontine.slice';
import {
  CreateTontineData,
  JoinTontineRequest,
  TontineFilters,
} from '@types';

export const useTontines = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    myTontines,
    activeTontines,
    completedTontines,
    publicTontines,
    currentTontine,
    isLoading,
    error,
    filters,
  } = useSelector((state: RootState) => state.tontine);

  const handleFetchMyTontines = async (_userId?: string) => {
    return dispatch(fetchMyTontines()).unwrap();
  };

  const handleFetchPublicTontines = async (newFilters?: TontineFilters) => {
    return dispatch(fetchPublicTontines(newFilters || {})).unwrap();
  };

  const handleFetchTontineDetail = async (tontineId: string) => {
    return dispatch(fetchTontineDetail(tontineId)).unwrap();
  };

  const handleCreateTontine = async (data: CreateTontineData) => {
    return dispatch(createTontine(data)).unwrap();
  };

  const handleJoinTontine = async (data: JoinTontineRequest) => {
    return dispatch(joinTontine(data)).unwrap();
  };

  const handleLeaveTontine = async (tontineId: string) => {
    return dispatch(leaveTontine(tontineId)).unwrap();
  };

  const handleSetFilters = (newFilters: TontineFilters) => {
    dispatch(setFilters(newFilters));
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearCurrentTontine = () => {
    dispatch(clearCurrentTontine());
  };

  return {
    // State
    myTontines,
    activeTontines,
    completedTontines,
    publicTontines,
    currentTontine,
    isLoading,
    error,
    filters,

    // Actions
    fetchMyTontines: handleFetchMyTontines,
    fetchPublicTontines: handleFetchPublicTontines,
    fetchTontineDetail: handleFetchTontineDetail,
    createTontine: handleCreateTontine,
    joinTontine: handleJoinTontine,
    leaveTontine: handleLeaveTontine,
    setFilters: handleSetFilters,
    clearError: handleClearError,
    clearCurrentTontine: handleClearCurrentTontine,
  };
};

export default useTontines;
