export type TaskStatus = 'todo' | 'doing' | 'done' | 'overdue';
export type HazardLevel = 'minor' | 'moderate' | 'major' | 'severe';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'closed';
export type FacilityType = 'valve' | 'hydrant';
export type CheckInType = 'arrive' | 'leave' | 'scan';

export interface UserInfo {
  id: string;
  name: string;
  avatar: string;
  team: string;
  role: string;
  phone: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  lat: number;
  lng: number;
  lastUpdate: string;
  status: 'online' | 'offline';
  currentTask?: string;
}

export interface InspectionPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: FacilityType;
  facilityId?: string;
  checked?: boolean;
  checkInTime?: string;
  order?: number;
}

export interface InspectionTask {
  id: string;
  title: string;
  planId: string;
  routeName: string;
  status: TaskStatus;
  priority: 'high' | 'medium' | 'low';
  startTime: string;
  endTime: string;
  deadline: string;
  totalPoints: number;
  checkedPoints: number;
  points: InspectionPoint[];
  assignee: string;
  description: string;
  isOverdue?: boolean;
  createdAt: string;
}

export interface HazardReport {
  id: string;
  title: string;
  description: string;
  level: HazardLevel;
  type: string;
  facilityId?: string;
  facilityName?: string;
  location: string;
  lat: number;
  lng: number;
  images: string[];
  videos?: string[];
  waterLeakNoise?: number;
  pressureReading?: number;
  reporterId: string;
  reporterName: string;
  reportTime: string;
  status: 'reported' | 'assigned' | 'processing' | 'resolved' | 'closed';
  workOrderId?: string;
  remarks?: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  type: 'repair' | 'maintenance' | 'valve_operation' | 'emergency';
  status: OrderStatus;
  priority: 'high' | 'medium' | 'low';
  hazardId?: string;
  facilityId?: string;
  facilityName: string;
  location: string;
  description: string;
  images?: string[];
  assignee: string;
  assigneeName: string;
  createdBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  deadline: string;
  spareParts?: SparePartUsage[];
  valveOperations?: ValveOperation[];
  historyLogs?: HistoryLog[];
  resolution?: string;
  isOverdue?: boolean;
}

export interface SparePartUsage {
  id: string;
  partId: string;
  partName: string;
  specification: string;
  quantity: number;
  unit: string;
  usedAt: string;
  operator: string;
  remarks?: string;
}

export interface ValveOperation {
  id: string;
  facilityId: string;
  facilityName: string;
  operationType: 'open' | 'close';
  turns: number;
  operator: string;
  operatedAt: string;
  beforePressure?: number;
  afterPressure?: number;
  remarks?: string;
}

export interface HistoryLog {
  id: string;
  action: string;
  operator: string;
  timestamp: string;
  remarks?: string;
}

export interface Facility {
  id: string;
  code: string;
  name: string;
  type: FacilityType;
  status: 'normal' | 'damaged' | 'maintenance';
  location: string;
  lat: number;
  lng: number;
  installedAt: string;
  lastInspection: string;
  lastMaintenance?: string;
  manufacturer?: string;
  specification?: string;
  diameter?: string;
  pressureRating?: string;
  zone?: string;
  remark?: string;
  qrCode?: string;
  historyRecords?: FacilityRecord[];
}

export interface FacilityRecord {
  id: string;
  type: 'inspection' | 'maintenance' | 'repair';
  date: string;
  operator: string;
  result: string;
  remark?: string;
}

export interface DailyStats {
  date: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalPoints: number;
  checkedPoints: number;
  hazardsReported: number;
  ordersCompleted: number;
  workDuration: number;
  distance: number;
}

export interface MonthlyStats {
  month: string;
  dailyStats: DailyStats[];
  taskCompletionRate: number;
  pointCheckRate: number;
  hazardTrend: { date: string; count: number }[];
  hazardLevelDistribution: { level: HazardLevel; count: number }[];
}

export interface OfflineDataItem {
  id: string;
  type: 'task_checkin' | 'hazard_report' | 'workorder';
  data: unknown;
  createdAt: string;
  synced: boolean;
  syncError?: string;
}

export interface QuickEntryItem {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'point' | 'facility' | 'team' | 'hazard';
  status?: string;
  data?: unknown;
}
