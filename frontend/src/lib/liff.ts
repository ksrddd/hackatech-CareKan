import liff from '@line/liff';
import { useEffect, useState } from 'react';

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string;

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface LiffState {
  ready: boolean;
  isInLiff: boolean;
  profile: LiffProfile | null;
}

let initialized = false;

export function useLiff(): LiffState {
  const [state, setState] = useState<LiffState>({
    ready: false,
    isInLiff: false,
    profile: null,
  });

  useEffect(() => {
    if (!LIFF_ID || LIFF_ID === 'YOUR_LIFF_ID_HERE') {
      setState({ ready: true, isInLiff: false, profile: null });
      return;
    }

    async function init() {
      try {
        if (!initialized) {
          await liff.init({ liffId: LIFF_ID });
          initialized = true;
        }
        const isInLiff = liff.isInClient();
        let profile: LiffProfile | null = null;
        if (liff.isLoggedIn()) {
          profile = await liff.getProfile();
        }
        setState({ ready: true, isInLiff, profile });
      } catch {
        setState({ ready: true, isInLiff: false, profile: null });
      }
    }

    void init();
  }, []);

  return state;
}

export function closeLiff() {
  if (liff.isInClient()) liff.closeWindow();
}
