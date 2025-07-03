import { useAppDispatch, useAppSelector } from '../app/store';
import { 
  fetchBroadcasts,
  fetchMyBroadcasts,
  createBroadcast,
  replyToBroadcast,
  markBroadcastAsRead,
  setCurrentBroadcast,
  setRecording,
  clearError
} from '../app/store/slices/broadcastSlice';

export const useReduxBroadcasts = () => {
  const dispatch = useAppDispatch();
  const broadcastState = useAppSelector((state) => state.broadcast);

  const loadBroadcasts = async () => {
    try {
      await dispatch(fetchBroadcasts()).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const loadMyBroadcasts = async () => {
    try {
      await dispatch(fetchMyBroadcasts()).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const createNewBroadcast = async (data: any) => {
    try {
      await dispatch(createBroadcast(data)).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const replyBroadcast = async (broadcastId: number, voice_file: any) => {
    try {
      const result = await dispatch(replyToBroadcast({ broadcastId, voice_file })).unwrap();
      return { success: true, conversation: result.conversation };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const markAsRead = async (broadcastId: number) => {
    try {
      await dispatch(markBroadcastAsRead(broadcastId)).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const selectBroadcast = (broadcast: any) => {
    dispatch(setCurrentBroadcast(broadcast));
  };

  const setIsRecording = (recording: boolean) => {
    dispatch(setRecording(recording));
  };

  const clearBroadcastError = () => {
    dispatch(clearError());
  };

  return {
    ...broadcastState,
    loadBroadcasts,
    loadMyBroadcasts,
    createBroadcast: createNewBroadcast,
    replyToBroadcast: replyBroadcast,
    markBroadcastAsRead: markAsRead,
    setCurrentBroadcast: selectBroadcast,
    setRecording: setIsRecording,
    clearError: clearBroadcastError,
  };
};