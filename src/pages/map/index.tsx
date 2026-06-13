import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import Tag from '@/components/Tag';
import { useTaskStore } from '@/store/useTaskStore';
import { useAppStore } from '@/store/useAppStore';

type PointStatus = 'checked' | 'current' | 'todo';

interface MapPoint {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  top: string;
  left: string;
  status: PointStatus;
  order: number;
  address: string;
  checkInTime?: string;
}

const MapPage: React.FC = () => {
  const { tasks, checkInPoint, updateTaskStatus } = useTaskStore();
  const { teamMembers, hazards } = useTaskStore();
  const appStore = useAppStore();

  const activeTask = tasks.find((t) => t.status === 'doing') || tasks[0];
  const [selectedTaskId] = useState(activeTask?.id);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const mapPoints = useMemo<MapPoint[]>(() => {
    if (!activeTask) return [];
    const currentIdx = activeTask.points.findIndex((p) => !p.checked);
    return activeTask.points.map((p, i) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      lat: p.lat,
      lng: p.lng,
      top: `${15 + (i % 4) * 20 + (i % 2) * 8}%`,
      left: `${10 + (i % 5) * 18}%`,
      status: p.checked ? 'checked' : (i === currentIdx ? 'current' : 'todo') as PointStatus,
      order: p.order || i + 1,
      address: p.address,
      checkInTime: p.checkInTime
    }));
  }, [activeTask]);

  const currentPoint = mapPoints.find((p) => p.status === 'current') || mapPoints[0];
  const selectedPoint = selectedPointId
    ? mapPoints.find((p) => p.id === selectedPointId)
    : currentPoint;

  const teamMarkers = [
    { id: 't1', name: '李明', top: '32%', left: '38%' },
    { id: 't2', name: '王芳', top: '58%', left: '70%' }
  ];

  const hazardMarkers = [
    { id: 'h1', title: '漏水', top: '42%', left: '55%' }
  ];

  const handleCheckIn = () => {
    if (!activeTask || !currentPoint) return;
    console.log('[MapPage] 打卡:', activeTask.id, currentPoint.id);

    const uncheckedCount = activeTask.points.filter((p) => !p.checked).length;
    const isLastPoint = uncheckedCount === 1 && !currentPoint.checked;

    checkInPoint(activeTask.id, currentPoint.id);
    Taro.showToast({ title: '打卡成功', icon: 'success' });

    if (isLastPoint) {
      setTimeout(() => {
        Taro.showModal({
          title: '🎉 巡检完成',
          content: '所有点位已打卡完成，是否结束任务并标记为已完成？',
          confirmText: '结束任务',
          cancelText: '继续检查',
          success: (res) => {
            if (res.confirm) {
              updateTaskStatus(activeTask.id, 'done');
              Taro.showToast({ title: '任务已完成', icon: 'success' });
            }
          }
        });
      }, 600);
    }
  };

  const handleScan = () => {
    Taro.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        console.log('[MapPage] 扫码结果:', res.result);
        Taro.showToast({ title: `识别设施: ${res.result}`, icon: 'none' });
        if (activeTask && currentPoint) {
          const uncheckedCount = activeTask.points.filter((p) => !p.checked).length;
          const isLastPoint = uncheckedCount === 1 && !currentPoint.checked;

          checkInPoint(activeTask.id, currentPoint.id);

          if (isLastPoint) {
            setTimeout(() => {
              Taro.showModal({
                title: '🎉 巡检完成',
                content: '所有点位已打卡完成，是否结束任务并标记为已完成？',
                confirmText: '结束任务',
                cancelText: '继续检查',
                success: (res) => {
                  if (res.confirm) {
                    updateTaskStatus(activeTask.id, 'done');
                    Taro.showToast({ title: '任务已完成', icon: 'success' });
                  }
                }
              });
            }, 600);
          }
        }
      },
      fail: (err) => {
        console.error('[MapPage] 扫码失败:', err);
        Taro.showToast({ title: '扫码取消', icon: 'none' });
      }
    });
  };

  const handleNavigate = () => {
    Taro.showToast({ title: '正在启动导航...', icon: 'loading' });
    setTimeout(() => {
      Taro.showToast({ title: '导航已启动', icon: 'success' });
    }, 1000);
  };

  const handleReportHazard = () => {
    Taro.switchTab({ url: '/pages/hazard/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.mapContainer}>
        <View className={styles.mapBg}>
          <View className={styles.gridLines} />
          <View className={styles.roads}>
            <View className={classnames(styles.road, styles.roadH)} style={{ top: '25%', left: '5%', width: '90%' }} />
            <View className={classnames(styles.road, styles.roadH)} style={{ top: '50%', left: '0%', width: '100%', height: '36rpx' }} />
            <View className={classnames(styles.road, styles.roadH)} style={{ top: '75%', left: '10%', width: '80%' }} />
            <View className={classnames(styles.road, styles.roadV)} style={{ left: '25%', top: '5%', height: '90%' }} />
            <View className={classnames(styles.road, styles.roadV)} style={{ left: '55%', top: '0%', height: '100%', width: '32rpx' }} />
            <View className={classnames(styles.road, styles.roadV)} style={{ left: '80%', top: '10%', height: '80%' }} />
          </View>
        </View>

        <View className={styles.currentLocation}>
          <View className={styles.pulseRing} />
          <View className={styles.currentDot} />
        </View>

        <View className={styles.markers}>
          {mapPoints.map((p) => (
            <View
              key={p.id}
              className={styles.marker}
              style={{ top: p.top, left: p.left }}
              onClick={() => setSelectedPointId(p.id)}
            >
              <View className={classnames(
                styles.markerPin,
                p.status === 'checked' && styles.pointChecked,
                p.status === 'todo' && styles.pointTodo,
                p.status === 'current' && styles.pointCurrent
              )}>
                <Text className={styles.markerIcon}>
                  {p.status === 'checked' ? '✓' : p.order}
                </Text>
              </View>
              {(selectedPointId === p.id || p.status === 'current') && (
                <View className={styles.markerLabel}>
                  <Text className={styles.markerLabelText}>{p.name}</Text>
                </View>
              )}
            </View>
          ))}

          {teamMarkers.map((m) => (
            <View key={m.id} className={styles.marker} style={{ top: m.top, left: m.left }}>
              <View className={classnames(styles.markerPin, styles.team)}>
                <Text className={styles.markerIcon}>👤</Text>
              </View>
              <View className={styles.markerLabel}>
                <Text className={styles.markerLabelText}>{m.name}</Text>
              </View>
            </View>
          ))}

          {hazardMarkers.map((h) => (
            <View key={h.id} className={styles.marker} style={{ top: h.top, left: h.left }}>
              <View className={classnames(styles.markerPin, styles.hazard)}>
                <Text className={styles.markerIcon}>!</Text>
              </View>
              <View className={styles.markerLabel}>
                <Text className={styles.markerLabelText}>{h.title}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className={styles.taskSelector}>
          <View className={styles.taskSelectCard}>
            <View className={styles.taskInfo}>
              <Text className={styles.taskName}>{activeTask?.title || '暂无进行中任务'}</Text>
              <Text className={styles.taskProgress}>
                进度 {activeTask?.checkedPoints || 0}/{activeTask?.totalPoints || 0}
                （{activeTask ? Math.round((activeTask.checkedPoints / activeTask.totalPoints) * 100) : 0}%）
              </Text>
            </View>
            <View className={styles.changeBtn} onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>
              <Text className={styles.changeBtnText}>切换任务</Text>
            </View>
          </View>
        </View>

        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: '#1E88E5' }} />
            <Text className={styles.legendText}>待巡检</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: '#FF9800' }} />
            <Text className={styles.legendText}>当前点</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: '#26A69A' }} />
            <Text className={styles.legendText}>已完成</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} style={{ backgroundColor: '#AB47BC' }} />
            <Text className={styles.legendText}>同事</Text>
          </View>
        </View>
      </View>

      <View className={styles.bottomPanel}>
        <View className={styles.panelHeader}>
          <View>
            <Text className={styles.panelTitle}>
              {selectedPoint ? `#${selectedPoint.order} ${selectedPoint.name}` : '选择巡检点'}
            </Text>
            {selectedPoint && (
              <View style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tag text={selectedPoint.type === 'valve' ? '阀门井' : '消火栓'} type="primary" />
                {selectedPoint.status === 'checked' && <Tag text={`打卡 ${selectedPoint.checkInTime}`} type="success" />}
                {selectedPoint.status === 'current' && <Tag text="待打卡" type="warning" />}
              </View>
            )}
          </View>
          <View className={styles.navBtn} onClick={handleNavigate}>
            <Text className={styles.navBtnText}>🧭 导航</Text>
          </View>
        </View>

        {selectedPoint && (
          <Text style={{ fontSize: 24, color: '#4E5969', marginBottom: 16 }}>📍 {selectedPoint.address}</Text>
        )}

        <ScrollView scrollY className={styles.pointList} style={{ maxHeight: 300 }}>
          {mapPoints.map((p) => (
            <View
              key={p.id}
              className={classnames(
                styles.pointItem,
                p.status === 'current' && styles.current,
                p.status === 'checked' && styles.checked
              )}
              onClick={() => setSelectedPointId(p.id)}
            >
              <View className={styles.pointIndex}>{p.status === 'checked' ? '✓' : p.order}</View>
              <View className={styles.pointContent}>
                <Text className={styles.pointName}>{p.name}</Text>
                <Text className={styles.pointAddr}>{p.address}</Text>
              </View>
              <View className={styles.pointRight}>
                <Text className={styles.pointType}>
                  {p.type === 'valve' ? '阀门' : '消火栓'}
                </Text>
                {p.checkInTime && <Text className={styles.pointTime}>{p.checkInTime}</Text>}
              </View>
            </View>
          ))}
        </ScrollView>

        <View className={styles.actionBar}>
          <View className={classnames(styles.actionBtn, styles.secondary)} onClick={handleReportHazard}>
            <Text>⚠️ 隐患上报</Text>
          </View>
          <View className={classnames(styles.actionBtn, styles.secondary)} onClick={handleScan}>
            <Text>📷 扫码打卡</Text>
          </View>
          <View className={classnames(styles.actionBtn, styles.primary)} onClick={handleCheckIn}>
            <Text>📍 到点打卡</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MapPage;
