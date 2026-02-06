import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { router, Stack } from 'expo-router';
import { Plus } from 'lucide-react-native';
import TicketCard from '@/components/tickets/TicketCard';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { Ticket } from '@/types/ticket';

const GET_TICKETS = gql`
  query GetTickets {
    ticketsCollection(orderBy: {position: AscNullsLast}) {
      edges {
        node {
          id
          title
          status
          priority
          urgency_score
          created_at
          description
          assignee_id
          team_id
          position
          assignee_profile: profiles {
            full_name
            avatar_url
          }
          teams {
            name
          }
        }
      }
    }
  }
`;

interface GetTicketsData {
  ticketsCollection: {
    edges: {
      node: Ticket;
    }[];
  };
}

export default function TicketsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { data, loading, error, refetch } = useQuery<GetTicketsData>(GET_TICKETS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading && !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (error) {
     return (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
           <Text style={[styles.errorText, { color: '#ef4444' }]}>Error loading tickets: {error.message}</Text>
        </View>
     )
  }

  const tickets = data?.ticketsCollection?.edges.map((edge: { node: Ticket }) => edge.node) || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => router.push('/ticket/create')}
            style={{ marginRight: 15 }}
          >
            <Plus size={24} color={colors.tint} />
          </TouchableOpacity>
        ),
      }} />
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TicketCard ticket={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} colors={[colors.tint]} />
        }
        ListHeaderComponent={
           <View style={styles.header}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Tickets</Text>
                  <Text style={[styles.headerSubtitle, { color: colors.icon }]}>{tickets.length} tickets assigned</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.createButton, { backgroundColor: colors.tint }]}
                  onPress={() => router.push('/ticket/create')}
                >
                  <Plus size={20} color="#fff" />
                  <Text style={styles.createButtonText}>New</Text>
                </TouchableOpacity>
              </View>
           </View>
        }
        ListEmptyComponent={
           <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.icon }]}>No tickets found.</Text>
           </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
     textAlign: 'center',
  },
  emptyContainer: {
     padding: 40,
     alignItems: 'center',
  },
  emptyText: {
     fontSize: 16,
  }
});
