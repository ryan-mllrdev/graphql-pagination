import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
// 1
import { ApolloModule, APOLLO_OPTIONS, Apollo } from 'apollo-angular';
import { HttpLink, HttpLinkModule } from 'apollo-angular-link-http';
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { setContext } from 'apollo-link-context';
import { ApolloLink } from 'apollo-link';

const uri = 'https://api.github.com/graphql';

export function provideApollo(httpLink: HttpLink) {
  const basic = setContext((operation, context) => ({
    headers: {
      Accept: 'charset=utf-8',
    },
  }));

  // Get the authentication token from local storage if it exists
  const token = '00707e09de281f07a60b3cc910b0926f90e88c37';
  const auth = setContext((operation, context) => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }));

  const link = ApolloLink.from([
    basic,
    auth,
    httpLink.create({
      uri,
    }),
  ]);

  const instrospectionFragmentMatcher = new IntrospectionFragmentMatcher({
    introspectionQueryResultData: {
      __schema: {
        types: [
          {
            kind: 'INTERFACE',
            name: 'User',
            possibleTypes: [{ name: 'SearchType' }],
          },
        ],
      },
    },
  });

  const cache = new InMemoryCache({
    fragmentMatcher: instrospectionFragmentMatcher,
  });

  return {
    link,
    cache,
  };
}

@NgModule({
  exports: [HttpClientModule, ApolloModule, HttpLinkModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: provideApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule {
  constructor(private apollo: Apollo) {
    // reset the store after that
    // apollo.getClient().resetStore();
  }
}
