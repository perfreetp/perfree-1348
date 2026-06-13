import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import Tag from '../Tag';
import classnames from 'classnames';
import type { WorkOrder, OrderStatus } from '@/types';

const statusMap: Record<OrderStatus, { text: string; type: 'pending' | 'processing' | 'completed' | 'closed' }> = {
  pending: { text: '待处理', type: 'pending' },
  processing: { text: '处理中', type: 'processing' },
  completed: { text: '已完成', type: 'completed' },
  closed: { text: '已关闭', type: 'closed' }
};

const typeMap: Record<string, string> = {
  repair: '维修',
  maintenance: '养护',
  valve_operation: '开关阀',
  emergency: '应急'
};

const priorityMap = {
  high: { text: '高', color: 'error' as const },
  medium: { text: '中', color: 'warning' as const },
  low: { text: '低', color: 'success' as const }
};

interface WorkOrderCardProps {
  order: WorkOrder;
  onClick?: () => void;
}

const WorkOrderCard: React.FC<WorkOrderCardProps> = ({ order, onClick }) => {
  const statusInfo = statusMap[order.status];
  const priorityInfo = priorityMap[order.priority];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/workorder-detail/index?id=${order.id}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <View className={styles.titleRow}>
          <View className={styles.typeBadge}>
            <Text className={styles.typeText}>{typeMap[order.type] || '工单'}</Text>
          </View>
          <Text className={styles.title}>{order.title}</Text>
        </View>
        <View className={styles.tags}>
          <Tag text={statusInfo.text} type={statusInfo.type} />
          <Tag text={`优先级${priorityInfo.text}`} type={priorityInfo.color} />
        </View>
      </View>

      <View className={styles.facility}>
        <Text className={styles.facilityLabel}>设施：</Text>
        <Text className={styles.facilityValue}>{order.facilityName}</Text>
      </View>

      {order.images && order.images.length > 0 && (
        <View className={styles.imageRow}>
          <Image src={order.images[0]} mode="aspectFill" className={styles.thumb} />
          <View className={styles.descWrap}>
            <Text className={styles.description}>{order.description}</Text>
          </View>
        </View>
      )}
      {(!order.images || order.images.length === 0) && (
        <Text className={styles.descriptionNoImg}>{order.description}</Text>
      )}

      <View className={styles.metaRow}>
        <View className={styles.metaItem}>
          <Text className={styles.metaIcon}>👤</Text>
          <Text className={styles.metaText}>{order.assigneeName}</Text>
        </View>
        <View className={styles.metaItem}>
          <Text className={styles.metaIcon}>⏰</Text>
          <Text className={classnames(styles.metaText, order.isOverdue && styles.metaAlert)}>{order.deadline}</Text>
        </View>
      </View>

      {(order.spareParts?.length || order.valveOperations?.length) ? (
        <View className={styles.progressRow}>
          {order.spareParts?.length ? (
            <View className={styles.progressTag}>
              <Text className={styles.progressTagText}>备件 {order.spareParts.length}项</Text>
            </View>
          ) : null}
          {order.valveOperations?.length ? (
            <View className={styles.progressTag}>
              <Text className={styles.progressTagText}>开关阀 {order.valveOperations.length}次</Text>
            </View>
          ) : null}
          {order.historyLogs?.length ? (
            <View className={styles.progressTag}>
              <Text className={styles.progressTagText}>日志 {order.historyLogs.length}条</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View className={styles.footer}>
        <View className={styles.location}>
          <Text className={styles.locationIcon}>📍</Text>
          <Text className={styles.locationText}>{order.location}</Text>
        </View>
        <Text className={styles.createdAt}>创建 {order.createdAt}</Text>
      </View>
    </View>
  );
};

export default WorkOrderCard;
