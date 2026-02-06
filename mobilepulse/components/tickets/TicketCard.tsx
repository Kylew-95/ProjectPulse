import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Flag, Zap } from 'lucide-react-native';
import { Ticket } from '@/types/ticket';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TicketCardProps {
  ticket: Ticket;
  onPress?: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return '#3b82f6';
    case 'in_progress': return '#f59e0b';
    case 'done': return '#10b981';
    case 'backlog': return '#64748b';
    default: return '#64748b';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#64748b';
  }
};

export default function TicketCard({ ticket, onPress }: TicketCardProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.tabIconDefault + '20' }]} 
      onPress={onPress || (() => router.push(`/ticket/${ticket.id}` as any))}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{ticket.title}</Text>
        <View style={styles.badge}>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(ticket.status)}20` }]}>
               <Text style={[styles.badgeText, { color: getStatusColor(ticket.status) }]}>{ticket.status}</Text>
            </View>

        </View>
      </View>
      
      <Text style={[styles.description, { color: colors.icon }]} numberOfLines={2}>{ticket.description}</Text>
      
      <View style={styles.footer}>
         <View style={styles.metaContainer}>
            <View style={[styles.iconBadge, { backgroundColor: `${getPriorityColor(ticket.priority)}15` }]}>
               <Flag size={12} color={getPriorityColor(ticket.priority)} />
               <Text style={[styles.metaText, { color: getPriorityColor(ticket.priority) }]}>{ticket.priority}</Text>
            </View>
            <View style={[styles.iconBadge, { backgroundColor: '#8b5cf615' }]}>
               <Zap size={12} color="#8b5cf6" />
               <Text style={[styles.metaText, { color: '#8b5cf6' }]}>{ticket.urgency_score}</Text>
            </View>
         </View>
         <Text style={[styles.date, { color: colors.icon + '60' }]}>{formatDate(ticket.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  iconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 12,
  }
});
