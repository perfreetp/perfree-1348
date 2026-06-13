import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { TeamMember } from '@/types';

interface TeamMemberDotProps {
  member: TeamMember;
  compact?: boolean;
  onClick?: () => void;
}

const TeamMemberDot: React.FC<TeamMemberDotProps> = ({ member, compact = false, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.showModal({
        title: member.name,
        content: `${member.currentTask || '暂无任务'}\n位置更新：${member.lastUpdate}`,
        showCancel: false
      });
    }
  };

  if (compact) {
    return (
      <View className={styles.compactItem} onClick={handleClick}>
        <View className={styles.avatarWrap}>
          <Image src={member.avatar} className={styles.avatar} mode="aspectFill" />
          <View className={classnames(styles.statusDot, member.status === 'online' ? styles.online : styles.offline)} />
        </View>
      </View>
    );
  }

  return (
    <View className={styles.item} onClick={handleClick}>
      <View className={styles.avatarWrap}>
        <Image src={member.avatar} className={styles.avatar} mode="aspectFill" />
        <View className={classnames(styles.statusDot, member.status === 'online' ? styles.online : styles.offline)} />
      </View>
      <View className={styles.info}>
        <Text className={styles.name}>{member.name}</Text>
        <Text className={styles.task}>
          {member.status === 'online' ? (member.currentTask || '待命') : '离线'}
        </Text>
      </View>
      <Text className={styles.updateTime}>{member.lastUpdate}</Text>
    </View>
  );
};

export default TeamMemberDot;
