import { create } from 'zustand';

interface UnsavedChangesState {
  isDirty: boolean;
  message: string;
  setDirty: (isDirty: boolean, message?: string) => void;
}

const DEFAULT_MESSAGE = 'Bạn có thay đổi chưa lưu. Rời khỏi trang sẽ mất các thay đổi này.';

/** Cross-page guard so any admin form can warn before in-app navigation or tab close, without a data-router. */
export const useUnsavedChangesStore = create<UnsavedChangesState>((set) => ({
  isDirty: false,
  message: DEFAULT_MESSAGE,
  setDirty: (isDirty, message = DEFAULT_MESSAGE) => set({ isDirty, message }),
}));
