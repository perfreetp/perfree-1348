import React from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import Tag from '../Tag';
import type { HazardReport, HazardLevel } from '@/types';
import classnames from 'classnames';

const levelMap: Record<HazardLevel, { text: string; type: 'minor' | 'moderate' | 'major' | 'severe' }> = {
  minor: { text: '一般', type: 'minor' },
  moderate: { text: '较大', type: 'moderate' },
  major: { text: '重大', type: 'major' },
  severe: { text: '特大', type: 'severe' }
};

const statusMap: Record<string, { text: string; type: 'warning' | 'primary' | 'processing' | 'success' | 'closed' }> = {
  reported: { text: '已上报', type: 'warning' },
  assigned: { text: '已派单', type: 'primary' },
  processing: { text: '处理中', type: 'processing' },
  resolved: { text: '已解决', type: 'success' },
  closed: { text: '已关闭', type: 'closed' }
};

interface HazardCardProps {
  hazard: HazardReport;
  onClick?: () => void;
}

const HazardCard: React.FC<HazardCardProps> = ({ hazard, onClick }) => {
  const levelInfo = levelMap[hazard.level];
  const statusInfo = statusMap[hazard.status];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/hazard-detail/index?id=${hazard.id}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{hazard.title}</Text>
        </View>
        <View className={styles.tags}>
          <Tag text={levelInfo.text} type={levelInfo.type} />
          <Tag text={statusInfo.text} type={statusInfo.type} />
        </View>
      </View>

      <View className={styles.typeRow}>
        <View className={styles.typeTag}>
          <Text className={styles.typeText}>{hazard.type}</Text>
        </View>
        {hazard.facilityName && (
          <Text className={styles.facility}>关联设施：{hazard.facilityName}</Text>
        )}
      </View>

      <Text className={styles.description}>{hazard.description}</Text>

      {hazard.images.length > 0 && (
        <ScrollView scrollX className={styles.imageScroll}>
          {hazard.images.slice(0, 4).map((img, idx) => (
            <View key={idx} className={styles.imageWrap}>
              <Image src={img} mode="aspectFill" className={styles.image} />
            </View>
          ))}
          {hazard.images.length > 4 && (
            <View className={styles.imageMore}>
              <Text className={styles.imageMoreText}>+{hazard.images.length - 4}</Text>
            </View>
          )}
        </ScrollView>
      )}

      <View className={styles.readings}>
        {hazard.waterLeakNoise !== undefined && (
          <View className={styles.readingItem}>
            <Text className={styles.readingLabel}>噪声值</Text>
            <Text className={classnames(styles.readingValue, hazard.waterLeakNoise > 50 && styles.readingAlert)}>
              {hazard.waterLeakNoise} <Text className={styles.readingUnit}>dB</Text>
            </Text>
          </View>
        )}
        {hazard.pressureReading !== undefined && (
          <View className={styles.readingItem}>
            <Text className={styles.readingLabel}>压力读数</Text>
            <Text className={classnames(styles.readingValue, hazard.pressureReading < 0.15 && styles.readingAlert)}>
              {hazard.pressureReading} <Text className={styles.readingUnit}>MPa</Text>
            </Text>
          </View>
        )}
      </View>

      <View className={styles.footer}>
        <View className={styles.location}>
          <Text className={styles.locationIcon}>📍</Text>
          <Text className={styles.locationText}>{hazard.location}</Text>
        </View>
        <View className={styles.meta}>
          <Text className={styles.reporter}>{hazard.reporterName}</Text>
          <Text className={styles.time}>{hazard.reportTime}</Text>
        </View>
      </View>
    </View>
  );
};

export default HazardCard;
