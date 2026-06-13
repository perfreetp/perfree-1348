import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Image } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import Tag from '@/components/Tag';
import { useTaskStore } from '@/store/useTaskStore';
import type { FacilityType, Facility } from '@/types';

type FilterType = 'all' | FacilityType;

const FacilitiesPage: React.FC = () => {
  const { facilities } = useTaskStore();
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  usePullDownRefresh(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const filteredFacilities = useMemo(() => {
    return facilities.filter(f => {
      if (typeFilter !== 'all' && f.type !== typeFilter) return false;
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      if (keyword && !f.name.includes(keyword) && !f.code.includes(keyword) && !f.location.includes(keyword)) return false;
      return true;
    });
  }, [facilities, keyword, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const valves = facilities.filter(f => f.type === 'valve').length;
    const hydrants = facilities.filter(f => f.type === 'hydrant').length;
    const normal = facilities.filter(f => f.status === 'normal').length;
    const damaged = facilities.filter(f => f.status === 'damaged').length;
    return { valves, hydrants, normal, damaged, total: facilities.length };
  }, [facilities]);

  const typeMap: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
    valve: { label: '阀门井', icon: '🔧', color: '#1E88E5', bgColor: 'rgba(30,136,229,0.1)' },
    hydrant: { label: '消火栓', icon: '🚒', color: '#EF5350', bgColor: 'rgba(239,83,80,0.1)' }
  };

  const statusMap: Record<string, { label: string; type: 'success' | 'warning' | 'danger' }> = {
    normal: { label: '正常', type: 'success' },
    damaged: { label: '破损', type: 'danger' },
    maintenance: { label: '维护中', type: 'warning' }
  };

  const handleScan = () => {
    Taro.scanCode({
      success: (res) => {
        const found = facilities.find(f => f.qrCode === res.result || f.code === res.result);
        if (found) {
          setSelectedFacility(found);
          Taro.showToast({ title: '识别成功', icon: 'success' });
        } else {
          Taro.showToast({ title: '未找到设施', icon: 'none' });
        }
      },
      fail: () => {
        Taro.showToast({ title: '扫码取消', icon: 'none' });
      }
    });
  };

  const handleViewHistory = (f: Facility) => {
    setSelectedFacility(f);
  };

  const handleCloseDetail = () => {
    setSelectedFacility(null);
  };

  return (
    <View className={styles.page}>
      <View className={styles.searchBar}>
        <View className={styles.searchInputWrap}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索设施名称/编号/位置"
            placeholderClass={styles.searchPlaceholder}
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
          />
          {keyword && (
            <Text className={styles.clearIcon} onClick={() => setKeyword('')}>✕</Text>
          )}
        </View>
        <View className={styles.scanBtn} onClick={handleScan}>
          <Text className={styles.scanIcon}>📷</Text>
        </View>
      </View>

      <ScrollView className={styles.content} scrollY enhanced showScrollbar={false}>
        <View className={styles.statsRow}>
          <View className={styles.statChip} style={{ background: 'rgba(30,136,229,0.1)' }}>
            <Text className={styles.statIcon}>🔧</Text>
            <View>
              <Text className={styles.statVal} style={{ color: '#1E88E5' }}>{stats.valves}</Text>
              <Text className={styles.statLbl}>阀门井</Text>
            </View>
          </View>
          <View className={styles.statChip} style={{ background: 'rgba(239,83,80,0.1)' }}>
            <Text className={styles.statIcon}>🚒</Text>
            <View>
              <Text className={styles.statVal} style={{ color: '#EF5350' }}>{stats.hydrants}</Text>
              <Text className={styles.statLbl}>消火栓</Text>
            </View>
          </View>
          <View className={styles.statChip} style={{ background: 'rgba(76,175,80,0.1)' }}>
            <Text className={styles.statIcon}>✅</Text>
            <View>
              <Text className={styles.statVal} style={{ color: '#4CAF50' }}>{stats.normal}</Text>
              <Text className={styles.statLbl}>正常</Text>
            </View>
          </View>
          <View className={styles.statChip} style={{ background: 'rgba(255,152,0,0.1)' }}>
            <Text className={styles.statIcon}>⚠️</Text>
            <View>
              <Text className={styles.statVal} style={{ color: '#FF9800' }}>{stats.damaged}</Text>
              <Text className={styles.statLbl}>异常</Text>
            </View>
          </View>
        </View>

        <View className={styles.filterSection}>
          <View className={styles.filterGroup}>
            <Text className={styles.filterLabel}>类型</Text>
            <View className={styles.filterChips}>
              {[
                { key: 'all', label: '全部' },
                { key: 'valve', label: '🔧 阀门井' },
                { key: 'hydrant', label: '🚒 消火栓' }
              ].map(c => (
                <View
                  key={c.key}
                  className={classnames(styles.filterChip, typeFilter === c.key && styles.filterChipActive)}
                  onClick={() => setTypeFilter(c.key as FilterType)}
                >
                  <Text className={classnames(styles.filterChipText, typeFilter === c.key && styles.filterChipTextActive)}>{c.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <View className={styles.filterGroup}>
            <Text className={styles.filterLabel}>状态</Text>
            <View className={styles.filterChips}>
              {[
                { key: 'all', label: '全部' },
                { key: 'normal', label: '正常' },
                { key: 'damaged', label: '破损' },
                { key: 'maintenance', label: '维护中' }
              ].map(c => (
                <View
                  key={c.key}
                  className={classnames(styles.filterChip, statusFilter === c.key && styles.filterChipActive)}
                  onClick={() => setStatusFilter(c.key)}
                >
                  <Text className={classnames(styles.filterChipText, statusFilter === c.key && styles.filterChipTextActive)}>{c.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <SectionHeader
          title="设施列表"
          subtitle={`共 ${filteredFacilities.length} 条记录`}
          extra={<Tag type="info" size="sm">档案总数 {stats.total}</Tag>}
        />

        {filteredFacilities.length === 0 ? (
          <View className={styles.emptyWrap}>
            <EmptyState title="未找到设施" description="尝试修改筛选条件或搜索关键词" />
          </View>
        ) : (
          <View className={styles.facilityList}>
            {filteredFacilities.map(f => {
              const tInfo = typeMap[f.type];
              const sInfo = statusMap[f.status];
              return (
                <View key={f.id} className={styles.facilityCard} onClick={() => handleViewHistory(f)}>
                  <View className={styles.facilityHeader}>
                    <View className={styles.facilityIcon} style={{ background: tInfo.bgColor }}>
                      <Text className={styles.facilityIconText}>{tInfo.icon}</Text>
                    </View>
                    <View className={styles.facilityMeta}>
                      <View className={styles.facilityNameRow}>
                        <Text className={styles.facilityName}>{f.name}</Text>
                        <Tag type={sInfo.type} size="sm">{sInfo.label}</Tag>
                      </View>
                      <Text className={styles.facilityCode}>编号：{f.code}</Text>
                    </View>
                  </View>

                  <View className={styles.facilityInfoGrid}>
                    <View className={styles.infoItem}>
                      <Text className={styles.infoLabel}>位置</Text>
                      <Text className={styles.infoValue}>{f.location}</Text>
                    </View>
                    <View className={styles.infoRow}>
                      <View className={styles.infoItem}>
                        <Text className={styles.infoLabel}>规格</Text>
                        <Text className={styles.infoValue}>{f.specification || '-'}</Text>
                      </View>
                      <View className={styles.infoItem}>
                        <Text className={styles.infoLabel}>口径</Text>
                        <Text className={styles.infoValue}>{f.diameter || '-'}</Text>
                      </View>
                    </View>
                    <View className={styles.infoRow}>
                      <View className={styles.infoItem}>
                        <Text className={styles.infoLabel}>安装日期</Text>
                        <Text className={styles.infoValue}>{f.installedAt}</Text>
                      </View>
                      <View className={styles.infoItem}>
                        <Text className={styles.infoLabel}>上次巡检</Text>
                        <Text className={styles.infoValue}>{f.lastInspection}</Text>
                      </View>
                    </View>
                  </View>

                  <View className={styles.facilityFooter}>
                    <View className={styles.footerTag}>
                      <Text className={styles.footerTagIcon}>📋</Text>
                      <Text className={styles.footerTagText}>历史记录 {f.historyRecords?.length || 0}条</Text>
                    </View>
                    <Text className={styles.viewDetailText}>查看详情 ›</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {selectedFacility && (
        <View className={styles.detailMask} onClick={handleCloseDetail}>
          <View className={styles.detailSheet} onClick={(e) => e.stopPropagation()}>
            <View className={styles.sheetHandle} />
            <View className={styles.sheetHeader}>
              <Text className={styles.sheetTitle}>设施档案详情</Text>
              <Text className={styles.sheetClose} onClick={handleCloseDetail}>✕</Text>
            </View>
            <ScrollView className={styles.sheetContent} scrollY>
              <View className={styles.detailTopCard}>
                <View className={styles.detailTopLeft}>
                  <View
                    className={styles.detailIcon}
                    style={{ background: typeMap[selectedFacility.type].bgColor }}
                  >
                    <Text className={styles.detailIconText}>{typeMap[selectedFacility.type].icon}</Text>
                  </View>
                  <View>
                    <Text className={styles.detailName}>{selectedFacility.name}</Text>
                    <Text className={styles.detailCode}>{selectedFacility.code} · {typeMap[selectedFacility.type].label}</Text>
                  </View>
                </View>
                <Tag type={statusMap[selectedFacility.status].type}>{statusMap[selectedFacility.status].label}</Tag>
              </View>

              <View className={styles.detailSection}>
                <SectionHeader title="基本信息" />
                <View className={styles.detailInfoList}>
                  {[
                    { label: '位置', value: selectedFacility.location },
                    { label: '安装日期', value: selectedFacility.installedAt },
                    { label: '规格参数', value: selectedFacility.specification || '-' },
                    { label: '口径', value: selectedFacility.diameter || '-' },
                    { label: '额定压力', value: selectedFacility.pressureRating || '-' },
                    { label: '生产厂家', value: selectedFacility.manufacturer || '-' },
                    { label: '所属区域', value: selectedFacility.zone || '-' },
                    { label: '上次巡检', value: selectedFacility.lastInspection },
                    { label: '上次维护', value: selectedFacility.lastMaintenance || '-' }
                  ].map((it, i) => (
                    <View key={i} className={styles.detailInfoRow}>
                      <Text className={styles.detailInfoLabel}>{it.label}</Text>
                      <Text className={styles.detailInfoValue}>{it.value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.detailSection}>
                <SectionHeader title="历史维修记录" subtitle={`共 ${selectedFacility.historyRecords?.length || 0} 条`} />
                {!selectedFacility.historyRecords || selectedFacility.historyRecords.length === 0 ? (
                  <EmptyState title="暂无记录" description="该设施尚无维修记录" size="sm" />
                ) : (
                  <View className={styles.historyList}>
                    {selectedFacility.historyRecords.map((r, idx) => (
                      <View key={r.id} className={styles.historyItem}>
                        <View className={styles.historyTimeline}>
                          <View className={classnames(
                            styles.timelineDot,
                            r.type === 'repair' && styles.timelineDotRepair,
                            r.type === 'maintenance' && styles.timelineDotMaint,
                            r.type === 'inspection' && styles.timelineDotInsp
                          )} />
                          {idx !== (selectedFacility.historyRecords?.length || 0) - 1 && <View className={styles.timelineLine} />}
                        </View>
                        <View className={styles.historyContent}>
                          <View className={styles.historyHeader}>
                            <Tag
                              type={r.type === 'repair' ? 'danger' : r.type === 'maintenance' ? 'warning' : 'primary'}
                              size="sm"
                            >
                              {r.type === 'repair' ? '维修' : r.type === 'maintenance' ? '维护' : '巡检'}
                            </Tag>
                            <Text className={styles.historyDate}>{r.date}</Text>
                          </View>
                          <Text className={styles.historyResult}>结果：{r.result}</Text>
                          <Text className={styles.historyOperator}>操作人：{r.operator}</Text>
                          {r.remark && <Text className={styles.historyRemark}>备注：{r.remark}</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

export default FacilitiesPage;
