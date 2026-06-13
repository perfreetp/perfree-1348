import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { QuickEntryItem } from '@/types';

interface QuickEntryProps {
  items: QuickEntryItem[];
  columns?: number;
}

const iconMap: Record<string, string> = {
  scan: '📷',
  map: '🗺️',
  hazard: '⚠️',
  workorder: '📋',
  facilities: '🔧',
  offline: '📦',
  team: '👥',
  report: '📊',
  valve: '🔘',
  pressure: '💧',
  export: '📤',
  qr: '🔲'
};

const QuickEntry: React.FC<QuickEntryProps> = ({ items, columns = 4 }) => {
  const handleClick = (key: string) => {
    console.log('[QuickEntry] 点击入口:', key);
    switch (key) {
      case 'scan':
        Taro.scanCode({
          onlyFromCamera: false,
          success: (res) => {
            console.log('[QuickEntry] 扫码结果:', res.result);
            Taro.showToast({ title: '识别成功: ' + res.result, icon: 'none' });
          },
          fail: (err) => {
            console.error('[QuickEntry] 扫码失败:', err);
            Taro.showToast({ title: '扫码已取消', icon: 'none' });
          }
        });
        break;
      case 'map':
        Taro.switchTab({ url: '/pages/map/index' });
        break;
      case 'hazard':
        Taro.switchTab({ url: '/pages/hazard/index' });
        break;
      case 'workorder':
        Taro.switchTab({ url: '/pages/workorder/index' });
        break;
      case 'facilities':
        Taro.navigateTo({ url: '/pages/facilities/index' });
        break;
      case 'offline':
        Taro.navigateTo({ url: '/pages/offline/index' });
        break;
      case 'report':
        Taro.switchTab({ url: '/pages/stats/index' });
        break;
      case 'export':
        Taro.showToast({ title: '日报导出中...', icon: 'loading' });
        setTimeout(() => {
          Taro.showToast({ title: '日报已导出', icon: 'success' });
        }, 1500);
        break;
      case 'team':
        Taro.showToast({ title: '班组位置共享中', icon: 'none' });
        break;
      case 'valve':
        Taro.showToast({ title: '打开开关阀记录', icon: 'none' });
        break;
      case 'pressure':
        Taro.showToast({ title: '压力读数录入', icon: 'none' });
        break;
      default:
        Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  return (
    <View className={styles.grid} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {items.map((item) => (
        <View
          key={item.key}
          className={styles.item}
          onClick={() => handleClick(item.key)}
        >
          <View
            className={styles.iconWrap}
            style={{ backgroundColor: item.bgColor }}
          >
            <Text className={styles.icon} style={{ color: item.color }}>
              {iconMap[item.icon] || item.icon}
            </Text>
          </View>
          <Text className={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

export default QuickEntry;
