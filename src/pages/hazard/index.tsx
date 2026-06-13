import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Input, Textarea, Button } from '@tarojs/components';
import Taro, { usePullDownRefresh } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import HazardCard from '@/components/HazardCard';
import EmptyState from '@/components/EmptyState';
import { useTaskStore } from '@/store/useTaskStore';
import { useAppStore } from '@/store/useAppStore';
import type { HazardLevel } from '@/types';

const tabs = [
  { key: 'new', label: '新建上报' },
  { key: 'history', label: '历史记录' }
];

const hazardTypes = [
  '阀门漏水', '管道破损', '消火栓故障', '井盖破损',
  '压力异常', '暗漏可疑', '排气阀故障', '水表异常', '其他'
];

const levelOptions: { key: HazardLevel; name: string; desc: string }[] = [
  { key: 'minor', name: '一般', desc: '轻微影响' },
  { key: 'moderate', name: '较大', desc: '需尽快处理' },
  { key: 'major', name: '重大', desc: '紧急处理' },
  { key: 'severe', name: '特大', desc: '立即响应' }
];

const HazardPage: React.FC = () => {
  const { hazards, addHazard, facilities, addWorkOrder, updateHazardStatus } = useTaskStore();
  const { user, isOnline, addOfflineData } = useAppStore();
  const [activeTab, setActiveTab] = useState('new');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [level, setLevel] = useState<HazardLevel>('moderate');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [noise, setNoise] = useState<number>(35);
  const [pressure, setPressure] = useState<number>(0.30);
  const [location, setLocation] = useState('人民路168号附近（已定位）');
  const [facilityCode, setFacilityCode] = useState('');

  usePullDownRefresh(() => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '已刷新', icon: 'success' });
    }, 800);
  });

  const filteredHazards = useMemo(() => {
    if (levelFilter === 'all') return hazards;
    return hazards.filter((h) => h.level === levelFilter);
  }, [hazards, levelFilter]);

  const handleTypeToggle = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 9 - photos.length,
      success: (res) => {
        setPhotos((prev) => [...prev, ...res.tempFilePaths]);
        console.log('[HazardPage] 选择图片:', res.tempFilePaths.length);
      },
      fail: (err) => {
        console.error('[HazardPage] 选择图片失败:', err);
        const placeholder = `https://picsum.photos/id/${1000 + photos.length}/750/500`;
        setPhotos((prev) => [...prev, placeholder]);
      }
    });
  };

  const handleDeletePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleScanFacility = () => {
    Taro.scanCode({
      success: (res) => {
        setFacilityCode(res.result);
        Taro.showToast({ title: '设施识别成功', icon: 'success' });
      },
      fail: () => {
        const f = facilities[Math.floor(Math.random() * facilities.length)];
        setFacilityCode(f.code);
        setLocation(f.location);
        Taro.showToast({ title: `模拟识别：${f.name}`, icon: 'none' });
      }
    });
  };

  const handleGetLocation = () => {
    Taro.showLoading({ title: '定位中...' });
    setTimeout(() => {
      Taro.hideLoading();
      setLocation('人民路168号（已重新定位，精度±5米）');
      Taro.showToast({ title: '定位成功', icon: 'success' });
    }, 1200);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请填写隐患标题', icon: 'none' });
      return;
    }
    if (selectedTypes.length === 0) {
      Taro.showToast({ title: '请选择隐患类型', icon: 'none' });
      return;
    }

    const newHazard = {
      id: `hz-${Date.now()}`,
      title: title.trim(),
      description: desc.trim() || '未填写详细描述',
      level,
      type: selectedTypes.join('、'),
      facilityId: facilityCode || undefined,
      facilityName: facilities.find((f) => f.code === facilityCode)?.name,
      location,
      lat: 31.23 + Math.random() * 0.02,
      lng: 121.47 + Math.random() * 0.02,
      images: photos,
      videos: [],
      waterLeakNoise: noise,
      pressureReading: pressure,
      reporterId: user.id,
      reporterName: user.name,
      reportTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      status: 'reported' as const,
      remarks: ''
    };

    console.log('[HazardPage] 提交隐患:', newHazard);

    if (!isOnline) {
      addOfflineData({
        id: `off-${Date.now()}`,
        type: 'hazard_report',
        data: newHazard,
        createdAt: new Date().toISOString(),
        synced: false
      });
      Taro.showModal({
        title: '离线保存成功',
        content: '当前处于离线状态，数据已保存到本地，恢复网络后将自动同步。',
        showCancel: false
      });
    } else {
      addHazard(newHazard);
      Taro.showModal({
        title: '上报成功',
        content: '隐患已上报，是否自动生成维修工单并指派？',
        confirmText: '生成工单',
        cancelText: '暂不生成',
        success: (res) => {
          if (res.confirm) {
            const orderId = `wo-auto-${Date.now()}`;
            const newOrder = {
              id: orderId,
              title: newHazard.title,
              type: 'repair' as const,
              status: 'pending' as const,
              priority:
                newHazard.level === 'severe' || newHazard.level === 'major'
                  ? 'high'
                  : newHazard.level === 'moderate'
                    ? 'medium'
                    : 'low',
              hazardId: newHazard.id,
              facilityId: newHazard.facilityId,
              facilityName: newHazard.facilityName || '关联设施',
              location: newHazard.location,
              description: newHazard.description,
              images: newHazard.images,
              assignee: user.id,
              assigneeName: user.name,
              createdBy: user.name,
              createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
              deadline: '今日 18:00',
              isOverdue: false,
              spareParts: [],
              valveOperations: [],
              historyLogs: [
                {
                  id: `log-${Date.now()}`,
                  action: '隐患自动生成工单',
                  operator: user.name,
                  timestamp: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
                  remarks: `隐患来源：${newHazard.title}`
                }
              ]
            };
            addWorkOrder(newOrder as never);
            updateHazardStatus(newHazard.id, 'assigned');
            const updatedHazards = hazards.map((h) =>
              h.id === newHazard.id ? { ...h, workOrderId: orderId, status: 'assigned' as const } : h
            );
            Taro.showToast({ title: '工单已生成', icon: 'success' });
            setTimeout(() => {
              Taro.switchTab({ url: '/pages/workorder/index' });
            }, 800);
          }
          setTitle('');
          setDesc('');
          setLevel('moderate');
          setSelectedTypes([]);
          setPhotos([]);
          setNoise(35);
          setPressure(0.3);
          setFacilityCode('');
        }
      });
    }
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.tabs}>
        {tabs.map((t) => (
          <View
            key={t.key}
            className={classnames(styles.tab, activeTab === t.key && styles.active)}
            onClick={() => setActiveTab(t.key)}
          >
            <Text className={styles.tabText}>{t.label}</Text>
            {t.key === 'history' && (
              <Text className={styles.tabText} style={{ marginLeft: 6 }}>
                ({hazards.length})
              </Text>
            )}
          </View>
        ))}
      </View>

      {activeTab === 'new' ? (
        <>
          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>
              <View className={styles.titleDot} />
              <Text className={styles.titleText}>基本信息</Text>
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>
                隐患标题<Text className={styles.requiredMark}>*</Text>
              </Text>
              <Input
                className={styles.input}
                placeholder="请简要描述隐患（如：XX路阀门井漏水）"
                value={title}
                onInput={(e) => setTitle(e.detail.value)}
                maxlength={50}
              />
            </View>

            <View className={styles.formRow}>
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text className={styles.formLabel}>关联设施（扫码识别）</Text>
                <View className={styles.autoOrderBtn} onClick={handleScanFacility}>
                  <Text className={styles.autoOrderBtnText}>🔲 扫码识别</Text>
                </View>
              </View>
              <Input
                className={styles.input}
                placeholder="扫码或输入设施编号"
                value={facilityCode}
                onInput={(e) => setFacilityCode(e.detail.value)}
              />
            </View>

            <View className={styles.formRow}>
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text className={styles.formLabel}>位置信息</Text>
                <View className={styles.autoOrderBtn} onClick={handleGetLocation}>
                  <Text className={styles.autoOrderBtnText}>📍 重新定位</Text>
                </View>
              </View>
              <Input
                className={styles.input}
                placeholder="自动获取或手动输入位置"
                value={location}
                onInput={(e) => setLocation(e.detail.value)}
              />
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>
              <View className={styles.titleDot} />
              <Text className={styles.titleText}>隐患等级<Text className={styles.requiredMark}>*</Text></Text>
            </View>
            <View className={styles.levelSelector}>
              {levelOptions.map((o) => (
                <View
                  key={o.key}
                  className={classnames(
                    styles.levelOption,
                    styles[o.key],
                    level === o.key && styles.selected
                  )}
                  onClick={() => setLevel(o.key)}
                >
                  <Text className={classnames(styles.levelName, styles[o.key])}>{o.name}</Text>
                  <Text className={styles.levelDesc}>{o.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>
              <View className={styles.titleDot} />
              <Text className={styles.titleText}>隐患类型<Text className={styles.requiredMark}>*</Text></Text>
            </View>
            <View className={styles.typeChips}>
              {hazardTypes.map((t) => (
                <View
                  key={t}
                  className={classnames(
                    styles.typeChip,
                    selectedTypes.includes(t) && styles.selected
                  )}
                  onClick={() => handleTypeToggle(t)}
                >
                  <Text className={styles.typeChipText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>
              <View className={styles.titleDot} />
              <Text className={styles.titleText}>拍照/录像取证</Text>
            </View>
            <View className={styles.photoGrid}>
              {photos.map((p, i) => (
                <View key={i} className={styles.photoItem}>
                  <Image src={p} className={styles.photoImg} mode="aspectFill" />
                  <View className={styles.photoDel} onClick={() => handleDeletePhoto(i)}>✕</View>
                </View>
              ))}
              {photos.length < 9 && (
                <View
                  className={classnames(styles.photoItem, styles.addPhoto)}
                  onClick={handleChooseImage}
                >
                  <Text className={styles.addIcon}>＋</Text>
                  <Text className={styles.addText}>照片/视频</Text>
                </View>
              )}
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>
              <View className={styles.titleDot} />
              <Text className={styles.titleText}>仪表读数</Text>
            </View>
            <View className={styles.readingGrid}>
              <View className={styles.readingItem}>
                <Text className={styles.formLabel}>漏水噪声值</Text>
                <View className={styles.readingInput}>
                  <Text className={styles.readingValue}>{noise}</Text>
                  <Text className={styles.readingUnit}>dB</Text>
                </View>
                <View className={styles.readingBtns}>
                  <View className={styles.readingBtn} onClick={() => setNoise((n) => Math.max(0, n - 5))}>−</View>
                  <View className={styles.readingBtn} onClick={() => setNoise((n) => Math.min(120, n + 5))}>＋</View>
                </View>
              </View>
              <View className={styles.readingItem}>
                <Text className={styles.formLabel}>压力读数</Text>
                <View className={styles.readingInput}>
                  <Text className={styles.readingValue}>{pressure.toFixed(2)}</Text>
                  <Text className={styles.readingUnit}>MPa</Text>
                </View>
                <View className={styles.readingBtns}>
                  <View className={styles.readingBtn} onClick={() => setPressure((p) => Math.max(0, +(p - 0.05).toFixed(2)))}>−</View>
                  <View className={styles.readingBtn} onClick={() => setPressure((p) => Math.min(2, +(p + 0.05).toFixed(2)))}>＋</View>
                </View>
              </View>
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>
              <View className={styles.titleDot} />
              <Text className={styles.titleText}>详细描述</Text>
            </View>
            <Textarea
              className={styles.textarea}
              placeholder="请详细描述隐患情况、影响范围等信息..."
              value={desc}
              onInput={(e) => setDesc(e.detail.value)}
              maxlength={500}
            />
          </View>
        </>
      ) : (
        <>
          <View style={{ padding: '0 32rpx 16rpx', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[{ k: 'all', l: '全部' }, ...levelOptions.map((o) => ({ k: o.key, l: o.name }))].map((f) => (
              <View
                key={f.k}
                onClick={() => setLevelFilter(f.k)}
                style={{
                  padding: '8rpx 24rpx',
                  borderRadius: 32,
                  background: levelFilter === f.k ? 'linear-gradient(135deg,#1E88E5,#42A5F5)' : '#fff',
                  boxShadow: levelFilter === f.k ? '0 4rpx 12rpx rgba(30,136,229,0.25)' : '0 2rpx 12rpx rgba(0,0,0,0.06)'
                }}
              >
                <Text style={{
                  fontSize: 24,
                  color: levelFilter === f.k ? '#fff' : '#4E5969',
                  fontWeight: 500
                }}>{f.l} ({f.k === 'all' ? hazards.length : hazards.filter((h) => h.level === f.k).length})</Text>
              </View>
            ))}
          </View>

          <View className={styles.historyList}>
            {filteredHazards.length > 0 ? (
              filteredHazards.map((h) => <HazardCard key={h.id} hazard={h} />)
            ) : (
              <EmptyState icon="📋" title="暂无记录" description="还没有隐患上报记录" />
            )}
          </View>
        </>
      )}

      {activeTab === 'new' && (
        <View className={styles.fixedBottom}>
          <View className={classnames(styles.submitBtn, styles.draft)}>
            <Text>保存草稿</Text>
          </View>
          <View className={styles.submitBtn} onClick={handleSubmit}>
            <Text>提交上报{!isOnline ? '（离线）' : ''}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default HazardPage;
