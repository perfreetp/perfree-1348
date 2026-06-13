import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import Tag from '../Tag';
import type { InspectionTask, TaskStatus } from '@/types';

const statusMap: Record<TaskStatus, { text: string; type: 'todo' | 'doing' | 'done' | 'overdue' }> = {
  todo: { text: '待开始', type: 'todo' },
  doing: { text: '进行中', type: 'doing' },
  done: { text: '已完成', type: 'done' },
  overdue: { text: '已超时', type: 'overdue' }
};

const priorityMap = {
  high: { text: '高', color: 'error' as const },
  medium: { text: '中', color: 'warning' as const },
  low: { text: '低', color: 'success' as const }
};

interface TaskCardProps {
  task: InspectionTask;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const progress = Math.round((task.checkedPoints / task.totalPoints) * 100);
  const statusInfo = statusMap[task.status];
  const priorityInfo = priorityMap[task.priority];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/task-detail/index?id=${task.id}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{task.title}</Text>
          {task.isOverdue && (
            <View className={styles.overdueBadge}>
              <Text className={styles.overdueText}>超时</Text>
            </View>
          )}
        </View>
        <View className={styles.tags}>
          <Tag text={statusInfo.text} type={statusInfo.type} />
          <Tag text={`优先级${priorityInfo.text}`} type={priorityInfo.color} />
        </View>
      </View>

      <View className={styles.route}>
        <Text className={styles.routeLabel}>巡检路线：</Text>
        <Text className={styles.routeValue}>{task.routeName}</Text>
      </View>

      <View className={styles.progressSection}>
        <View className={styles.progressInfo}>
          <Text className={styles.progressLabel}>巡检进度</Text>
          <Text className={styles.progressValue}>{task.checkedPoints}/{task.totalPoints} 点位</Text>
        </View>
        <View className={styles.progressBar}>
          <View className={styles.progressFill} style={{ width: `${progress}%` }} />
        </View>
        <Text className={styles.progressPercent}>{progress}%</Text>
      </View>

      <View className={styles.footer}>
        <View className={styles.timeInfo}>
          <Text className={styles.timeLabel}>执行时间</Text>
          <Text className={styles.timeValue}>{task.startTime} - {task.endTime}</Text>
        </View>
        <View className={styles.deadlineInfo}>
          <Text className={styles.deadlineLabel}>截止</Text>
          <Text className={classnames(styles.deadlineValue, task.isOverdue && styles.deadlineOverdue)}>{task.deadline}</Text>
        </View>
      </View>
    </View>
  );
};

export default TaskCard;
