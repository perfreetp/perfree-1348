import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import SectionHeader from '@/components/SectionHeader';
import Tag from '@/components/Tag';
import EmptyState from '@/components/EmptyState';
import { useTaskStore } from '@/store/useTaskStore';

const levelInfo: Record<string, { label: string; type: 'warning' | 'primary' | 'danger' | 'severe'; color: string }> = {
  minor: { label: '一般', type: 'warning', color: '#8D6E63' },
  moderate: { label: '较大', type: 'primary', color: '#FF9800' },
  major: { label: '重大', type: 'danger', color: '#EF5350' },
  severe: { label: '特大', type: 'severe', color: '#B71C1C' }
};

const statusInfo: Record<string, { label: string; type: 'warning' | 'primary' | 'info' | 'success' | 'default' }> = {
  reported: { label: '已上报', type: 'warning' },
  assigned: { label: '已派单', type: 'primary' },
  processing: { label: '处理中', type: 'info' },
  resolved: { label: '已处理', type: 'success' },
  closed: { label: '已闭环', type: 'default' }
};

const HazardDetailPage: React.FC = () => {
  const router = useRouter();
  const hazardId = router.params.id;
  const { hazards, updateHazardStatus, addWorkOrder, workOrders } = useTaskStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [previewImg, setPreviewImg] = React.useState<string | null>(null);

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 600);
  });

  const hazard = useMemo(() => hazards.find(h => h.id === hazardId), [hazards, hazardId]);

  const lInfo = hazard ? levelInfo[hazard.level] : null;
  const sInfo = hazard ? statusInfo[hazard.status] : null;

  const handleCreateWorkOrder = () => {
    if (!hazard) return;
    if (hazard.workOrderId) {
      Taro.navigateTo({ url: `/pages/workorder-detail/index?id=${hazard.workOrderId}` });
      return;
    }
    Taro.showModal({
      title: '生成维修工单',
      content: `确认为「${hazard.title}」生成维修工单？`,
      success: (res) => {
        if (res.confirm) {
          const orderId = `wo-auto-${Date.now()}`;
          const newOrder = {
            id: orderId,
            title: hazard.title,
            type: 'repair' as const,
            status: 'pending' as const,
            priority: hazard.level === 'severe' || hazard.level === 'major' ? 'high' : hazard.level === 'moderate' ? 'medium' : 'low',
            hazardId: hazard.id,
            facilityId: hazard.facilityId,
            facilityName: hazard.facilityName || '关联设施',
            location: hazard.location,
            description: hazard.description,
            images: hazard.images,
            assignee: 'u001',
            assigneeName: '张建国',
            createdBy: '巡检员',
            createdAt: new Date().toLocaleString('zh-CN'),
            deadline: '今日 18:00',
            spareParts: [],
            valveOperations: [],
            historyLogs: [
              { id: 'l1', action: '隐患生成工单', operator: '张建国', timestamp: new Date().toLocaleString('zh-CN') }
            ]
          };
          addWorkOrder(newOrder);
          updateHazardStatus(hazard.id, 'assigned');
          Taro.showToast({ title: '工单已生成', icon: 'success' });
          setTimeout(() => Taro.navigateTo({ url: `/pages/workorder-detail/index?id=${orderId}` }), 800);
        }
      }
    });
  };

  const handlePreviewImg = (url: string) => {
    Taro.previewImage({
      current: url,
      urls: hazard?.images || [url]
    });
  };

  const handleUpdateStatus = (status: string, label: string) => {
    if (!hazard) return;
    Taro.showModal({
      title: '状态变更',
      content: `确认将隐患状态变更为「${label}」？`,
      success: (res) => {
        if (res.confirm) {
          updateHazardStatus(hazard.id, status);
          Taro.showToast({ title: '状态已更新', icon: 'success' });
        }
      }
    });
  };

  if (!hazard || !lInfo || !sInfo) {
    return (
      <View style={{ paddingTop: 120 }}>
        <EmptyState title="隐患记录不存在" description="该记录可能已被删除" />
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <ScrollView className={styles.scroll} scrollY enhanced showScrollbar={false}>
        <View className={styles.header} style={{ background: `linear-gradient(135deg, ${lInfo.color} 0%, ${lInfo.color}bb 100%)` }}>
          <View className={styles.headerTop}>
            <View className={styles.tagRow}>
              <View className={styles.levelBadge}>
                <Text className={styles.levelIcon}>⚠️</Text>
                <Text className={styles.levelText}>{lInfo.label}隐患</Text>
              </View>
              <Tag type={sInfo.type} size="md">{sInfo.label}</Tag>
            </View>
          </View>
          <Text className={styles.title}>{hazard.title}</Text>
          <Text className={styles.location}>📍 {hazard.location}</Text>
        </View>

        <View className={styles.content}>
          <View className={styles.statsCard}>
            {hazard.waterLeakNoise !== undefined && (
              <View className={styles.statItem}>
                <Text className={styles.statIcon}>🔊</Text>
                <View>
                  <Text className={styles.statVal}>{hazard.waterLeakNoise}</Text>
                  <Text className={styles.statUnit}>dB</Text>
                </View>
                <Text className={styles.statLabel}>噪声</Text>
              </View>
            )}
            {hazard.pressureReading !== undefined && (
              <View className={styles.statItem}>
                <Text className={styles.statIcon}>💧</Text>
                <View>
                  <Text className={styles.statVal}>{hazard.pressureReading}</Text>
                  <Text className={styles.statUnit}>MPa</Text>
                </View>
                <Text className={styles.statLabel}>压力</Text>
              </View>
            )}
            <View className={styles.statItem}>
              <Text className={styles.statIcon}>📷</Text>
              <View>
                <Text className={styles.statVal}>{hazard.images?.length || 0}</Text>
                <Text className={styles.statUnit}>张</Text>
              </View>
              <Text className={styles.statLabel}>照片</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statIcon}>📋</Text>
              <View>
                <Text className={styles.statVal}>{hazard.type}</Text>
                <Text className={styles.statUnit}></Text>
              </View>
              <Text className={styles.statLabel}>类型</Text>
            </View>
          </View>

          <View className={styles.card}>
            <SectionHeader title="基本信息" subtitle="Basic Info" />
            <View className={styles.infoList}>
              {[
                { label: '隐患编号', value: hazard.id.toUpperCase() },
                { label: '上报时间', value: hazard.reportTime },
                { label: '上报人', value: hazard.reporterName },
                { label: '关联设施', value: hazard.facilityName || '无' },
                { label: '设施编号', value: hazard.facilityId || '无' },
                { label: 'GPS坐标', value: `${hazard.lat?.toFixed(4)}, ${hazard.lng?.toFixed(4)}` }
              ].map((it, i) => (
                <View key={i} className={styles.infoRow}>
                  <Text className={styles.infoLabel}>{it.label}</Text>
                  <Text className={styles.infoValue}>{it.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.card}>
            <SectionHeader title="详细描述" subtitle="Description" />
            <View className={styles.descBox}>
              <Text className={styles.descText}>{hazard.description}</Text>
            </View>
            {hazard.remarks && (
              <View className={styles.remarkBox}>
                <Text className={styles.remarkTag}>💡 备注</Text>
                <Text className={styles.remarkText}>{hazard.remarks}</Text>
              </View>
            )}
          </View>

          <View className={styles.card}>
            <SectionHeader
              title="现场照片"
              subtitle={`共 ${hazard.images?.length || 0} 张`}
            />
            {(!hazard.images || hazard.images.length === 0) ? (
              <EmptyState title="暂无现场照片" description="隐患上报时未采集照片" size="sm" />
            ) : (
              <View className={styles.imgGrid}>
                {hazard.images.map((url, i) => (
                  <View key={i} className={styles.imgWrap} onClick={() => handlePreviewImg(url)}>
                    <Image src={url} className={styles.img} mode="aspectFill" />
                    <View className={styles.imgIndex}>#{i + 1}</View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className={styles.card}>
            <SectionHeader title="关联工单" subtitle="Linked Work Order" />
            {hazard.workOrderId ? (
              <View
                className={styles.linkCard}
                onClick={() => Taro.navigateTo({ url: `/pages/workorder-detail/index?id=${hazard.workOrderId}` })}
              >
                <View className={styles.linkIcon}>🔧</View>
                <View className={styles.linkInfo}>
                  <Text className={styles.linkTitle}>
                    {workOrders.find(w => w.id === hazard.workOrderId)?.title || '维修工单'}
                  </Text>
                  <Text className={styles.linkSub}>工单编号：{hazard.workOrderId.toUpperCase()}</Text>
                </View>
                <Text className={styles.linkArrow}>›</Text>
              </View>
            ) : (
              <View className={styles.noLink}>
                <Text className={styles.noLinkText}>暂未生成维修工单</Text>
              </View>
            )}
          </View>

          <View style={{ height: 160 }} />
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        {(hazard.status === 'reported') && (
          <View className={classnames(styles.halfBtn, styles.halfBtnWarn)} onClick={() => handleUpdateStatus('processing', '处理中')}>
            🔄 开始处理
          </View>
        )}
        {(hazard.status === 'processing' || hazard.status === 'assigned') && (
          <View className={classnames(styles.halfBtn, styles.halfBtnOk)} onClick={() => handleUpdateStatus('resolved', '已处理')}>
            ✅ 标记已处理
          </View>
        )}
        <View className={classnames(hazard.status === 'reported' ? styles.halfBtn : styles.bigBtn, styles.primaryBtn)} onClick={handleCreateWorkOrder}>
          🔧 {hazard.workOrderId ? '查看工单' : '生成维修工单'}
        </View>
      </View>

      {previewImg && (
        <View className={styles.previewMask} onClick={() => setPreviewImg(null)}>
          <Image src={previewImg} className={styles.previewImg} mode="aspectFit" />
          <Text className={styles.previewClose} onClick={() => setPreviewImg(null)}>✕ 关闭</Text>
        </View>
      )}
    </View>
  );
};

export default HazardDetailPage;
