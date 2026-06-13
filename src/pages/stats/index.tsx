import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import StatCard from '@/components/StatCard';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import Tag from '@/components/Tag';
import { useTaskStore } from '@/store/useTaskStore';
import { useAppStore } from '@/store/useAppStore';
import dayjs from 'dayjs';

type DateRange = 'today' | 'week' | 'month';

const StatsPage: React.FC = () => {
  const { dailyStats, monthlyStats, tasks, hazards, workOrders } = useTaskStore();
  const { user } = useAppStore();
  const [range, setRange] = useState<DateRange>('today');
  const [refreshing, setRefreshing] = useState(false);

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 800);
  });

  const today = dayjs().format('YYYY年MM月DD日');

  const overviewStats = useMemo(() => {
    if (range === 'today' && dailyStats) {
      return [
        { label: '任务数', value: dailyStats.totalTasks, unit: '个', color: 'primary', icon: '📋' },
        { label: '已完成', value: dailyStats.completedTasks, unit: '个', color: 'success', icon: '✅' },
        { label: '巡检查检', value: dailyStats.checkedPoints, unit: '点', color: 'warning', icon: '📍' },
        { label: '隐患上报', value: dailyStats.hazardsReported, unit: '件', color: 'danger', icon: '⚠️' }
      ];
    }
    return [
      { label: '任务总数', value: tasks.length, unit: '个', color: 'primary', icon: '📋' },
      { label: '已完成', value: tasks.filter(t => t.status === 'done').length, unit: '个', color: 'success', icon: '✅' },
      { label: '隐患总数', value: hazards.length, unit: '件', color: 'warning', icon: '⚠️' },
      { label: '工单完成', value: workOrders.filter(w => w.status === 'completed').length, unit: '单', color: 'danger', icon: '🔧' }
    ];
  }, [range, dailyStats, tasks, hazards, workOrders]);

  const detailMetrics = useMemo(() => {
    if (range === 'today' && dailyStats) {
      return [
        { label: '工时', value: dailyStats.workDuration, unit: '小时', color: '#1E88E5', pct: (dailyStats.workDuration / 8) * 100 },
        { label: '巡检里程', value: dailyStats.distance, unit: '公里', color: '#26A69A', pct: (dailyStats.distance / 20) * 100 },
        { label: '任务完成率', value: dailyStats.totalTasks ? Math.round((dailyStats.completedTasks / dailyStats.totalTasks) * 100) : 0, unit: '%', color: '#FF9800', pct: dailyStats.totalTasks ? (dailyStats.completedTasks / dailyStats.totalTasks) * 100 : 0 },
        { label: '点到位率', value: dailyStats.totalPoints ? Math.round((dailyStats.checkedPoints / dailyStats.totalPoints) * 100) : 0, unit: '%', color: '#5C6BC0', pct: dailyStats.totalPoints ? (dailyStats.checkedPoints / dailyStats.totalPoints) * 100 : 0 }
      ];
    }
    return [
      { label: '任务完成率', value: monthlyStats?.taskCompletionRate || 0, unit: '%', color: '#1E88E5', pct: monthlyStats?.taskCompletionRate || 0 },
      { label: '点到位率', value: monthlyStats?.pointCheckRate || 0, unit: '%', color: '#26A69A', pct: monthlyStats?.pointCheckRate || 0 },
      { label: '月巡检查检', value: tasks.reduce((s, t) => s + t.checkedPoints, 0), unit: '点', color: '#FF9800', pct: 78 },
      { label: '月隐患处置', value: hazards.filter(h => h.status === 'resolved' || h.status === 'closed').length, unit: '件', color: '#5C6BC0', pct: 65 }
    ];
  }, [range, dailyStats, monthlyStats, tasks, hazards]);

  const hazardTrend = monthlyStats?.hazardTrend || [];
  const maxTrendVal = Math.max(...hazardTrend.map(t => t.count), 1);

  const hazardDistribution = monthlyStats?.hazardLevelDistribution || [];
  const totalHazards = hazardDistribution.reduce((s, d) => s + d.count, 0) || 1;

  const levelLabels: Record<string, { label: string; color: string; bgColor: string }> = {
    minor: { label: '一般隐患', color: '#8D6E63', bgColor: 'rgba(141,110,99,0.15)' },
    moderate: { label: '较大隐患', color: '#FF9800', bgColor: 'rgba(255,152,0,0.15)' },
    major: { label: '重大隐患', color: '#EF5350', bgColor: 'rgba(239,83,80,0.15)' },
    severe: { label: '特大隐患', color: '#B71C1C', bgColor: 'rgba(183,28,28,0.15)' }
  };

  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'done').slice(0, 5), [tasks]);

  const handleExport = () => {
    Taro.showModal({
      title: '导出巡检日报',
      content: `确认导出${user.name}的个人巡检日报吗？\n日期：${today}`,
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '正在生成...', mask: true });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '日报已导出', icon: 'success' });
          }, 1200);
        }
      }
    });
  };

  return (
    <ScrollView className={styles.page} scrollY enhanced showScrollbar={false}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View>
            <Text className={styles.pageTitle}>统计中心</Text>
            <Text className={styles.dateText}>{today}</Text>
          </View>
          <View className={styles.exportBtn} onClick={handleExport}>
            <Text className={styles.exportIcon}>📤</Text>
            <Text className={styles.exportText}>导出日报</Text>
          </View>
        </View>

        <View className={styles.rangeTabs}>
          {(['today', 'week', 'month'] as DateRange[]).map(k => (
            <View
              key={k}
              className={classnames(styles.rangeTab, range === k && styles.rangeTabActive)}
              onClick={() => setRange(k)}
            >
              <Text className={classnames(styles.rangeTabText, range === k && styles.rangeTabTextActive)}>
                {k === 'today' ? '今日' : k === 'week' ? '本周' : '本月'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.statsGrid}>
          {overviewStats.map((s, idx) => (
            <StatCard
              key={idx}
              label={s.label}
              value={s.value}
              unit={s.unit}
              color={s.color as any}
              icon={s.icon}
            />
          ))}
        </View>

        <View className={styles.card}>
          <SectionHeader title="效率指标" subtitle="Efficiency Metrics" />
          <View className={styles.metricsList}>
            {detailMetrics.map((m, idx) => (
              <View key={idx} className={styles.metricItem}>
                <View className={styles.metricTop}>
                  <Text className={styles.metricLabel}>{m.label}</Text>
                  <View className={styles.metricValueWrap}>
                    <Text className={styles.metricValue} style={{ color: m.color }}>{m.value}</Text>
                    <Text className={styles.metricUnit}>{m.unit}</Text>
                  </View>
                </View>
                <View className={styles.progressBar}>
                  <View
                    className={styles.progressFill}
                    style={{ width: `${Math.min(m.pct, 100)}%`, backgroundColor: m.color }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.card}>
          <SectionHeader title="隐患趋势" subtitle="Hazard Trend" extra={<Tag type="info">近7天</Tag>} />
          <View className={styles.trendChart}>
            <View className={styles.trendBars}>
              {hazardTrend.map((t, idx) => (
                <View key={idx} className={styles.trendBarItem}>
                  <Text className={styles.trendBarVal}>{t.count}</Text>
                  <View className={styles.trendBarOuter}>
                    <View
                      className={classnames(
                        styles.trendBarInner,
                        idx === hazardTrend.length - 1 && styles.trendBarInnerActive
                      )}
                      style={{ height: `${(t.count / maxTrendVal) * 120}rpx` }}
                    />
                  </View>
                  <Text className={styles.trendBarLabel}>{t.date}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.card}>
          <SectionHeader title="隐患等级分布" subtitle="Hazard Level Distribution" />
          <View className={styles.distribution}>
            {hazardDistribution.map((d, idx) => {
              const info = levelLabels[d.level];
              const pct = (d.count / totalHazards) * 100;
              return (
                <View key={idx} className={styles.distItem}>
                  <View className={styles.distRow}>
                    <View className={styles.distLabelWrap}>
                      <View className={styles.distDot} style={{ backgroundColor: info.color }} />
                      <Text className={styles.distLabel}>{info.label}</Text>
                    </View>
                    <Text className={styles.distCount}>{d.count}件 · {pct.toFixed(0)}%</Text>
                  </View>
                  <View className={styles.distBar}>
                    <View className={styles.distBarFill} style={{ width: `${pct}%`, backgroundColor: info.color }} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.card}>
          <SectionHeader title="近期完成任务" subtitle="Recent Completed" extra={<Text className={styles.moreLink}>查看全部 ›</Text>} />
          {completedTasks.length === 0 ? (
            <EmptyState title="暂无已完成任务" description="完成的任务将显示在这里" size="sm" />
          ) : (
            <View className={styles.taskList}>
              {completedTasks.map(t => (
                <View key={t.id} className={styles.taskRow}>
                  <View className={styles.taskInfo}>
                    <Text className={styles.taskTitle}>{t.title}</Text>
                    <Text className={styles.taskMeta}>{t.routeName} · {t.checkedPoints}/{t.totalPoints}点</Text>
                  </View>
                  <Tag type="success" size="sm">已完成</Tag>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className={styles.summaryCard}>
          <Text className={styles.summaryTitle}>📊 本月个人总结</Text>
          <View className={styles.summaryGrid}>
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{tasks.length}</Text>
              <Text className={styles.summaryLabel}>分配任务</Text>
            </View>
            <View className={styles.summaryDivider} />
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{tasks.filter(t => t.status === 'done').length}</Text>
              <Text className={styles.summaryLabel}>完成任务</Text>
            </View>
            <View className={styles.summaryDivider} />
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{hazards.length}</Text>
              <Text className={styles.summaryLabel}>上报隐患</Text>
            </View>
            <View className={styles.summaryDivider} />
            <View className={styles.summaryItem}>
              <Text className={styles.summaryValue}>{workOrders.filter(w => w.status === 'completed').length}</Text>
              <Text className={styles.summaryLabel}>处置工单</Text>
            </View>
          </View>
          <View className={styles.summaryFooter}>
            <View className={styles.rateBadge}>
              <Text className={styles.rateText}>完成率 {monthlyStats?.taskCompletionRate || 0}%</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
};

export default StatsPage;
