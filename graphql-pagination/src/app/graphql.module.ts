import { NgModule } from '@angular/core';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';

import { ApolloModule, APOLLO_OPTIONS, Apollo } from 'apollo-angular';
import { HttpLink, HttpLinkModule } from 'apollo-angular-link-http';
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';
import { environment } from '../environments/environment';
import introspectionSchema from '../generated/fragment-matcher';

export function provideApollo(httpLink: HttpLink) {
  const http = httpLink.create({
    uri: 'https://api.github.com/graphql',
    headers: new HttpHeaders().set('Authorization', `Bearer ${environment.GITHUB_API_TOKEN}`),
  });

  const apolloLink = ApolloLink.from([http]);

  const introspectionFragmentMatcher = new IntrospectionFragmentMatcher({
    introspectionQueryResultData: introspectionSchema,
  });

  const cache = new InMemoryCache({
    fragmentMatcher: introspectionFragmentMatcher,
  });

  return {
    link: apolloLink,
    cache,
    connectToDevTools: true,
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
