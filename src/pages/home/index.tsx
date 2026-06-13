import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import StatCard from '@/components/StatCard';
import QuickEntry from '@/components/QuickEntry';
import SectionHeader from '@/components/SectionHeader';
import TaskCard from '@/components/TaskCard';
import TeamMemberDot from '@/components/TeamMemberDot';
import EmptyState from '@/components/EmptyState';
import Tag from '@/components/Tag';
import { useAppStore } from '@/store/useAppStore';
import { useTaskStore } from '@/store/useTaskStore';
import type { QuickEntryItem, TaskStatus } from '@/types';

const quickEntries: QuickEntryItem[] = [
  { key: 'scan', label: '扫码打卡', color: '#1E88E5', bgColor: 'rgba(30,136,229,0.1)', icon: 'scan' },
  { key: 'map', label: '地图巡检', color: '#26A69A', bgColor: 'rgba(38,166,154,0.1)', icon: 'map' },
  { key: 'hazard', label: '隐患上报', color: '#EF5350', bgColor: 'rgba(239,83,80,0.1)', icon: 'hazard' },
  { key: 'workorder', label: '工单处置', color: '#FF9800', bgColor: 'rgba(255,152,0,0.1)', icon: 'workorder' },
  { key: 'facilities', label: '设施档案', color: '#5C6BC0', bgColor: 'rgba(92,107,192,0.1)', icon: 'facilities' },
  { key: 'offline', label: '离线包', color: '#8D6E63', bgColor: 'rgba(141,110,99,0.1)', icon: 'offline' },
  { key: 'team', label: '班组位置', color: '#26A69A', bgColor: 'rgba(38,166,154,0.1)', icon: 'team' },
  { key: 'export', label: '日报导出', color: '#1E88E5', bgColor: 'rgba(30,136,229,0.1)', icon: 'export' }
];

const statusFilters: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'doing', label: '进行中' },
  { key: 'todo', label: '待开始' },
  { key: 'done', label: '已完成' },
  { key: 'overdue', label: '已超时' }
];

const HomePage: React.FC = () => {
  const { user, teamMembers, isOnline, toggleOnline, pendingSyncCount } = useAppStore();
  const { tasks, dailyStats, filter, setFilter, updateTaskStatus } = useTaskStore();
  const [activeFilter, setActiveFilter] = useState<TaskStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'all') return tasks;
    return tasks.filter((t) => t.status === activeFilter);
  }, [tasks, activeFilter]);

  const overdueTask = tasks.find((t) => t.status === 'overdue');

  usePullDownRefresh(() => {
    console.log('[HomePage] 下拉刷新');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 1000);
  });

  const handleFilter = (key: TaskStatus | 'all') => {
    setActiveFilter(key);
    setFilter('taskStatus', key);
  };

  const handleStartTask = (taskId: string) => {
    Taro.showModal({
      title: '开始巡检',
      content: '确认开始此巡检任务吗？',
      success: (res) => {
        if (res.confirm) {
          updateTaskStatus(taskId, 'doing');
          Taro.showToast({ title: '任务已开始', icon: 'success' });
          Taro.switchTab({ url: '/pages/map/index' });
        }
      }
    });
  };

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.length };
    tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 6 ? '凌晨好' : hour < 12 ? '上午好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Image src={user.avatar} className={styles.avatar} mode="aspectFill" />
        <View className={styles.userInfo}>
          <Text className={styles.greeting}>{greeting}，{user.name}</Text>
          <Text className={styles.subInfo}>{user.team} · {user.role}</Text>
        </View>
        <View className={styles.statusBar}>
          <View className={styles.onlineBadge} onClick={toggleOnline}>
            <View className={styles.onlineDot} />
            <Text className={styles.onlineText}>{isOnline ? '在线' : '离线'}</Text>
          </View>
          <View className={styles.syncBadge} onClick={() => Taro.navigateTo({ url: '/pages/offline/index' })}>
            <Text className={styles.syncText}>同步</Text>
            {pendingSyncCount > 0 && (
              <View className={styles.countBadge}>
                <Text className={styles.countText}>{pendingSyncCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.statsGrid}>
          <StatCard
            label="今日任务"
            value={dailyStats?.totalTasks ?? 0}
            unit="项"
            color="primary"
            trend={{ value: 12, isUp: true }}
          />
          <StatCard
            label="已完成"
            value={dailyStats?.completedTasks ?? 0}
            unit="项"
            color="success"
          />
          <StatCard
            label="巡检点位"
            value={`${dailyStats?.checkedPoints ?? 0}/${dailyStats?.totalPoints ?? 0}`}
            color="warning"
          />
          <StatCard
            label="已超时"
            value={dailyStats?.overdueTasks ?? 0}
            unit="项"
            color="error"
          />
        </View>

        <QuickEntry items={quickEntries} columns={4} />

        {overdueTask && (
          <View className={styles.overdueAlert} onClick={() => Taro.navigateTo({ url: `/pages/task-detail/index?id=${overdueTask.id}` })}>
            <View className={styles.alertIcon}>⏰</View>
            <View className={styles.alertContent}>
              <Text className={styles.alertTitle}>任务超时提醒</Text>
              <Text className={styles.alertDesc}>{overdueTask.title} - 请尽快处理</Text>
            </View>
            <Tag text="立即处理" type="error" size="md" />
          </View>
        )}

        <View className={styles.teamCard}>
          <View className={styles.teamHeader}>
            <View className={styles.teamTitle}>
              <Text className={styles.teamTitleText}>班组实时位置</Text>
              <Text className={styles.teamCount}>
                ({teamMembers.filter((m) => m.status === 'online').length}/{teamMembers.length} 在线)
              </Text>
            </View>
            <View className={styles.teamAvatars}>
              {teamMembers.slice(0, 4).map((m) => (
                <View style={{ marginLeft: m === teamMembers[0] ? 0 : -16 }} key={m.id}>
                  <TeamMemberDot member={m} compact />
                </View>
              ))}
              <View className={styles.moreBtn} style={{ marginLeft: 8 }}>
                <Text className={styles.moreBtnText}>查看地图</Text>
              </View>
            </View>
          </View>
          {teamMembers.map((m) => (
            <TeamMemberDot member={m} key={m.id} />
          ))}
        </View>

        <SectionHeader title="今日巡检计划" extra={<Text className={classnames(styles.filterCount)} style={{ color: '#1E88E5', fontSize: 24 }}>共{filteredTasks.length}项</Text>} />

        <View className={styles.filterTabs}>
          {statusFilters.map((f) => (
            <View
              key={f.key}
              className={classnames(styles.filterTab, activeFilter === f.key && styles.active)}
              onClick={() => handleFilter(f.key)}
            >
              <Text className={styles.filterText}>
                {f.label}
                {taskCounts[f.key] !== undefined && (
                  <Text className={styles.filterCount}>({taskCounts[f.key]})</Text>
                )}
              </Text>
            </View>
          ))}
        </View>

        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <View key={task.id}>
              <TaskCard task={task} />
              {task.status === 'todo' && (
                <View style={{ display: 'flex', gap: 16, marginTop: -16, marginBottom: 24, paddingLeft: 32, paddingRight: 32 }}>
                  <View
                    style={{ flex: 1, height: 72, background: 'linear-gradient(135deg,#1E88E5,#42A5F5)', borderRadius: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => handleStartTask(task.id)}
                  >
                    <Text style={{ color: '#fff', fontSize: 28, fontWeight: 500 }}>开始巡检</Text>
                  </View>
                </View>
              )}
            </View>
          ))
        ) : (
          <EmptyState
            icon="📋"
            title="暂无任务"
            description="当前筛选条件下无巡检任务"
          />
        )}
      </View>
    </ScrollView>
  );
};

export default HomePage;
