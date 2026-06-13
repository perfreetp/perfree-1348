import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import Tag from '@/components/Tag';
import { useAppStore } from '@/store/useAppStore';
import dayjs from 'dayjs';
import type { OfflineDataItem } from '@/types';

type TabKey = 'offline' | 'queue' | 'download';

const OfflinePage: React.FC = () => {
  const { isOnline, offlineData, addOfflineData, removeOfflineData, clearOfflineData, markAllSynced } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  const [syncing, setSyncing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const queueGroups = useMemo(() => {
    const groups: Record<string, OfflineDataItem[]> = {};
    offlineData.forEach(item => {
      const date = dayjs(item.createdAt).format('YYYY-MM-DD');
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  }, [offlineData]);

  const typeInfo: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
    task_checkin: { label: '巡检打卡', icon: '📍', color: '#1E88E5', bgColor: 'rgba(30,136,229,0.1)' },
    hazard_report: { label: '隐患上报', icon: '⚠️', color: '#EF5350', bgColor: 'rgba(239,83,80,0.1)' },
    workorder: { label: '工单记录', icon: '🔧', color: '#FF9800', bgColor: 'rgba(255,152,0,0.1)' }
  };

  const downloadablePackages = [
    { id: 'p1', name: '城东片区地图包', size: '12.5 MB', updated: '2026-06-13 08:00', downloaded: true, zone: '城东' },
    { id: 'p2', name: '城西片区地图包', size: '15.2 MB', updated: '2026-06-12 18:30', downloaded: true, zone: '城西' },
    { id: 'p3', name: '城南片区地图包', size: '18.7 MB', updated: '2026-06-13 06:00', downloaded: false, zone: '城南' },
    { id: 'p4', name: '城北片区地图包', size: '9.8 MB', updated: '2026-06-11 12:00', downloaded: false, zone: '城北' },
    { id: 'p5', name: '设施档案数据包', size: '5.4 MB', updated: '2026-06-13 07:30', downloaded: true, zone: '全部' },
    { id: 'p6', name: '巡检计划数据包', size: '2.1 MB', updated: '2026-06-13 05:00', downloaded: true, zone: '全部' }
  ];

  const pendingCount = offlineData.filter(d => !d.synced).length;
  const syncedCount = offlineData.filter(d => d.synced).length;

  const handleSyncAll = () => {
    if (pendingCount === 0) {
      Taro.showToast({ title: '暂无可同步数据', icon: 'none' });
      return;
    }
    if (!isOnline) {
      Taro.showToast({ title: '网络不可用，无法同步', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '同步离线数据',
      content: `检测到 ${pendingCount} 条待同步数据，确认立即同步？`,
      success: (res) => {
        if (res.confirm) {
          setSyncing(true);
          Taro.showLoading({ title: '同步中...', mask: true });
          setTimeout(() => {
            markAllSynced();
            setSyncing(false);
            Taro.hideLoading();
            Taro.showToast({ title: `已同步 ${pendingCount} 条`, icon: 'success' });
          }, 1500);
        }
      }
    });
  };

  const handleSyncItem = (id: string) => {
    if (!isOnline) {
      Taro.showToast({ title: '网络不可用', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: '同步中...', mask: true });
    setTimeout(() => {
      const list = offlineData.map(d => d.id === id ? { ...d, synced: true } : d);
      clearOfflineData();
      list.forEach(d => addOfflineData(d));
      Taro.hideLoading();
      Taro.showToast({ title: '同步成功', icon: 'success' });
    }, 800);
  };

  const handleDeleteItem = (id: string) => {
    Taro.showModal({
      title: '删除记录',
      content: '确认删除此离线记录？此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          removeOfflineData(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  const handleClearSynced = () => {
    if (syncedCount === 0) {
      Taro.showToast({ title: '暂无可清理数据', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '清理已同步',
      content: `确认清理 ${syncedCount} 条已同步记录？`,
      success: (res) => {
        if (res.confirm) {
          const pending = offlineData.filter(d => !d.synced);
          clearOfflineData();
          pending.forEach(d => addOfflineData(d));
          Taro.showToast({ title: '清理完成', icon: 'success' });
        }
      }
    });
  };

  const handleDownload = (pkg: typeof downloadablePackages[0]) => {
    if (pkg.downloaded) {
      Taro.showToast({ title: '已下载', icon: 'none' });
      return;
    }
    setDownloading(true);
    setDownloadProgress(0);
    Taro.showLoading({ title: '下载中 0%', mask: true });
    const timer = setInterval(() => {
      setDownloadProgress(prev => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(timer);
          Taro.hideLoading();
          setDownloading(false);
          Taro.showToast({ title: '下载完成', icon: 'success' });
          return 100;
        }
        Taro.showLoading({ title: `下载中 ${next}%`, mask: true });
        return next;
      });
    }, 300);
  };

  const handleDeletePackage = (pkg: typeof downloadablePackages[0]) => {
    Taro.showModal({
      title: '删除离线包',
      content: `确认删除「${pkg.name}」？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.statusRow}>
          <View className={styles.statusBadge}>
            <View className={classnames(styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline)} />
            <Text className={styles.statusText}>{isOnline ? '在线' : '离线'}</Text>
          </View>
          <Text className={styles.timeText}>{dayjs().format('YYYY-MM-DD HH:mm')}</Text>
        </View>

        <View className={styles.summaryRow}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryVal} style={{ color: '#EF5350' }}>{pendingCount}</Text>
            <Text className={styles.summaryLbl}>待同步</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryVal} style={{ color: '#4CAF50' }}>{syncedCount}</Text>
            <Text className={styles.summaryLbl}>已同步</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryVal} style={{ color: '#1E88E5' }}>
              {downloadablePackages.filter(p => p.downloaded).length}
            </Text>
            <Text className={styles.summaryLbl}>离线包</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryVal} style={{ color: '#FF9800' }}>
              {(
                downloadablePackages.filter(p => p.downloaded).reduce((s, p) => {
                  const num = parseFloat(p.size);
                  return s + num;
                }, 0)
              ).toFixed(1)}
            </Text>
            <Text className={styles.summaryLbl}>已用(MB)</Text>
          </View>
        </View>

        <View className={styles.tabBar}>
          {([
            { key: 'queue', label: '同步队列', icon: '📤', badge: pendingCount },
            { key: 'download', label: '离线包下载', icon: '📦' },
            { key: 'offline', label: '使用说明', icon: '💡' }
          ] as { key: TabKey; label: string; icon: string; badge?: number }[]).map(tab => (
            <View
              key={tab.key}
              className={classnames(styles.tabItem, activeTab === tab.key && styles.tabItemActive)}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text className={styles.tabIcon}>{tab.icon}</Text>
              <Text className={styles.tabText}>{tab.label}</Text>
              {tab.badge && tab.badge > 0 && (
                <View className={styles.tabBadge}>{tab.badge > 99 ? '99+' : tab.badge}</View>
              )}
            </View>
          ))}
        </View>
      </View>

      <ScrollView className={styles.content} scrollY enhanced showScrollbar={false}>
        {activeTab === 'queue' && (
          <View>
            <View className={styles.actionBar}>
              <View className={styles.actionBtn} onClick={handleSyncAll}>
                <Text className={styles.actionBtnIcon}>📡</Text>
                <Text className={styles.actionBtnText}>一键同步</Text>
              </View>
              <View className={styles.actionBtn} onClick={handleClearSynced}>
                <Text className={styles.actionBtnIcon}>🗑️</Text>
                <Text className={styles.actionBtnText}>清理已同步</Text>
              </View>
            </View>

            {offlineData.length === 0 ? (
              <EmptyState title="离线数据队列为空" description="离线填写的内容将在此处等待同步" />
            ) : (
              <View>
                {Object.entries(queueGroups).map(([date, items]) => (
                  <View key={date} className={styles.dateGroup}>
                    <View className={styles.dateHeader}>
                      <Text className={styles.dateLabel}>{date}</Text>
                      <Tag type="info" size="sm">{items.length} 条</Tag>
                    </View>
                    <View className={styles.queueList}>
                      {items.map(item => {
                        const info = typeInfo[item.type];
                        return (
                          <View key={item.id} className={styles.queueCard}>
                            <View className={styles.queueHeader}>
                              <View className={styles.queueTypeBadge} style={{ background: info.bgColor }}>
                                <Text className={styles.queueTypeIcon}>{info.icon}</Text>
                                <Text className={styles.queueTypeText} style={{ color: info.color }}>{info.label}</Text>
                              </View>
                              <Tag
                                type={item.synced ? 'success' : 'warning'}
                                size="sm"
                              >
                                {item.synced ? '已同步' : '待同步'}
                              </Tag>
                            </View>

                            <View className={styles.queueBody}>
                              <Text className={styles.queueTime}>
                                保存时间：{dayjs(item.createdAt).format('HH:mm:ss')}
                              </Text>
                              {item.syncError && (
                                <Text className={styles.queueError}>❌ {item.syncError}</Text>
                              )}
                            </View>

                            <View className={styles.queueActions}>
                              {!item.synced ? (
                                <View
                                  className={classnames(styles.queueBtn, styles.queueBtnPrimary)}
                                  onClick={() => handleSyncItem(item.id)}
                                >
                                  立即同步
                                </View>
                              ) : null}
                              <View
                                className={classnames(styles.queueBtn, styles.queueBtnDanger)}
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                删除
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'download' && (
          <View>
            <View className={styles.spaceTip}>
              <Text className={styles.spaceTipIcon}>💾</Text>
              <View>
                <Text className={styles.spaceTipTitle}>存储占用</Text>
                <Text className={styles.spaceTipDesc">已下载 6 个离线包，共占用 47.5 MB 存储空间</Text>
              </View>
            </View>

            <SectionHeader title="片区地图包" subtitle="Zone Maps" />
            <View className={styles.packageList}>
              {downloadablePackages.slice(0, 4).map(pkg => (
                <View key={pkg.id} className={styles.packageCard}>
                  <View className={styles.pkgHeader}>
                    <View className={styles.pkgIconWrap}>
                      <Text className={styles.pkgIcon}>🗺️</Text>
                    </View>
                    <View className={styles.pkgInfo}>
                      <Text className={styles.pkgName}>{pkg.name}</Text>
                      <Text className={styles.pkgMeta}>{pkg.size} · 更新于 {pkg.updated}</Text>
                    </View>
                    {pkg.downloaded ? (
                      <Tag type="success" size="sm">已下载</Tag>
                    ) : (
                      <Tag type="info" size="sm">可下载</Tag>
                    )}
                  </View>
                  <View className={styles.pkgActions}>
                    {pkg.downloaded ? (
                      <View className={classnames(styles.pkgBtn, styles.pkgBtnSecondary)} onClick={() => handleDeletePackage(pkg)}>
                        删除
                      </View>
                    ) : (
                      <View
                        className={classnames(styles.pkgBtn, styles.pkgBtnPrimary)}
                        onClick={() => handleDownload(pkg)}
                      >
                        {downloading && downloadProgress < 100 ? `下载中 ${downloadProgress}%` : '下载'}
                      </View>
                    )}
                    <View className={classnames(styles.pkgBtn, styles.pkgBtnOutline)}>
                      详情
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <SectionHeader title="数据资源包" subtitle="Data Packages" />
            <View className={styles.packageList}>
              {downloadablePackages.slice(4).map(pkg => (
                <View key={pkg.id} className={styles.packageCard}>
                  <View className={styles.pkgHeader}>
                    <View className={styles.pkgIconWrap} style={{ background: 'rgba(92,107,192,0.1)' }}>
                      <Text className={styles.pkgIcon}>📊</Text>
                    </View>
                    <View className={styles.pkgInfo}>
                      <Text className={styles.pkgName}>{pkg.name}</Text>
                      <Text className={styles.pkgMeta}>{pkg.size} · 更新于 {pkg.updated}</Text>
                    </View>
                    {pkg.downloaded ? (
                      <Tag type="success" size="sm">已下载</Tag>
                    ) : (
                      <Tag type="info" size="sm">可下载</Tag>
                    )}
                  </View>
                  <View className={styles.pkgActions}>
                    {pkg.downloaded ? (
                      <View className={classnames(styles.pkgBtn, styles.pkgBtnSecondary)} onClick={() => handleDeletePackage(pkg)}>
                        删除
                      </View>
                    ) : (
                      <View
                        className={classnames(styles.pkgBtn, styles.pkgBtnPrimary)}
                        onClick={() => handleDownload(pkg)}
                      >
                        下载
                      </View>
                    )}
                    <View className={classnames(styles.pkgBtn, styles.pkgBtnOutline)}>
                      更新
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'offline' && (
          <View className={styles.guideSection}>
            <View className={styles.guideCard}>
              <View className={styles.guideIcon}>📱</View>
              <View className={styles.guideContent}>
                <Text className={styles.guideTitle}>离线使用流程</Text>
                <View className={styles.guideSteps}>
                  {[
                    { step: 1, text: '在有网络环境下，进入「离线包下载」下载所需片区地图和数据包' },
                    { step: 2, text: '到达无网络区域后，系统自动进入离线模式，所有操作暂存本地' },
                    { step: 3, text: '巡检打卡、隐患上报、工单记录等操作均可离线填写' },
                    { step: 4, text: '恢复网络后，进入「同步队列」点击「一键同步」上传所有离线数据' },
                    { step: 5, text: '同步完成后可清理已同步记录，释放存储空间' }
                  ].map(s => (
                    <View key={s.step} className={styles.guideStep}>
                      <View className={styles.stepNum}>{s.step}</View>
                      <Text className={styles.stepText}>{s.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View className={styles.tipCards}>
              <View className={styles.tipCard}>
                <Text className={styles.tipIcon}>⚡</Text>
                <Text className={styles.tipTitle}>自动检测网络</Text>
                <Text className={styles.tipDesc}>系统实时监测网络状态，切换时无需手动操作</Text>
              </View>
              <View className={styles.tipCard}>
                <Text className={styles.tipIcon}>🔒</Text>
                <Text className={styles.tipTitle}>数据安全</Text>
                <Text className={styles.tipDesc}>离线数据加密存储，未同步前不会丢失</Text>
              </View>
              <View className={styles.tipCard}>
                <Text className={styles.tipIcon}>💾</Text>
                <Text className={styles.tipTitle}>空间提醒</Text>
                <Text className={styles.tipDesc}>离线数据超出100MB时自动提醒清理</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default OfflinePage;
