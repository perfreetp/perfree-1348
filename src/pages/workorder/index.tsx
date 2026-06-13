import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import WorkOrderCard from '@/components/WorkOrderCard';
import EmptyState from '@/components/EmptyState';
import { useTaskStore } from '@/store/useTaskStore';
import type { WorkOrder, OrderStatus } from '@/types';

type ModalType = 'valve' | 'part' | null;

const statusTabs = [
  { key: 'all', label: '全部', countKey: 'all' },
  { key: 'pending', label: '待处理', countKey: 'pending' },
  { key: 'processing', label: '处理中', countKey: 'processing' },
  { key: 'completed', label: '已完成', countKey: 'completed' }
];

const typeFilters = [
  { key: 'all', label: '全部类型' },
  { key: 'emergency', label: '应急工单' },
  { key: 'repair', label: '维修工单' },
  { key: 'maintenance', label: '养护工单' },
  { key: 'valve_operation', label: '开关阀任务' }
];

const WorkOrderPage: React.FC = () => {
  const { workOrders, updateWorkOrderStatus, addValveOperation, addSparePart, facilities } = useTaskStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [showModal, setShowModal] = useState<ModalType>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');

  const [opType, setOpType] = useState<'open' | 'close'>('close');
  const [opTurns, setOpTurns] = useState<number>(0);
  const [opFacilityId, setOpFacilityId] = useState('');
  const [opBeforeP, setOpBeforeP] = useState(0.3);
  const [opAfterP, setOpAfterP] = useState(0);
  const [opRemark, setOpRemark] = useState('');

  const [parts, setParts] = useState<{ name: string; spec: string; qty: number }[]>([
    { name: '', spec: '', qty: 1 }
  ]);

  usePullDownRefresh(() => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '已刷新', icon: 'success' });
    }, 800);
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: workOrders.length, overdue: 0 };
    workOrders.forEach((o) => {
      c[o.status] = (c[o.status] || 0) + 1;
      if (o.isOverdue) c.overdue++;
    });
    return c;
  }, [workOrders]);

  const filteredOrders = useMemo(() => {
    return workOrders.filter((o) => {
      const sOk = statusFilter === 'all' || o.status === statusFilter;
      const tOk = typeFilter === 'all' || o.type === typeFilter;
      return sOk && tOk;
    });
  }, [workOrders, statusFilter, typeFilter]);

  const handleStartWork = (orderId: string) => {
    Taro.showModal({
      title: '开始施工',
      content: '确认已到达现场并开始此工单的施工处理吗？',
      success: (res) => {
        if (res.confirm) {
          updateWorkOrderStatus(orderId, 'processing');
          Taro.showToast({ title: '已开始施工', icon: 'success' });
        }
      }
    });
  };

  const handleComplete = (orderId: string) => {
    Taro.showModal({
      title: '完成工单',
      content: '确认已完成此工单的全部处置工作？',
      confirmText: '确认完成',
      success: (res) => {
        if (res.confirm) {
          updateWorkOrderStatus(orderId, 'completed');
          Taro.showToast({ title: '工单已完成', icon: 'success' });
        }
      }
    });
  };

  const handleOpenValveModal = (orderId: string) => {
    setCurrentOrderId(orderId);
    const order = workOrders.find((o) => o.id === orderId);
    setOpFacilityId(order?.facilityId || facilities[0].id);
    setShowModal('valve');
  };

  const handleOpenPartModal = (orderId: string) => {
    setCurrentOrderId(orderId);
    setShowModal('part');
  };

  const handleSubmitValve = () => {
    const facility = facilities.find((f) => f.id === opFacilityId);
    addValveOperation(currentOrderId, {
      id: `vo-${Date.now()}`,
      facilityId: opFacilityId,
      facilityName: facility?.name || '指定设施',
      operationType: opType,
      turns: opTurns,
      operator: '张建国',
      operatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      beforePressure: opBeforeP,
      afterPressure: opAfterP,
      remarks: opRemark
    });
    Taro.showToast({ title: '操作已记录', icon: 'success' });
    setShowModal(null);
    setOpRemark('');
    setOpTurns(0);
  };

  const handleSubmitPart = () => {
    const validParts = parts.filter((p) => p.name && p.qty > 0);
    if (validParts.length === 0) {
      Taro.showToast({ title: '请填写备件信息', icon: 'none' });
      return;
    }
    validParts.forEach((p, idx) => {
      setTimeout(() => {
        addSparePart(currentOrderId, {
          id: `sp-${Date.now()}-${idx}`,
          partId: `auto-${idx}`,
          partName: p.name,
          specification: p.spec || '标准规格',
          quantity: p.qty,
          unit: '件',
          usedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          operator: '张建国'
        });
      }, idx * 50);
    });
    Taro.showToast({ title: `已登记${validParts.length}项备件`, icon: 'success' });
    setShowModal(null);
    setParts([{ name: '', spec: '', qty: 1 }]);
  };

  const addPartRow = () => {
    setParts((p) => [...p, { name: '', spec: '', qty: 1 }]);
  };

  const removePartRow = (i: number) => {
    setParts((p) => p.filter((_, idx) => idx !== i));
  };

  const updatePart = (i: number, key: string, val: string | number) => {
    setParts((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)));
  };

  return (
    <>
      <ScrollView className={styles.page} scrollY>
        <View className={styles.statsBar}>
          {[
            { key: 'all', label: '全部', num: counts.all },
            { key: 'pending', label: '待处理', num: counts.pending || 0 },
            { key: 'processing', label: '处理中', num: counts.processing || 0 },
            { key: 'overdue', label: '超时', num: counts.overdue }
          ].map((s) => (
            <View
              key={s.key}
              className={classnames(styles.statItem, styles[s.key], statusFilter === s.key && styles.active)}
              onClick={() => setStatusFilter(s.key)}
            >
              <Text className={classnames(styles.statNumber, styles[s.key])}>{s.num}</Text>
              <Text className={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View className={styles.actionHeader}>
          <View className={classnames(styles.actionBtn, styles.warning)} onClick={() => Taro.showToast({ title: '创建应急工单', icon: 'none' })}>
            <Text>🚨</Text><Text>应急工单</Text>
          </View>
          <View className={classnames(styles.actionBtn, styles.primary)} onClick={() => Taro.showToast({ title: '创建维修工单', icon: 'none' })}>
            <Text>➕</Text><Text>新建工单</Text>
          </View>
        </View>

        <ScrollView scrollX className={styles.filterRow} style={{ whiteSpace: 'nowrap' }}>
          {typeFilters.map((f) => (
            <View
              key={f.key}
              className={classnames(styles.filterChip, typeFilter === f.key && styles.active)}
              onClick={() => setTypeFilter(f.key)}
            >
              {f.label}
            </View>
          ))}
        </ScrollView>

        <View className={styles.listArea}>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <View key={order.id}>
                <WorkOrderCard order={order} />
                {order.status === 'pending' && (
                  <View style={{ display: 'flex', gap: 16, marginTop: -16, marginBottom: 24 }}>
                    <View style={{
                      flex: 1, height: 72, background: '#F2F3F5', borderRadius: 48,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }} onClick={() => handleOpenValveModal(order.id)}>
                      <Text style={{ fontSize: 26, color: '#4E5969', fontWeight: 500 }}>🔘 开关阀记录</Text>
                    </View>
                    <View style={{
                      flex: 1, height: 72, background: 'linear-gradient(135deg,#1E88E5,#42A5F5)', borderRadius: 48,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }} onClick={() => handleStartWork(order.id)}>
                      <Text style={{ fontSize: 26, color: '#fff', fontWeight: 500 }}>▶ 开始处置</Text>
                    </View>
                  </View>
                )}
                {order.status === 'processing' && (
                  <View style={{ display: 'flex', gap: 12, marginTop: -16, marginBottom: 24 }}>
                    <View style={{
                      flex: 1, height: 72, background: '#F2F3F5', borderRadius: 48,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }} onClick={() => handleOpenValveModal(order.id)}>
                      <Text style={{ fontSize: 24, color: '#4E5969', fontWeight: 500 }}>🔘 开关阀</Text>
                    </View>
                    <View style={{
                      flex: 1, height: 72, background: '#F2F3F5', borderRadius: 48,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }} onClick={() => handleOpenPartModal(order.id)}>
                      <Text style={{ fontSize: 24, color: '#4E5969', fontWeight: 500 }}>🔧 备件登记</Text>
                    </View>
                    <View style={{
                      flex: 1, height: 72, background: 'linear-gradient(135deg,#26A69A,#80CBC4)', borderRadius: 48,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }} onClick={() => handleComplete(order.id)}>
                      <Text style={{ fontSize: 24, color: '#fff', fontWeight: 500 }}>✓ 完成工单</Text>
                    </View>
                  </View>
                )}
              </View>
            ))
          ) : (
            <EmptyState icon="📋" title="暂无工单" description="当前筛选条件下无工单记录" />
          )}
        </View>
      </ScrollView>

      {showModal === 'valve' && (
        <View className={styles.recordModal} onClick={() => setShowModal(null)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation?.()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>记录开关阀操作</Text>
              <View className={styles.modalClose} onClick={() => setShowModal(null)}>✕</View>
            </View>

            <View className={styles.modalSection}>
              <Text className={styles.modalLabel}>操作类型</Text>
              <View className={styles.operationSelector}>
                <View
                  className={classnames(styles.operationOpt, opType === 'open' && styles.selected)}
                  onClick={() => setOpType('open')}
                >
                  <Text className={styles.operationIcon}>🟢</Text>
                  <Text className={styles.operationName}>开启阀门</Text>
                </View>
                <View
                  className={classnames(styles.operationOpt, styles.close, opType === 'close' && styles.selected)}
                  onClick={() => setOpType('close')}
                >
                  <Text className={styles.operationIcon}>🔴</Text>
                  <Text className={styles.operationName}>关闭阀门</Text>
                </View>
              </View>
            </View>

            <View className={styles.modalSection}>
              <Text className={styles.modalLabel}>操作设施</Text>
              <Input
                className={styles.partInput}
                placeholder="输入或选择设施编号"
                value={opFacilityId}
                onInput={(e) => setOpFacilityId(e.detail.value)}
              />
            </View>

            <View className={styles.modalSection}>
              <Text className={styles.modalLabel}>转动圈数：{opTurns} 圈</Text>
              <View style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 32, background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, color: '#1E88E5', boxShadow: '0 2rpx 8rpx rgba(0,0,0,0.1)'
                }} onClick={() => setOpTurns((t) => Math.max(0, t - 1))}>−</View>
                <View style={{ flex: 1, height: 8, background: '#F2F3F5', borderRadius: 4 }}>
                  <View style={{
                    width: `${Math.min(100, (opTurns / 30) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg,#1E88E5,#42A5F5)',
                    borderRadius: 4
                  }} />
                </View>
                <View style={{
                  width: 64, height: 64, borderRadius: 32, background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, color: '#1E88E5', boxShadow: '0 2rpx 8rpx rgba(0,0,0,0.1)'
                }} onClick={() => setOpTurns((t) => t + 1)}>＋</View>
              </View>
            </View>

            <View className={styles.modalSection}>
              <View style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <View>
                  <Text className={styles.modalLabel}>操作前压力 (MPa)</Text>
                  <Input
                    className={styles.partInput}
                    type="digit"
                    value={String(opBeforeP)}
                    onInput={(e) => setOpBeforeP(Number(e.detail.value))}
                  />
                </View>
                <View>
                  <Text className={styles.modalLabel}>操作后压力 (MPa)</Text>
                  <Input
                    className={styles.partInput}
                    type="digit"
                    value={String(opAfterP)}
                    onInput={(e) => setOpAfterP(Number(e.detail.value))}
                  />
                </View>
              </View>
            </View>

            <View className={styles.modalSection}>
              <Text className={styles.modalLabel}>操作备注</Text>
              <Input
                className={styles.partInput}
                placeholder="填写操作说明、现场情况等"
                value={opRemark}
                onInput={(e) => setOpRemark(e.detail.value)}
              />
            </View>

            <View className={styles.submitArea}>
              <View className={styles.cancelBtn} onClick={() => setShowModal(null)}>取消</View>
              <View className={styles.confirmBtn} onClick={handleSubmitValve}>确认记录</View>
            </View>
          </View>
        </View>
      )}

      {showModal === 'part' && (
        <View className={styles.recordModal} onClick={() => setShowModal(null)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation?.()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>登记备件用量</Text>
              <View className={styles.modalClose} onClick={() => setShowModal(null)}>✕</View>
            </View>

            {parts.map((p, i) => (
              <View className={styles.partRow} key={i}>
                <Input
                  className={styles.partInput}
                  placeholder="备件名称"
                  value={p.name}
                  onInput={(e) => updatePart(i, 'name', e.detail.value)}
                />
                <Input
                  className={styles.partInput}
                  placeholder="规格"
                  value={p.spec}
                  onInput={(e) => updatePart(i, 'spec', e.detail.value)}
                />
                <Input
                  className={styles.partInput}
                  type="number"
                  placeholder="数量"
                  value={String(p.qty)}
                  onInput={(e) => updatePart(i, 'qty', Number(e.detail.value))}
                />
                <View className={styles.partDelBtn} onClick={() => removePartRow(i)}>✕</View>
              </View>
            ))}

            <View className={styles.partAddBtn} onClick={addPartRow}>➕ 添加一行</View>

            <View className={styles.submitArea} style={{ marginTop: 40 }}>
              <View className={styles.cancelBtn} onClick={() => setShowModal(null)}>取消</View>
              <View className={styles.confirmBtn} onClick={handleSubmitPart}>确认登记</View>
            </View>
          </View>
        </View>
      )}
    </>
  );
};

export default WorkOrderPage;
