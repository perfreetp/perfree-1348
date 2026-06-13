import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, Input, Textarea, Slider } from '@tarojs/components';
import Taro, { useRouter, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import SectionHeader from '@/components/SectionHeader';
import Tag from '@/components/Tag';
import EmptyState from '@/components/EmptyState';
import { useTaskStore } from '@/store/useTaskStore';
import dayjs from 'dayjs';

const typeInfo: Record<string, { label: string; icon: string; color: string }> = {
  repair: { label: '维修工单', icon: '🔧', color: '#1E88E5' },
  maintenance: { label: '维护工单', icon: '🛠️', color: '#26A69A' },
  valve_operation: { label: '开关阀工单', icon: '🔘', color: '#5C6BC0' },
  emergency: { label: '应急工单', icon: '🚨', color: '#EF5350' }
};

const statusInfo: Record<string, { label: string; type: 'warning' | 'info' | 'success' | 'default' }> = {
  pending: { label: '待处理', type: 'warning' },
  processing: { label: '处理中', type: 'info' },
  completed: { label: '已完成', type: 'success' },
  closed: { label: '已关闭', type: 'default' }
};

const WorkOrderDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.id;
  const { workOrders, updateWorkOrderStatus, addSparePart, addValveOperation } = useTaskStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'parts' | 'valve' | 'log'>('info');
  const [showValveModal, setShowValveModal] = useState(false);
  const [showPartModal, setShowPartModal] = useState(false);
  const [valveForm, setValveForm] = useState({
    operationType: 'close' as 'open' | 'close',
    facilityName: '',
    turns: 6,
    beforePressure: 0.3,
    afterPressure: 0,
    remarks: ''
  });
  const [partRows, setPartRows] = useState([
    { partName: '', specification: '', quantity: 1, unit: '个' }
  ]);

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 600);
  });

  const order = useMemo(() => workOrders.find(w => w.id === orderId), [workOrders, orderId]);
  const tInfo = order ? typeInfo[order.type] : null;
  const sInfo = order ? statusInfo[order.status] : null;

  const handleStartProcess = () => {
    if (!order) return;
    Taro.showModal({
      title: '开始处置',
      content: `确认开始处置「${order.title}」吗？`,
      success: (res) => {
        if (res.confirm) {
          updateWorkOrderStatus(order.id, 'processing');
          Taro.showToast({ title: '已开始处置', icon: 'success' });
        }
      }
    });
  };

  const handleComplete = () => {
    if (!order) return;
    Taro.showModal({
      title: '完成工单',
      content: '确认完成工单处置？需已登记备件用量和操作记录。',
      success: (res) => {
        if (res.confirm) {
          updateWorkOrderStatus(order.id, 'completed');
          Taro.showToast({ title: '工单已完成', icon: 'success' });
        }
      }
    });
  };

  const handleGoHazard = () => {
    if (order?.hazardId) {
      Taro.navigateTo({ url: `/pages/hazard-detail/index?id=${order.hazardId}` });
    }
  };

  const handleSaveValve = () => {
    if (!order) return;
    if (!valveForm.facilityName) {
      Taro.showToast({ title: '请输入设施名称', icon: 'none' });
      return;
    }
    addValveOperation(order.id, {
      id: `vo-${Date.now()}`,
      facilityId: 'auto',
      facilityName: valveForm.facilityName,
      operationType: valveForm.operationType,
      turns: valveForm.turns,
      operator: '张建国',
      operatedAt: new Date().toLocaleString('zh-CN'),
      beforePressure: valveForm.beforePressure,
      afterPressure: valveForm.afterPressure,
      remarks: valveForm.remarks
    });
    setShowValveModal(false);
    Taro.showToast({ title: '开关阀记录已保存', icon: 'success' });
    setValveForm({ operationType: 'close', facilityName: '', turns: 6, beforePressure: 0.3, afterPressure: 0, remarks: '' });
  };

  const handleSaveParts = () => {
    if (!order) return;
    const valid = partRows.filter(r => r.partName && r.quantity > 0);
    if (valid.length === 0) {
      Taro.showToast({ title: '请填写备件信息', icon: 'none' });
      return;
    }
    valid.forEach(r => {
      addSparePart(order.id, {
        id: `sp-${Date.now()}-${Math.random()}`,
        partId: 'auto',
        partName: r.partName,
        specification: r.specification,
        quantity: r.quantity,
        unit: r.unit,
        usedAt: new Date().toLocaleString('zh-CN'),
        operator: '张建国'
      });
    });
    setShowPartModal(false);
    Taro.showToast({ title: '备件已登记', icon: 'success' });
    setPartRows([{ partName: '', specification: '', quantity: 1, unit: '个' }]);
  };

  const addPartRow = () => {
    setPartRows([...partRows, { partName: '', specification: '', quantity: 1, unit: '个' }]);
  };

  const removePartRow = (idx: number) => {
    if (partRows.length <= 1) return;
    setPartRows(partRows.filter((_, i) => i !== idx));
  };

  if (!order || !tInfo || !sInfo) {
    return (
      <View style={{ paddingTop: 120 }}>
        <EmptyState title="工单不存在" description="该工单可能已被删除" />
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView className={styles.scroll} scrollY enhanced showScrollbar={false}>
        <View className={styles.header} style={{ background: `linear-gradient(135deg, ${tInfo.color} 0%, ${tInfo.color}bb 100%)` }}>
          <View className={styles.headerTop}>
            <View className={styles.tagRow}>
              <View className={styles.typeBadge}>
                <Text className={styles.typeIcon}>{tInfo.icon}</Text>
                <Text className={styles.typeText}>{tInfo.label}</Text>
              </View>
              <Tag type={sInfo.type} size="md">{sInfo.label}</Tag>
              {order.isOverdue && <Tag type="danger" size="md">已超时</Tag>}
            </View>
          </View>
          <Text className={styles.title}>{order.title}</Text>
          <Text className={styles.location}>📍 {order.location}</Text>
        </View>

        <View className={styles.content}>
          <View className={styles.statsRow}>
            <View className={styles.statChip}>
              <Text className={styles.statIcon}>👤</Text>
              <View>
                <Text className={styles.statVal}>{order.assigneeName}</Text>
                <Text className={styles.statLbl}>负责人</Text>
              </View>
            </View>
            <View className={styles.statChip}>
              <Text className={styles.statIcon}>📅</Text>
              <View>
                <Text className={styles.statVal}>{order.deadline}</Text>
                <Text className={styles.statLbl}>截止时间</Text>
              </View>
            </View>
            <View className={styles.statChip}>
              <Text className={styles.statIcon}>📦</Text>
              <View>
                <Text className={styles.statVal}>{order.spareParts?.length || 0}</Text>
                <Text className={styles.statLbl}>备件项</Text>
              </View>
            </View>
          </View>

          <View className={styles.tabBar}>
            {[
              { key: 'info', label: '📋 基本信息' },
              { key: 'parts', label: '📦 备件用量' },
              { key: 'valve', label: '🔘 开关阀' },
              { key: 'log', label: '📝 处置日志' }
            ].map(t => (
              <View
                key={t.key}
                className={classnames(styles.tabItem, activeTab === t.key && styles.tabItemActive)}
                onClick={() => setActiveTab(t.key as any)}
              >
                <Text className={classnames(styles.tabText, activeTab === t.key && styles.tabTextActive)}>
                  {t.label}
                </Text>
              </View>
            ))}
          </View>

          {activeTab === 'info' && (
            <View className={styles.card}>
              <SectionHeader title="工单信息" />
              <View className={styles.infoList}>
                {[
                  { label: '工单编号', value: order.id.toUpperCase() },
                  { label: '创建来源', value: order.createdBy },
                  { label: '创建时间', value: order.createdAt },
                  { label: '开始时间', value: order.startedAt || '未开始' },
                  { label: '完成时间', value: order.completedAt || '-' },
                  { label: '关联设施', value: order.facilityName },
                  { label: '设施编号', value: order.facilityId || '-' },
                  { label: '关联隐患', value: order.hazardId || '无' }
                ].map((it, i) => (
                  <View key={i} className={styles.infoRow}>
                    <Text className={styles.infoLabel}>{it.label}</Text>
                    <Text className={styles.infoValue}>{it.value}</Text>
                  </View>
                ))}
              </View>

              {order.hazardId && (
                <View className={styles.linkRow} onClick={handleGoHazard}>
                  <Text>🔗 查看关联隐患详情 ›</Text>
                </View>
              )}

              <View style={{ marginTop: 24 }} />
              <SectionHeader title="处置内容" />
              <View className={styles.descBox}>
                <Text className={styles.descText}>{order.description}</Text>
              </View>

              {order.resolution && (
                <>
                  <View style={{ marginTop: 24 }} />
                  <SectionHeader title="处置结果" />
                  <View className={styles.descBox} style={{ borderLeftColor: '#4CAF50', background: 'rgba(76,175,80,0.06)' }}>
                    <Text className={styles.descText}>{order.resolution}</Text>
                  </View>
                </>
              )}

              {order.images && order.images.length > 0 && (
                <>
                  <View style={{ marginTop: 24 }} />
                  <SectionHeader title="现场图片" />
                  <View className={styles.imgGrid}>
                    {order.images.map((url, i) => (
                      <Image
                        key={i}
                        src={url}
                        className={styles.img}
                        mode="aspectFill"
                        onClick={() => Taro.previewImage({ current: url, urls: order.images || [url] })}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {activeTab === 'parts' && (
            <View className={styles.card}>
              <View className={styles.sectionHead}>
                <SectionHeader title={`备件用量登记 (${order.spareParts?.length || 0})`} />
                {order.status === 'processing' && (
                  <View className={styles.addBtn} onClick={() => setShowPartModal(true)}>
                    ➕ 新增
                  </View>
                )}
              </View>
              {!order.spareParts || order.spareParts.length === 0 ? (
                <EmptyState title="暂无备件记录" description="处置过程中可登记使用的备件" size="sm" />
              ) : (
                <View className={styles.tableWrap}>
                  <View className={styles.tableHead}>
                    <Text style={{ width: 80 }}>名称</Text>
                    <Text style={{ width: 80 }}>规格</Text>
                    <Text style={{ width: 50 }}>数量</Text>
                    <Text style={{ width: 40 }}>单位</Text>
                    <Text style={{ width: 120 }}>使用时间</Text>
                  </View>
                  {order.spareParts.map(p => (
                    <View key={p.id} className={styles.tableRow}>
                      <Text style={{ width: 80 }} className={styles.tableCell}>{p.partName}</Text>
                      <Text style={{ width: 80 }} className={styles.tableCell}>{p.specification}</Text>
                      <Text style={{ width: 50 }} className={styles.tableCell}>{p.quantity}</Text>
                      <Text style={{ width: 40 }} className={styles.tableCell}>{p.unit}</Text>
                      <Text style={{ width: 120 }} className={styles.tableCell}>{p.usedAt.slice(5)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'valve' && (
            <View className={styles.card}>
              <View className={styles.sectionHead}>
                <SectionHeader title={`开关阀操作记录 (${order.valveOperations?.length || 0})`} />
                {order.status === 'processing' && (
                  <View className={styles.addBtn} onClick={() => setShowValveModal(true)}>
                    ➕ 记录
                  </View>
                )}
              </View>
              {!order.valveOperations || order.valveOperations.length === 0 ? (
                <EmptyState title="暂无开关阀记录" description="维修处置前后的开关阀操作记录" size="sm" />
              ) : (
                <View className={styles.valveList}>
                  {order.valveOperations.map(v => (
                    <View key={v.id} className={styles.valveCard}>
                      <View className={styles.valveHead}>
                        <View className={classnames(styles.opBadge, v.operationType === 'close' ? styles.opClose : styles.opOpen)}>
                          {v.operationType === 'close' ? '🔴 关阀' : '🟢 开阀'}
                        </View>
                        <Text className={styles.valveTime}>{v.operatedAt}</Text>
                      </View>
                      <Text className={styles.valveName}>🔧 {v.facilityName}</Text>
                      <View className={styles.valveMeta}>
                        <Text className={styles.meta}>圈数：{v.turns}圈</Text>
                        <Text className={styles.meta}>操作前：{v.beforePressure}MPa</Text>
                        <Text className={styles.meta}>操作后：{v.afterPressure}MPa</Text>
                      </View>
                      {v.remarks && <Text className={styles.valveRemark}>📝 {v.remarks}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'log' && (
            <View className={styles.card}>
              <SectionHeader title={`处置日志 (${order.historyLogs?.length || 0})`} />
              {!order.historyLogs || order.historyLogs.length === 0 ? (
                <EmptyState title="暂无操作日志" size="sm" />
              ) : (
                <View className={styles.timeline}>
                  {order.historyLogs.map((log, idx) => (
                    <View key={log.id} className={styles.tlItem}>
                      <View className={styles.tlLeft}>
                        <View className={classnames(styles.tlDot, idx === 0 && styles.tlDotFirst)} />
                        {idx !== order.historyLogs!.length - 1 && <View className={styles.tlLine} />}
                      </View>
                      <View className={styles.tlContent}>
                        <Text className={styles.tlAction}>{log.action}</Text>
                        <Text className={styles.tlOperator}>操作人：{log.operator}</Text>
                        <Text className={styles.tlTime}>{log.timestamp}</Text>
                        {log.remarks && <Text className={styles.tlRemark}>📝 {log.remarks}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 160 }} />
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        {order.status === 'pending' && (
          <>
            <View className={styles.halfBtn} onClick={() => setShowValveModal(true)}>
              🔘 开关阀记录
            </View>
            <View className={classnames(styles.halfBtn, styles.primaryBtn)} onClick={handleStartProcess}>
              🚀 开始处置
            </View>
          </>
        )}
        {order.status === 'processing' && (
          <>
            <View className={styles.thirdBtn} onClick={() => setShowValveModal(true)}>
              🔘 开关阀
            </View>
            <View className={styles.thirdBtn} onClick={() => setShowPartModal(true)}>
              📦 备件
            </View>
            <View className={classnames(styles.thirdBtn, styles.primaryBtn)} onClick={handleComplete}>
              ✅ 完成
            </View>
          </>
        )}
        {(order.status === 'completed' || order.status === 'closed') && (
          <View className={styles.bigBtn} onClick={() => Taro.navigateBack()}>
            ← 返回工单列表
          </View>
        )}
      </View>

      {showValveModal && (
        <View className={styles.modalMask} onClick={() => setShowValveModal(false)}>
          <View className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <View className={styles.sheetHandle} />
            <Text className={styles.sheetTitle}>开关阀操作记录</Text>
            <ScrollView className={styles.sheetScroll} scrollY>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>操作类型</Text>
                <View className={styles.segmented}>
                  {(['close', 'open'] as const).map(k => (
                    <View
                      key={k}
                      className={classnames(styles.segItem, valveForm.operationType === k && styles.segItemActive)}
                      onClick={() => setValveForm({ ...valveForm, operationType: k })}
                    >
                      {k === 'close' ? '🔴 关阀' : '🟢 开阀'}
                    </View>
                  ))}
                </View>
              </View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>设施名称</Text>
                <Input
                  className={styles.formInput}
                  placeholder="请输入设施名称/编号"
                  value={valveForm.facilityName}
                  onInput={(e) => setValveForm({ ...valveForm, facilityName: e.detail.value })}
                />
              </View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>操作圈数：{valveForm.turns} 圈</Text>
                <Slider
                  min={1}
                  max={30}
                  value={valveForm.turns}
                  onChange={(e) => setValveForm({ ...valveForm, turns: e.detail.value })}
                  className={styles.slider}
                  activeColor="#1E88E5"
                  backgroundColor="#e0e0e0"
                  blockSize={24}
                />
              </View>
              <View className={styles.formRow}>
                <View className={styles.formGroup} style={{ flex: 1 }}>
                  <Text className={styles.formLabel}>操作前压力(MPa)</Text>
                  <Input
                    type="digit"
                    className={styles.formInput}
                    value={String(valveForm.beforePressure)}
                    onInput={(e) => setValveForm({ ...valveForm, beforePressure: Number(e.detail.value) })}
                  />
                </View>
                <View style={{ width: 20 }} />
                <View className={styles.formGroup} style={{ flex: 1 }}>
                  <Text className={styles.formLabel}>操作后压力(MPa)</Text>
                  <Input
                    type="digit"
                    className={styles.formInput}
                    value={String(valveForm.afterPressure)}
                    onInput={(e) => setValveForm({ ...valveForm, afterPressure: Number(e.detail.value) })}
                  />
                </View>
              </View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>备注</Text>
                <Textarea
                  className={styles.formTextarea}
                  placeholder="请输入操作备注..."
                  value={valveForm.remarks}
                  onInput={(e) => setValveForm({ ...valveForm, remarks: e.detail.value })}
                />
              </View>
            </ScrollView>
            <View className={styles.sheetActions}>
              <View className={styles.sheetCancel} onClick={() => setShowValveModal(false)}>取消</View>
              <View className={styles.sheetConfirm} onClick={handleSaveValve}>保存记录</View>
            </View>
          </View>
        </View>
      )}

      {showPartModal && (
        <View className={styles.modalMask} onClick={() => setShowPartModal(false)}>
          <View className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <View className={styles.sheetHandle} />
            <Text className={styles.sheetTitle}>备件用量登记</Text>
            <ScrollView className={styles.sheetScroll} scrollY>
              {partRows.map((row, idx) => (
                <View key={idx} className={styles.partRow}>
                  <View className={styles.partIdx}>#{idx + 1}</View>
                  <View className={styles.partForm}>
                    <View className={styles.formGroup}>
                      <Text className={styles.formLabel}>备件名称</Text>
                      <Input
                        className={styles.formInput}
                        placeholder="如：DN200阀门密封垫"
                        value={row.partName}
                        onInput={(e) => {
                          const r = [...partRows];
                          r[idx] = { ...row, partName: e.detail.value };
                          setPartRows(r);
                        }}
                      />
                    </View>
                    <View className={styles.formRow}>
                      <View className={styles.formGroup} style={{ flex: 1 }}>
                        <Text className={styles.formLabel}>规格型号</Text>
                        <Input
                          className={styles.formInput}
                          placeholder="规格/型号"
                          value={row.specification}
                          onInput={(e) => {
                            const r = [...partRows];
                            r[idx] = { ...row, specification: e.detail.value };
                            setPartRows(r);
                          }}
                        />
                      </View>
                      <View style={{ width: 16 }} />
                      <View className={styles.formGroup} style={{ width: 120 }}>
                        <Text className={styles.formLabel}>数量</Text>
                        <Input
                          type="number"
                          className={styles.formInput}
                          value={String(row.quantity)}
                          onInput={(e) => {
                            const r = [...partRows];
                            r[idx] = { ...row, quantity: Number(e.detail.value) || 1 };
                            setPartRows(r);
                          }}
                        />
                      </View>
                      <View style={{ width: 16 }} />
                      <View className={styles.formGroup} style={{ width: 100 }}>
                        <Text className={styles.formLabel}>单位</Text>
                        <Input
                          className={styles.formInput}
                          placeholder="个/套/米"
                          value={row.unit}
                          onInput={(e) => {
                            const r = [...partRows];
                            r[idx] = { ...row, unit: e.detail.value };
                            setPartRows(r);
                          }}
                        />
                      </View>
                    </View>
                  </View>
                  {partRows.length > 1 && (
                    <View className={styles.delRow} onClick={() => removePartRow(idx)}>🗑️</View>
                  )}
                </View>
              ))}
              <View className={styles.addRowBtn} onClick={addPartRow}>
                ➕ 继续添加
              </View>
            </ScrollView>
            <View className={styles.sheetActions}>
              <View className={styles.sheetCancel} onClick={() => setShowPartModal(false)}>取消</View>
              <View className={styles.sheetConfirm} onClick={handleSaveParts}>确认登记</View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default WorkOrderDetailPage;
