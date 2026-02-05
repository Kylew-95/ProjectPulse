import React from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '../../lib/apolloClient';

interface GraphqlProviderProps {
  children: React.ReactNode;
}

export const GraphqlProvider: React.FC<GraphqlProviderProps> = ({ children }) => {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
};
