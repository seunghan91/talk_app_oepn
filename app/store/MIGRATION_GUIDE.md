# Redux Migration Guide

This guide shows how to migrate existing components to use the new Redux store.

## Setup

The Redux store is already configured in the app. The store is wrapped around the entire app in `app/_layout.js`.

## Available Redux Slices

1. **authSlice** - Authentication state and user management
2. **userSlice** - User profiles and blocking
3. **conversationSlice** - Conversations and messages
4. **broadcastSlice** - Broadcasts management
5. **notificationSlice** - Push notifications and settings

## Custom Hooks

Use these custom hooks instead of direct Redux hooks:

- `useReduxAuth()` - Authentication operations
- `useReduxConversations()` - Conversation operations
- `useReduxBroadcasts()` - Broadcast operations

## Migration Example: Messages Screen

### Before (using local state and direct API calls):

```typescript
import { useState, useEffect } from 'react';
import axiosInstance from '../lib/axios';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchConversations();
  }, []);
  
  // ... rest of component
}
```

### After (using Redux):

```typescript
import { useEffect } from 'react';
import { useReduxConversations } from '../../hooks/useReduxConversations';

export default function MessagesScreen() {
  const { 
    conversations, 
    loading, 
    error,
    loadConversations,
    deleteConversation,
    toggleFavorite
  } = useReduxConversations();
  
  useEffect(() => {
    loadConversations();
  }, []);
  
  const handleDelete = async (conversationId: number) => {
    const result = await deleteConversation(conversationId);
    if (!result.success) {
      Alert.alert('Error', result.error);
    }
  };
  
  // ... rest of component
}
```

## Common Patterns

### 1. Loading Data on Component Mount

```typescript
useEffect(() => {
  // Load data when component mounts
  loadConversations();
}, []);
```

### 2. Handling Async Actions

```typescript
const handleSendMessage = async () => {
  const result = await sendMessage(conversationId, {
    message_type: 'text',
    content: messageText
  });
  
  if (result.success) {
    // Success handling
    setMessageText('');
  } else {
    // Error handling
    Alert.alert('Error', result.error);
  }
};
```

### 3. Using Redux State in Components

```typescript
const { conversations, loading, error, unreadCount } = useReduxConversations();

// Use in render
if (loading) return <ActivityIndicator />;
if (error) return <Text>Error: {error}</Text>;

return (
  <FlatList
    data={conversations}
    renderItem={({ item }) => <ConversationItem {...item} />}
  />
);
```

### 4. Dispatching Actions

```typescript
// Mark conversation as read when opening
const openConversation = async (conversationId: number) => {
  await markAsRead(conversationId);
  router.push(`/conversations/${conversationId}`);
};
```

## Benefits of Redux

1. **Centralized State** - All app state in one place
2. **Caching** - Data persists between screen navigations
3. **Optimistic Updates** - UI updates immediately
4. **Error Handling** - Consistent error management
5. **DevTools** - Debug with Redux DevTools

## Tips

1. Always check `result.success` for async actions
2. Use loading states from Redux instead of local state
3. Clear errors when appropriate using `clearError()`
4. Leverage cached data to reduce API calls
5. Use TypeScript for better type safety

## Gradual Migration

You don't need to migrate everything at once. You can:

1. Start with new features using Redux
2. Migrate critical flows first (auth, conversations)
3. Keep using existing context/hooks alongside Redux
4. Gradually refactor components as needed

## Example: Full Component Migration

See `app/(tabs)/messages_redux.tsx` for a complete example of a migrated component.