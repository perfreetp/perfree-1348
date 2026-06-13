import { create } from 'zustand';
import type { UserInfo, TeamMember, OfflineDataItem } from '@/types';

interface AppState {
  user: UserInfo;
  teamMembers: TeamMember[];
  offlineData: OfflineDataItem[];
  isOnline: boolean;
  lastSyncTime: string;
  pendingSyncCount: number;

  setUser: (user: UserInfo) => void;
  setTeamMembers: (members: TeamMember[]) => void;
  toggleOnline: () => void;
  addOfflineData: (item: OfflineDataItem) => void;
  removeOfflineData: (id: string) => void;
  markAllSynced: () => void;
  markItemSynced: (id: string) => void;
  clearOfflineData: () => void;
  clearSyncedData: () => void;
  updateLastSyncTime: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: {
    id: 'u001',
    name: '张建国',
    avatar: 'https://picsum.photos/id/64/200/200',
    team: '城东巡检一班',
    role: '高级巡检员',
    phone: '138****8888'
  },
  teamMembers: [
    {
      id: 'u002',
      name: '李明',
      avatar: 'https://picsum.photos/id/91/200/200',
      lat: 31.231,
      lng: 121.473,
      lastUpdate: '10分钟前',
      status: 'online',
      currentTask: '人民路主干管巡检'
    },
    {
      id: 'u003',
      name: '王芳',
      avatar: 'https://picsum.photos/id/177/200/200',
      lat: 31.235,
      lng: 121.478,
      lastUpdate: '5分钟前',
      status: 'online',
      currentTask: '工业园区消火栓检查'
    },
    {
      id: 'u004',
      name: '赵伟',
      avatar: 'https://picsum.photos/id/338/200/200',
      lat: 31.229,
      lng: 121.469,
      lastUpdate: '25分钟前',
      status: 'offline'
    }
  ],
  offlineData: [],
  isOnline: true,
  lastSyncTime: '',
  pendingSyncCount: 0,

  setUser: (user) => set({ user }),
  setTeamMembers: (teamMembers) => set({ teamMembers }),
  toggleOnline: () => set((s) => ({ isOnline: !s.isOnline })),
  addOfflineData: (item) =>
    set((s) => ({
      offlineData: [...s.offlineData, item],
      pendingSyncCount: s.pendingSyncCount + 1
    })),
  removeOfflineData: (id) =>
    set((s) => ({
      offlineData: s.offlineData.filter((i) => i.id !== id),
      pendingSyncCount: Math.max(0, s.pendingSyncCount - 1)
    })),
  markAllSynced: () =>
    set((s) => ({
      offlineData: s.offlineData.map((i) => ({ ...i, synced: true })),
      pendingSyncCount: 0
    })),
  markItemSynced: (id) =>
    set((s) => {
      const exists = s.offlineData.find((i) => i.id === id);
      if (!exists || exists.synced) return {};
      return {
        offlineData: s.offlineData.map((i) =>
          i.id === id ? { ...i, synced: true } : i
        ),
        pendingSyncCount: Math.max(0, s.pendingSyncCount - 1)
      };
    }),
  clearOfflineData: () =>
    set(() => ({
      offlineData: [],
      pendingSyncCount: 0
    })),
  clearSyncedData: () =>
    set((s) => {
      const pending = s.offlineData.filter((i) => !i.synced);
      return {
        offlineData: pending,
        pendingSyncCount: pending.length
      };
    }),
  updateLastSyncTime: () => {
    const now = new Date();
    const time = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    set({ lastSyncTime: time });
    console.log('[AppStore] 更新同步时间:', time);
  }
}));
