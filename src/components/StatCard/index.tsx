import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, color = 'primary', trend, onClick }) => {
  return (
    <View className={classnames(styles.card, styles[color])} onClick={onClick}>
      <View className={styles.top}>
        <Text className={styles.label}>{label}</Text>
      </View>
      <View className={styles.bottom}>
        <View className={styles.valueRow}>
          <Text className={styles.value}>{value}</Text>
          {unit && <Text className={styles.unit}>{unit}</Text>}
        </View>
        {trend && (
          <View className={classnames(styles.trend, trend.isUp ? styles.trendUp : styles.trendDown)}>
            <Text>{trend.isUp ? '↑' : '↓'}{Math.abs(trend.value)}%</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default StatCard;
