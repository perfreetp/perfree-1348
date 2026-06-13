import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title = '暂无数据',
  description,
  actionText,
  onAction
}) => {
  return (
    <View className={styles.wrapper}>
      <Text className={styles.icon}>{icon}</Text>
      <Text className={styles.title}>{title}</Text>
      {description && <Text className={styles.description}>{description}</Text>}
      {actionText && onAction && (
        <Button className={styles.button} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </View>
  );
};

export default EmptyState;
