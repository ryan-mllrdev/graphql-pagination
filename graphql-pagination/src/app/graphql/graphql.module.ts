import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { ApolloModule, APOLLO_OPTIONS, Apollo } from 'apollo-angular';
import { HttpLink, HttpLinkModule } from 'apollo-angular-link-http';
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { setContext } from 'apollo-link-context';
import { ApolloLink } from 'apollo-link';
import { environment } from '../../environments/environment';
import result from '../../generated/graphql';

const uri = 'https://api.github.com/graphql';

export function provideApollo(httpLink: HttpLink) {
  const basic = setContext((operation, context) => ({
    headers: {
      Accept: 'charset=utf-8',
    },
  }));

  const token = environment.GITHUB_API_TOKEN;
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

  const introspectionFragmentMatcher = new IntrospectionFragmentMatcher({
    introspectionQueryResultData: result,
  });

  const cache = new InMemoryCache({
    fragmentMatcher: introspectionFragmentMatcher,
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
  constructor(private apollo: Apollo) {}
}
