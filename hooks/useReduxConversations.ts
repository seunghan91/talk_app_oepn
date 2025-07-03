import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store';
import { 
  fetchConversations,
  fetchConversation,
  sendMessage,
  toggleFavorite,
  deleteConversation,
  markAsRead,
  clearCurrentConversation,
  clearError
} from '../app/store/slices/conversationSlice';

export const useReduxConversations = () => {
  const dispatch = useAppDispatch();
  const conversationState = useAppSelector((state) => state.conversation);

  const loadConversations = async () => {
    try {
      await dispatch(fetchConversations()).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const loadConversation = async (conversationId: number) => {
    try {
      await dispatch(fetchConversation(conversationId)).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const sendNewMessage = async (conversationId: number, data: any) => {
    try {
      await dispatch(sendMessage({ conversationId, ...data })).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const toggleConversationFavorite = async (conversationId: number) => {
    try {
      await dispatch(toggleFavorite(conversationId)).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const removeConversation = async (conversationId: number) => {
    try {
      await dispatch(deleteConversation(conversationId)).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const markConversationAsRead = async (conversationId: number) => {
    try {
      await dispatch(markAsRead(conversationId)).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const clearConversation = () => {
    dispatch(clearCurrentConversation());
  };

  const clearConversationError = () => {
    dispatch(clearError());
  };

  return {
    ...conversationState,
    loadConversations,
    loadConversation,
    sendMessage: sendNewMessage,
    toggleFavorite: toggleConversationFavorite,
    deleteConversation: removeConversation,
    markAsRead: markConversationAsRead,
    clearCurrentConversation: clearConversation,
    clearError: clearConversationError,
  };
};