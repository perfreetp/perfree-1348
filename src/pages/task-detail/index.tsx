import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter, usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import SectionHeader from '@/components/SectionHeader';
import Tag from '@/components/Tag';
import EmptyState from '@/components/EmptyState';
import { useTaskStore } from '@/store/useTaskStore';
import dayjs from 'dayjs';

const statusInfo: Record<string, { label: string; type: 'primary' | 'warning' | 'success' | 'danger' }> = {
  doing: { label: '进行中', type: 'primary' },
  todo: { label: '待开始', type: 'warning' },
  done: { label: '已完成', type: 'success' },
  overdue: { label: '已超时', type: 'danger' }
};

const priorityInfo: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: '高优先级', color: '#EF5350', bg: 'rgba(239,83,80,0.1)' },
  medium: { label: '中优先级', color: '#FF9800', bg: 'rgba(255,152,0,0.1)' },
  low: { label: '低优先级', color: '#8D6E63', bg: 'rgba(141,110,99,0.1)' }
};

const facilityIcon: Record<string, string> = {
  valve: '🔧',
  hydrant: '🚒'
};

const TaskDetailPage: React.FC = () => {
  const router = useRouter();
  const taskId = router.params.id;
  const { tasks, checkInPoint, updateTaskStatus, setCurrentTask } = useTaskStore();
  const [refreshing, setRefreshing] = React.useState(false);

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 600);
  });

  const task = useMemo(() => tasks.find(t => t.id === taskId), [tasks, taskId]);

  const progress = useMemo(() => {
    if (!task) return 0;
    return task.totalPoints ? Math.round((task.checkedPoints / task.totalPoints) * 100) : 0;
  }, [task]);

  const handleStartTask = () => {
    if (!task) return;
    Taro.showModal({
      title: '开始巡检',
      content: `确认开始「${task.title}」吗？`,
      success: (res) => {
        if (res.confirm) {
          updateTaskStatus(task.id, 'doing');
          setCurrentTask(task);
          Taro.showToast({ title: '任务已开始', icon: 'success' });
          setTimeout(() => Taro.switchTab({ url: '/pages/map/index' }), 600);
        }
      }
    });
  };

  const handleCheckIn = (pointId: string, pointName: string) => {
    if (!task) return;
    Taro.showModal({
      title: '到点打卡',
      content: `确认在「${pointName}」打卡？`,
      success: (res) => {
        if (res.confirm) {
          checkInPoint(task.id, pointId);
          Taro.showToast({ title: '打卡成功', icon: 'success' });
        }
      }
    });
  };

  const handleScanCheckIn = () => {
    Taro.scanCode({
      success: (res) => {
        if (!task) return;
        const point = task.points.find(p => p.facilityId === res.result);
        if (point) {
          handleCheckIn(point.id, point.name);
        } else {
          Taro.showToast({ title: '该设施不在当前任务中', icon: 'none' });
        }
      }
    });
  };

  const handleComplete = () => {
    if (!task) return;
    const unchecked = task.totalPoints - task.checkedPoints;
    if (unchecked > 0) {
      Taro.showModal({
        title: '提前完成',
        content: `还有 ${unchecked} 个巡检点未完成，确认提前结束任务？`,
        success: (res) => {
          if (res.confirm) {
            updateTaskStatus(task.id, 'done');
            Taro.showToast({ title: '任务已完成', icon: 'success' });
            setTimeout(() => Taro.navigateBack(), 600);
          }
        }
      });
      return;
    }
    Taro.showModal({
      title: '完成任务',
      content: '确认完成所有巡检点？',
      success: (res) => {
        if (res.confirm) {
          updateTaskStatus(task.id, 'done');
          Taro.showToast({ title: '任务已完成', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 600);
        }
      }
    });
  };

  const handleReportHazard = () => {
    Taro.switchTab({ url: '/pages/hazard/index' });
  };

  if (!task) {
    return (
      <View style={{ paddingTop: 120 }}>
        <EmptyState title="任务不存在" description="该任务可能已被删除或您无查看权限" />
      </View>
    );
  }

  const sInfo = statusInfo[task.status];
  const pInfo = priorityInfo[task.priority];

  return (
    <View className={styles.page}>
      <ScrollView className={styles.scroll} scrollY enhanced showScrollbar={false}>
        <View className={styles.topBanner}>
          <View className={styles.bannerTop}>
            <View className={styles.bannerTitleRow}>
              <Tag type={sInfo.type} size="md">{sInfo.label}</Tag>
              {task.isOverdue && <Tag type="danger" size="md">已超时</Tag>}
            </View>
            <Text className={styles.bannerTitle}>{task.title}</Text>
            <Text className={styles.bannerDesc}>{task.description}</Text>
          </View>

          <View className={styles.progressCard}>
            <View className={styles.progressHead}>
              <View>
                <Text className={styles.progressLabel}>巡检进度</Text>
                <Text className={styles.progressValue}>
                  {task.checkedPoints}
                  <Text className={styles.progressTotal}>/{task.totalPoints}</Text>
                </Text>
              </View>
              <View className={styles.progressPct}>{progress}%</View>
            </View>
            <View className={styles.progressBar}>
              <View className={styles.progressFill} style={{ width: `${progress}%` }} />
            </View>
            <View className={styles.progressMeta}>
              <Text className={styles.metaItem}>⏱ {task.startTime} - {task.endTime}</Text>
              <Text className={styles.metaItem}>⏰ 截止 {task.deadline}</Text>
            </View>
          </View>
        </View>

        <View className={styles.content}>
          <View className={styles.infoCard}>
            <View className={styles.infoGrid}>
              <View className={styles.infoCol}>
                <Text className={styles.infoLabel}>计划编号</Text>
                <Text className={styles.infoValue}>{task.planId}</Text>
              </View>
              <View className={styles.infoCol}>
                <Text className={styles.infoLabel}>巡检路线</Text>
                <Text className={styles.infoValue}>{task.routeName}</Text>
              </View>
              <View className={styles.infoCol}>
                <Text className={styles.infoLabel}>负责人</Text>
                <Text className={styles.infoValue}>{task.assignee}</Text>
              </View>
              <View className={styles.infoCol}>
                <Text className={styles.infoLabel}>创建时间</Text>
                <Text className={styles.infoValue}>{task.createdAt}</Text>
              </View>
            </View>
            <View className={styles.priorityRow}>
              <View className={styles.priorityBadge} style={{ background: pInfo.bg }}>
                <Text style={{ color: pInfo.color }}>⚡ {pInfo.label}</Text>
              </View>
            </View>
          </View>

          <View className={styles.card}>
            <SectionHeader
              title="巡检点位"
              subtitle={`${task.checkedPoints}/${task.totalPoints} 已打卡`}
              extra={
                <View className={styles.scanBtn} onClick={handleScanCheckIn}>
                  📷 扫码打卡
                </View>
              }
            />
            <View className={styles.pointList}>
              {task.points.map((p, idx) => (
                <View
                  key={p.id}
                  className={classnames(styles.pointItem, p.checked && styles.pointItemChecked)}
                >
                  <View className={styles.pointLeft}>
                    <View className={classnames(styles.pointIdx, p.checked && styles.pointIdxChecked)}>
                      {p.checked ? '✓' : idx + 1}
                    </View>
                    <View className={styles.pointLine} />
                  </View>
                  <View className={styles.pointContent}>
                    <View className={styles.pointHeader}>
                      <Text className={styles.pointName}>
                        {facilityIcon[p.type] || '📍'} {p.name}
                      </Text>
                      <Tag type={p.checked ? 'success' : 'info'} size="sm">
                        {p.checked ? '已打卡' : '待巡检'}
                      </Tag>
                    </View>
                    <Text className={styles.pointAddr}>📍 {p.address}</Text>
                    {p.checkInTime && (
                      <Text className={styles.pointTime}>🕐 打卡时间 {p.checkInTime}</Text>
                    )}
                    <View className={styles.pointActions}>
                      {!p.checked && (
                        <View
                          className={classnames(styles.actionBtn, styles.actionBtnPrimary)}
                          onClick={() => handleCheckIn(p.id, p.name)}
                        >
                          到点打卡
                        </View>
                      )}
                      <View className={classnames(styles.actionBtn, styles.actionBtnOutline)}>
                        导航前往
                      </View>
                      <View
                        className={classnames(styles.actionBtn, styles.actionBtnDanger)}
                        onClick={handleReportHazard}
                      >
                        隐患上报
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={{ height: 160 }} />
      </ScrollView>

      <View className={styles.bottomBar}>
        {task.status === 'todo' && (
          <View className={styles.bigBtn} onClick={handleStartTask}>
            🚀 开始巡检
          </View>
        )}
        {task.status === 'doing' && (
          <>
            <View className={styles.halfBtn} onClick={() => Taro.switchTab({ url: '/pages/map/index' })}>
              🗺️ 地图导航
            </View>
            <View className={classnames(styles.halfBtn, styles.halfBtnPrimary)} onClick={handleComplete}>
              ✅ 完成任务
            </View>
          </>
        )}
        {(task.status === 'done' || task.status === 'overdue') && (
          <View className={styles.bigBtn} onClick={() => Taro.navigateBack()}>
            ← 返回任务列表
          </View>
        )}
      </View>
    </View>
  );
};

export default TaskDetailPage;
