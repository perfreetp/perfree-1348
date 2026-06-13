import type { WorkOrder } from '@/types';

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'wo-001',
    title: '人民路156号阀门井漏水维修',
    type: 'repair',
    status: 'processing',
    priority: 'medium',
    hazardId: 'hz-001',
    facilityId: 'fv-0012',
    facilityName: '人民路阀门井#012',
    location: '人民路156号东侧人行道',
    description: '更换DN200阀门密封垫，清理井室积水',
    images: ['https://picsum.photos/id/1080/750/500'],
    assignee: 'u001',
    assigneeName: '张建国',
    createdBy: '调度中心',
    createdAt: '2026-06-13 09:20',
    startedAt: '2026-06-13 10:30',
    deadline: '今日 16:00',
    isOverdue: true,
    spareParts: [
      {
        id: 'sp-001',
        partId: 'p-dn200-seal',
        partName: 'DN200阀门密封垫',
        specification: '丁腈橡胶',
        quantity: 1,
        unit: '套',
        usedAt: '2026-06-13 10:45',
        operator: '张建国'
      },
      {
        id: 'sp-002',
        partId: 'p-bolt-m16',
        partName: 'M16不锈钢螺栓组',
        specification: 'M16*80',
        quantity: 8,
        unit: '套',
        usedAt: '2026-06-13 10:48',
        operator: '张建国'
      }
    ],
    valveOperations: [
      {
        id: 'vo-001',
        facilityId: 'fv-0011',
        facilityName: '人民路控制阀#011',
        operationType: 'close',
        turns: 12,
        operator: '张建国',
        operatedAt: '2026-06-13 10:35',
        beforePressure: 0.32,
        afterPressure: 0,
        remarks: '上游阀门关闭完成'
      }
    ],
    historyLogs: [
      { id: 'log-1', action: '工单创建', operator: '调度中心', timestamp: '2026-06-13 09:20' },
      { id: 'log-2', action: '工单派发', operator: '调度中心', timestamp: '2026-06-13 09:22' },
      { id: 'log-3', action: '开始施工', operator: '张建国', timestamp: '2026-06-13 10:30', remarks: '已到达现场，关闭上游阀门' }
    ]
  },
  {
    id: 'wo-002',
    title: '工业园消火栓压力排查处理',
    type: 'maintenance',
    status: 'pending',
    priority: 'high',
    hazardId: 'hz-002',
    facilityId: 'fh-0028',
    facilityName: '工业园消火栓#028',
    location: '工业园A区3号厂房南侧',
    description: '检查减压阀工作状态，疏通管道，必要时更换部件',
    images: ['https://picsum.photos/id/835/750/500'],
    assignee: 'u001',
    assigneeName: '张建国',
    createdBy: '调度中心',
    createdAt: '2026-06-13 09:50',
    deadline: '今日 18:00',
    isOverdue: false,
    spareParts: [],
    valveOperations: [],
    historyLogs: [
      { id: 'log-1', action: '工单创建', operator: '调度中心', timestamp: '2026-06-13 09:50' },
      { id: 'log-2', action: '工单派发', operator: '调度中心', timestamp: '2026-06-13 09:52' }
    ]
  },
  {
    id: 'wo-003',
    title: '长江路井盖紧急更换',
    type: 'emergency',
    status: 'completed',
    priority: 'high',
    hazardId: 'hz-003',
    facilityId: 'fv-0035',
    facilityName: '长江路阀门井#035',
    location: '长江路238号机动车道上',
    description: '紧急更换球墨铸铁井盖及井圈，设置安全警示',
    assignee: 'u001',
    assigneeName: '张建国',
    createdBy: '调度中心',
    createdAt: '2026-06-13 07:35',
    startedAt: '2026-06-13 07:50',
    completedAt: '2026-06-13 09:10',
    deadline: '今日 10:00',
    isOverdue: false,
    spareParts: [
      {
        id: 'sp-003',
        partId: 'p-manhole-700',
        partName: '球墨铸铁井盖总成',
        specification: 'Φ700 D400级',
        quantity: 1,
        unit: '套',
        usedAt: '2026-06-13 08:20',
        operator: '张建国'
      }
    ],
    valveOperations: [],
    resolution: '已完成井盖及井圈更换，恢复交通通行',
    historyLogs: [
      { id: 'log-1', action: '紧急工单创建', operator: '调度中心', timestamp: '2026-06-13 07:35' },
      { id: 'log-2', action: '人员响应', operator: '张建国', timestamp: '2026-06-13 07:42', remarks: '已出发前往现场' },
      { id: 'log-3', action: '现场施工', operator: '张建国', timestamp: '2026-06-13 07:50', remarks: '设置路障警示，开始更换' },
      { id: 'log-4', action: '施工完成', operator: '张建国', timestamp: '2026-06-13 09:10', remarks: '更换完成，路面恢复' },
      { id: 'log-5', action: '工单验收', operator: '调度中心', timestamp: '2026-06-13 09:15' }
    ]
  },
  {
    id: 'wo-004',
    title: '新华小区暗漏点定位及维修',
    type: 'repair',
    status: 'pending',
    priority: 'low',
    hazardId: 'hz-004',
    facilityName: '新华小区支管',
    location: '新华小区12号楼北侧绿化带',
    description: '使用听漏仪精确定位漏水点，开挖修复PE管道',
    assignee: 'u001',
    assigneeName: '张建国',
    createdBy: '调度中心',
    createdAt: '2026-06-13 02:00',
    deadline: '明日 17:00',
    isOverdue: false,
    spareParts: [],
    valveOperations: [],
    historyLogs: [
      { id: 'log-1', action: '工单创建', operator: '调度中心', timestamp: '2026-06-13 02:00' }
    ]
  }
];
