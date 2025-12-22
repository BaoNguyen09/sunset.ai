'use client';

import { useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { updateChatVisibility } from '@/app/(chat)/actions';
import {
  getChatHistoryPaginationKey,
  type ChatHistory,
} from '@/components/sidebar-history';
import type { VisibilityType } from '@/components/visibility-selector';

export function useChatVisibility({
  chatId,
  initialVisibilityType,
  workspaceId,
}: {
  chatId: string;
  initialVisibilityType: VisibilityType;
  workspaceId?: string | null;
}) {
  const { mutate, cache } = useSWRConfig();
  const history: ChatHistory = cache.get('/api/history')?.data;

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibilityType,
    },
  );

  const visibilityType = useMemo(() => {
    if (!history) return localVisibility;
    const chat = history.chats.find((chat) => chat.id === chatId);
    if (!chat) return 'private';
    return chat.visibility;
  }, [history, chatId, localVisibility]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    setLocalVisibility(updatedVisibilityType);
    
    // Get workspaceId from chat data if not provided, or from localStorage
    const chatWorkspaceId = workspaceId || 
      history?.chats.find((chat) => chat.id === chatId)?.workspaceId ||
      (typeof window !== 'undefined' ? localStorage.getItem('sunsetLastWorkspace') : null);
    
    if (chatWorkspaceId) {
      mutate(unstable_serialize(getChatHistoryPaginationKey(chatWorkspaceId)));
    }

    updateChatVisibility({
      chatId: chatId,
      visibility: updatedVisibilityType,
    });
  };

  return { visibilityType, setVisibilityType };
}
