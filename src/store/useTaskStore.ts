import { create } from 'zustand';
import type { InspectionTask, HazardReport, WorkOrder, Facility, DailyStats, MonthlyStats, TaskStatus } from '@/types';
import { mockTasks } from '@/data/mockTasks';
import { mockHazards } from '@/data/mockHazards';
import { mockWorkOrders } from '@/data/mockWorkOrders';
import { mockFacilities } from '@/data/mockFacilities';

interface TaskState {
  tasks: InspectionTask[];
  hazards: HazardReport[];
  workOrders: WorkOrder[];
  facilities: Facility[];
  currentTask: InspectionTask | null;
  dailyStats: DailyStats | null;
  monthlyStats: MonthlyStats | null;
  filter: {
    taskStatus: TaskStatus | 'all';
    orderStatus: string;
    hazardLevel: string;
    keyword: string;
  };

  setFilter: (key: string, value: string) => void;
  setCurrentTask: (task: InspectionTask | null) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  checkInPoint: (taskId: string, pointId: string) => void;
  addHazard: (hazard: HazardReport) => void;
  updateHazardStatus: (hazardId: string, status: string) => void;
  addWorkOrder: (order: WorkOrder) => void;
  updateWorkOrderStatus: (orderId: string, status: string) => void;
  addSparePart: (orderId: string, part: unknown) => void;
  addValveOperation: (orderId: string, op: unknown) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: mockTasks,
  hazards: mockHazards,
  workOrders: mockWorkOrders,
  facilities: mockFacilities,
  currentTask: null,
  dailyStats: {
    date: '2026-06-13',
    totalTasks: 5,
    completedTasks: 2,
    overdueTasks: 1,
    totalPoints: 18,
    checkedPoints: 9,
    hazardsReported: 3,
    ordersCompleted: 1,
    workDuration: 6.5,
    distance: 12.8
  },
  monthlyStats: {
    month: '2026-06',
    dailyStats: [],
    taskCompletionRate: 87.5,
    pointCheckRate: 92.3,
    hazardTrend: [
      { date: '06-07', count: 4 },
      { date: '06-08', count: 6 },
      { date: '06-09', count: 3 },
      { date: '06-10', count: 7 },
      { date: '06-11', count: 5 },
      { date: '06-12', count: 4 },
      { date: '06-13', count: 3 }
    ],
    hazardLevelDistribution: [
      { level: 'minor', count: 18 },
      { level: 'moderate', count: 9 },
      { level: 'major', count: 3 },
      { level: 'severe', count: 1 }
    ]
  },
  filter: {
    taskStatus: 'all',
    orderStatus: 'all',
    hazardLevel: 'all',
    keyword: ''
  },

  setFilter: (key, value) =>
    set((s) => ({
      filter: { ...s.filter, [key]: value }
    })),

  setCurrentTask: (task) => {
    set({ currentTask: task });
    console.log('[TaskStore] 设置当前任务:', task?.id);
  },

  updateTaskStatus: (taskId, status) =>
    set((s) => {
      const tasks = s.tasks.map((t) =>
        t.id === taskId ? { ...t, status, isOverdue: false } : t
      );
      console.log('[TaskStore] 更新任务状态:', taskId, status);
      return { tasks };
    }),

  checkInPoint: (taskId, pointId) =>
    set((s) => {
      const tasks = s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const points = t.points.map((p) =>
          p.id === pointId ? { ...p, checked: true, checkInTime: timeStr } : p
        );
        const checkedPoints = points.filter((p) => p.checked).length;
        return { ...t, points, checkedPoints };
      });
      console.log('[TaskStore] 打卡成功:', taskId, pointId);
      return { tasks };
    }),

  addHazard: (hazard) =>
    set((s) => {
      console.log('[TaskStore] 新增隐患上报:', hazard.id);
      return { hazards: [hazard, ...s.hazards] };
    }),

  updateHazardStatus: (hazardId, status) =>
    set((s) => ({
      hazards: s.hazards.map((h) =>
        h.id === hazardId ? { ...h, status: status as HazardReport['status'] } : h
      )
    })),

  addWorkOrder: (order) =>
    set((s) => {
      console.log('[TaskStore] 新增工单:', order.id);
      return { workOrders: [order, ...s.workOrders] };
    }),

  updateWorkOrderStatus: (orderId, status) =>
    set((s) => ({
      workOrders: s.workOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: status as WorkOrder['status'],
              startedAt: status === 'processing' ? new Date().toISOString() : o.startedAt,
              completedAt: status === 'completed' ? new Date().toISOString() : o.completedAt
            }
          : o
      )
    })),

  addSparePart: (orderId, part) =>
    set((s) => ({
      workOrders: s.workOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              spareParts: [...(o.spareParts || []), part as never]
            }
          : o
      )
    })),

  addValveOperation: (orderId, op) =>
    set((s) => ({
      workOrders: s.workOrders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              valveOperations: [...(o.valveOperations || []), op as never]
            }
          : o
      )
    }))
}));
