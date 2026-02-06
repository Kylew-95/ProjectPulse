import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { supabase } from './supabase';

const httpLink = createHttpLink({
    uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/graphql/v1`,
});

const authLink = setContext(async (_, { headers }) => {
    // Get the session from Supabase to ensure we have the latest access token
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const apiKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    return {
        headers: {
            ...headers,
            apikey: apiKey,
            Authorization: token ? `Bearer ${token}` : `Bearer ${apiKey}`,
        }
    };
});

export const apolloClient = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
});
