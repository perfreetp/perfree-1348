import type { Facility } from '@/types';

export const mockFacilities: Facility[] = [
  {
    id: 'fv-0012',
    code: 'FV-RM-0012',
    name: '人民路阀门井#012',
    type: 'valve',
    status: 'maintenance',
    location: '人民路156号东侧人行道',
    lat: 31.2315,
    lng: 121.4718,
    installedAt: '2015-08-20',
    lastInspection: '2026-06-08',
    lastMaintenance: '2026-06-13',
    manufacturer: '冠龙阀门',
    specification: '软密封闸阀',
    diameter: 'DN200',
    pressureRating: '1.0MPa',
    zone: '城东片区A区',
    qrCode: 'QR-FV0012',
    historyRecords: [
      { id: 'fr-1', type: 'inspection', date: '2026-06-08', operator: '李明', result: '正常' },
      { id: 'fr-2', type: 'inspection', date: '2026-05-20', operator: '张建国', result: '正常' },
      { id: 'fr-3', type: 'repair', date: '2026-06-13', operator: '张建国', result: '更换密封垫', remark: '因漏水维修' }
    ]
  },
  {
    id: 'fh-0028',
    code: 'FH-GY-0028',
    name: '工业园消火栓#028',
    type: 'hydrant',
    status: 'damaged',
    location: '工业园A区3号厂房南侧',
    lat: 31.2342,
    lng: 121.4756,
    installedAt: '2019-11-10',
    lastInspection: '2026-06-13',
    manufacturer: '上海消防',
    specification: '地上式室外消火栓',
    diameter: 'DN100',
    pressureRating: '1.6MPa',
    zone: '城东工业园区',
    qrCode: 'QR-FH0028',
    historyRecords: [
      { id: 'fr-4', type: 'inspection', date: '2026-06-13', operator: '张建国', result: '压力不足', remark: '0.08MPa' },
      { id: 'fr-5', type: 'maintenance', date: '2026-03-15', operator: '王芳', result: '加油润滑', remark: '季度保养' }
    ]
  },
  {
    id: 'fv-0035',
    code: 'FV-CJ-0035',
    name: '长江路阀门井#035',
    type: 'valve',
    status: 'normal',
    location: '长江路238号机动车道上',
    lat: 31.2367,
    lng: 121.4689,
    installedAt: '2012-05-08',
    lastInspection: '2026-06-13',
    lastMaintenance: '2026-06-13',
    manufacturer: '苏州阀门',
    specification: '明杆闸阀',
    diameter: 'DN300',
    pressureRating: '1.0MPa',
    zone: '城北片区B区',
    qrCode: 'QR-FV0035',
    historyRecords: [
      { id: 'fr-6', type: 'repair', date: '2026-06-13', operator: '张建国', result: '更换井盖总成', remark: '井盖破损紧急更换' },
      { id: 'fr-7', type: 'inspection', date: '2026-05-30', operator: '李明', result: '正常' }
    ]
  },
  {
    id: 'fv-0041',
    code: 'FV-KD-0041',
    name: '科技大道排气阀#041',
    type: 'valve',
    status: 'damaged',
    location: '科技大道与创新路交叉口',
    lat: 31.2389,
    lng: 121.4791,
    installedAt: '2021-03-25',
    lastInspection: '2026-06-13',
    manufacturer: '上海沃茨',
    specification: '复合式排气阀',
    diameter: 'DN80',
    pressureRating: '1.6MPa',
    zone: '科技新区',
    qrCode: 'QR-FV0041',
    historyRecords: [
      { id: 'fr-8', type: 'inspection', date: '2026-06-13', operator: '李明', result: '异常排气' }
    ]
  },
  {
    id: 'fh-0056',
    code: 'FH-ZH-0056',
    name: '中山路消火栓#056',
    type: 'hydrant',
    status: 'normal',
    location: '中山路89号银行门口',
    lat: 31.2331,
    lng: 121.4734,
    installedAt: '2018-09-12',
    lastInspection: '2026-06-11',
    lastMaintenance: '2026-03-10',
    manufacturer: '上海消防',
    specification: '地上式室外消火栓',
    diameter: 'DN150',
    pressureRating: '1.6MPa',
    zone: '城中心商业区',
    qrCode: 'QR-FH0056',
    historyRecords: [
      { id: 'fr-9', type: 'inspection', date: '2026-06-11', operator: '王芳', result: '正常', remark: '压力0.35MPa' },
      { id: 'fr-10', type: 'maintenance', date: '2026-03-10', operator: '王芳', result: '季度保养完成' }
    ]
  },
  {
    id: 'fv-0063',
    code: 'FV-JS-0063',
    name: '解放路控制阀#063',
    type: 'valve',
    status: 'normal',
    location: '解放路与和平路交叉口西北角',
    lat: 31.2298,
    lng: 121.4701,
    installedAt: '2016-12-18',
    lastInspection: '2026-06-10',
    manufacturer: '冠龙阀门',
    specification: '蝶阀',
    diameter: 'DN500',
    pressureRating: '1.0MPa',
    zone: '城南片区C区',
    qrCode: 'QR-FV0063',
    historyRecords: [
      { id: 'fr-11', type: 'inspection', date: '2026-06-10', operator: '李明', result: '正常' },
      { id: 'fr-12', type: 'inspection', date: '2026-05-15', operator: '张建国', result: '正常' }
    ]
  }
];
