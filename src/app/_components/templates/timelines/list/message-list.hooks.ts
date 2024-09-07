import { useAuthUser } from "@luna/context/auth-user/auth-user";
import { listByUIDs } from "@luna/repository/firestore/account";
import { list, listBySnapshot } from "@luna/repository/firestore/messages";
import { Account } from "@luna/repository/firestore/model/account";
import { Message as BaseMessage } from "@luna/repository/firestore/model/message";
import { useCallback, useEffect, useRef, useState } from "react";

type Message = BaseMessage & {
  userName: string;
  userIcon: string;
  isMyMessage: boolean;
};

export const useMessages = (initialLimit = 20) => {
  const { authUser } = useAuthUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastOffset, setLastOffset] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // 取得済みのアカウントを保持するRef
  const fetchedAccountsRef = useRef<Map<string, Account>>(new Map());

  // メッセージにアカウント情報をマージする関数
  const mergeAccountsIntoMessages = async (rawMessages: BaseMessage[]): Promise<Message[]> => {
    // 取得済みのアカウントUIDはRefから取得
    const existingAccounts = fetchedAccountsRef.current;

    // 新しく取得すべきUIDを抽出
    const uidsToFetch = Array.from(new Set(rawMessages.map((msg) => msg.uid)))
      .filter(uid => !existingAccounts.has(uid));

    // 新しく必要なアカウントを取得
    let newAccounts: Account[] = [];
    if (uidsToFetch.length > 0) {
      newAccounts = await listByUIDs(uidsToFetch);
      // 新しいアカウントをRefに保存
      newAccounts.forEach((account) => {
        existingAccounts.set(account.uid, account);
      });
    }

    // メッセージにアカウント情報をマージ
    return rawMessages.map((msg) => {
      const account = existingAccounts.get(msg.uid) || { name: "Unknown", icon: "" };
      return {
        ...msg,
        userName: account.name,
        userIcon: account.icon,
        isMyMessage: authUser?.uid === msg.uid,
      };
    });
  };

  // リアルタイムで最新メッセージを取得 (listBySnapshot を利用)
  useEffect(() => {
    const unsubscribe = listBySnapshot(async (newMessages) => {
      const mergedMessages = await mergeAccountsIntoMessages(newMessages);
      setMessages((prevMessages) => {
        // ID で重複を防ぐ
        const newMessageIds = new Set(mergedMessages.map((msg) => msg.id));
        return [
          ...prevMessages.filter((msg) => !newMessageIds.has(msg.id)),
          ...mergedMessages,
        ];
      });
    }, initialLimit);

    return () => unsubscribe();
  }, [initialLimit, authUser]);

  // スクロールで過去のメッセージを追加読み込み (list を利用)
  const loadMoreMessages = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      const additionalMessages = await list(initialLimit, lastOffset);
      if (additionalMessages.length === 0) {
        setHasMore(false); // これ以上メッセージがない場合
      } else {
        const mergedMessages = await mergeAccountsIntoMessages(additionalMessages);
        setMessages((prevMessages) => {
          // ID で重複を防ぐ
          const newMessageIds = new Set(mergedMessages.map((msg) => msg.id));
          return [
            ...prevMessages.filter((msg) => !newMessageIds.has(msg.id)),
            ...mergedMessages,
          ];
        });
        setLastOffset(lastOffset + mergedMessages.length);
      }
    } catch (error) {
      console.error("Failed to load more messages: ", error);
    }

    setIsLoading(false);
  }, [isLoading, hasMore, initialLimit, lastOffset, authUser]);

  return {
    messages,
    loadMoreMessages,
    hasMore,
    isLoading,
  };
};