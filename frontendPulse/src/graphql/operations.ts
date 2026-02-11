import { gql } from '@apollo/client';

/**
 * TICKETS
 */
export const GET_TICKETS = gql`
  query GetTickets {
    tickets_viewCollection(orderBy: {position: AscNullsLast}) {
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
          assignee_full_name
          assignee_avatar_url
          reporter_full_name
          reporter_avatar_url
          team_name
        }
      }
    }
  }
`;

export const INSERT_TICKET = gql`
  mutation InsertTicket($objects: [ticketsInsertInput!]!) {
    insertIntoticketsCollection(objects: $objects) {
      records {
        id
        title
      }
    }
  }
`;

export const UPDATE_TICKET = gql`
  mutation UpdateTicket($id: BigInt!, $set: ticketsUpdateInput!) {
    updateticketsCollection(filter: { id: { eq: $id } }, set: $set) {
      records {
        id
        title
      }
    }
  }
`;

export const DELETE_TICKET = gql`
  mutation DeleteTicket($id: BigInt!) {
    deleteFromticketsCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

export const BULK_UPDATE_TICKETS = gql`
  mutation BulkUpdateTickets($filter: ticketsFilter!, $set: ticketsUpdateInput!) {
    updateticketsCollection(filter: $filter, set: $set) {
      records {
        id
      }
    }
  }
`;

export const BULK_DELETE_TICKETS = gql`
  mutation BulkDeleteTickets($filter: ticketsFilter!) {
    deleteFromticketsCollection(filter: $filter) {
      records {
        id
      }
    }
  }
`;

/**
 * AI WORKSPACE (Intelligence)
 */
export const GET_HISTORY = gql`
  query GetHistory($userId: UUID!) {
    ai_chat_historyCollection(
      filter: { user_id: { eq: $userId } }
      orderBy: { updated_at: DescNullsLast }
    ) {
      edges {
        node {
          id
          title
          created_at
          updated_at
        }
      }
    }
  }
`;

export const GET_CHAT_DETAILS = gql`
  query GetChatDetails($chatId: UUID!, $userId: UUID!) {
    ai_chat_historyCollection(
      filter: { id: { eq: $chatId }, user_id: { eq: $userId } }
    ) {
      edges {
        node {
          id
          title
          messages
        }
      }
    }
  }
`;

export const SAVE_CHAT = gql`
  mutation SaveChat($objects: [ai_chat_historyInsertInput!]!) {
    insertIntoai_chat_historyCollection(objects: $objects) {
      records {
        id
        title
        created_at
        updated_at
      }
    }
  }
`;

export const UPDATE_CHAT = gql`
  mutation UpdateChat($id: UUID!, $userId: UUID!, $set: ai_chat_historyUpdateInput!) {
    updateai_chat_historyCollection(filter: { id: { eq: $id }, user_id: { eq: $userId } }, set: $set) {
      records {
        id
        title
        updated_at
      }
    }
  }
`;

export const DELETE_CHAT = gql`
  mutation DeleteChat($id: UUID!, $userId: UUID!) {
    deleteFromai_chat_historyCollection(filter: { id: { eq: $id }, user_id: { eq: $userId } }) {
      records {
        id
      }
    }
  }
`;

/**
 * TEAMS & MEMBERS
 */
export const GET_TEAMS_FOR_USER = gql`
  query GetTeamsForUser($userId: UUID!) {
    team_membersCollection(filter: { user_id: { eq: $userId } }) {
      edges {
        node {
          team_id
          teams {
            id
            name
            team_membersCollection {
              edges {
                node {
                  id
                  user_id
                  profiles: profiles {
                    full_name
                    avatar_url
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const CREATE_TEAM = gql`
  mutation CreateTeam($objects: [teamsInsertInput!]!) {
    insertIntoteamsCollection(objects: $objects) {
      records {
        id
        name
      }
    }
  }
`;

export const JOIN_TEAM = gql`
  mutation JoinTeam($objects: [team_membersInsertInput!]!) {
    insertIntoteam_membersCollection(objects: $objects) {
      records {
        id
      }
    }
  }
`;

export const GET_TEAM_MEMBERS = gql`
  query GetTeamMembers($teamId: UUID!) {
    teamsCollection(filter: { id: { eq: $teamId } }) {
      edges {
        node {
          id
          name
          team_membersCollection {
            edges {
                node {
                id
                user_id
                email
                discord_id
                role
                status
                profiles: profiles {
                  full_name
                  avatar_url
                  email
                  discord_status
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const INVITE_MEMBER = gql`
  mutation InviteMember($objects: [team_membersInsertInput!]!) {
    insertIntoteam_membersCollection(objects: $objects) {
      records {
        id
      }
    }
  }
`;

export const UPDATE_MEMBER_ROLE = gql`
  mutation UpdateMemberRole($id: UUID!, $set: team_membersUpdateInput!) {
    updateteam_membersCollection(filter: { id: { eq: $id } }, set: $set) {
      records {
        id
        role
      }
    }
  }
`;

export const DELETE_MEMBER = gql`
  mutation DeleteMember($id: UUID!) {
    deleteFromteam_membersCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

export const DELETE_TEAM = gql`
  mutation DeleteTeam($id: UUID!) {
    deleteFromteamsCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

/**
 * KNOWLEDGE BASE
 */
export const GET_KB_ENTRIES = gql`
  query GetKBEntries {
    knowledge_baseCollection(orderBy: { created_at: DescNullsLast }) {
      edges {
        node {
          id
          question
          answer
          created_at
        }
      }
    }
  }
`;

export const INSERT_KB_ENTRY = gql`
  mutation InsertKBEntry($objects: [knowledge_baseInsertInput!]!) {
    insertIntoknowledge_baseCollection(objects: $objects) {
      records {
        id
      }
    }
  }
`;

export const UPDATE_KB_ENTRY = gql`
  mutation UpdateKBEntry($id: Int!, $set: knowledge_baseUpdateInput!) {
    updateknowledge_baseCollection(filter: { id: { eq: $id } }, set: $set) {
      records {
        id
      }
    }
  }
`;

export const DELETE_KB_ENTRY = gql`
  mutation DeleteKBEntry($id: Int!) {
    deleteFromknowledge_baseCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;

/**
 * AUDIT LOGS
 */
export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($filter: audit_logsFilter, $orderBy: [audit_logsOrderBy!], $first: Int) {
    audit_logsCollection(filter: $filter, orderBy: $orderBy, first: $first) {
      edges {
        node {
          id
          actor_id
          action
          entity_type
          entity_id
          metadata
          created_at
          profiles {
            full_name
            email
          }
        }
      }
    }
  }
`;

export const DELETE_AUDIT_LOGS = gql`
  mutation DeleteAuditLogs($filter: audit_logsFilter!) {
    deleteFromaudit_logsCollection(filter: $filter) {
      records {
        id
      }
    }
  }
`;

export const DELETE_AUDIT_LOG_BATCH = gql`
  mutation DeleteAuditLogBatch($filter: audit_logsFilter!, $atMost: Int!) {
    deleteFromaudit_logsCollection(filter: $filter, atMost: $atMost) {
      records {
        id
      }
    }
  }
`;

export const GET_LOG_IDS_FOR_DELETION = gql`
  query GetLogIdsForDeletion($first: Int) {
    audit_logsCollection(first: $first, orderBy: [{created_at: DescNullsFirst}]) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

/**
 * ANALYTICS (Tickets Breakdown)
 */
export const GET_TICKETS_ANALYTICS = gql`
  query GetTicketsAnalytics {
    tickets_viewCollection {
      edges {
        node {
          id
          title
          status
          priority
          type
          urgency_score
          created_at
          assignee_full_name
        }
      }
    }
  }
`;
