export {};

export type DesktopUpdateStatus = {
  state: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error';
  version?: string;
  percent?: number;
  message?: string;
};

declare global {
  interface Window {
    autoGestionUpdater?: {
      getStatus: () => Promise<DesktopUpdateStatus>;
      checkForUpdates: () => void;
      installUpdate: () => void;
      onStatus: (callback: (status: DesktopUpdateStatus) => void) => () => void;
    };
  }
}
