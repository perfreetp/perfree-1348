import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

type TagType = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'danger' | 'info' | 'minor' | 'moderate' | 'major' | 'severe' | 'todo' | 'doing' | 'done' | 'overdue' | 'pending' | 'processing' | 'completed' | 'closed';

interface TagProps {
  text?: string;
  type?: TagType;
  size?: 'sm' | 'md';
  className?: string;
  children?: React.ReactNode;
}

const Tag: React.FC<TagProps> = ({ text, children, type = 'default', size = 'sm', className }) => {
  const content = children ?? text ?? '';
  const typeClass = styles[`type${type.charAt(0).toUpperCase() + type.slice(1)}`];
  const sizeClass = styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`];
  return (
    <View className={classnames(styles.tag, typeClass, sizeClass, className)}>
      <Text className={styles.text}>{content}</Text>
    </View>
  );
};

export default Tag;
