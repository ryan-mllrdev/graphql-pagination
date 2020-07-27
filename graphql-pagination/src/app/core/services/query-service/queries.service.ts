import { Injectable } from '@angular/core';
import gql from 'graphql-tag';

@Injectable({
  providedIn: 'root',
})
export class QueryService {
  constructor() {}

  get usersQuery() {
    return gql`
      query Users($searchKeyword: String!, $first: Int!, $after: String) {
        search(query: $searchKeyword, type: USER, first: $first, after: $after) {
          __typename
          userCount
          nodes {
            ... on User {
              id
              email
              login
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
  }

  get repositoriesQuery() {
    return gql`
      query UserRepositories($login: String!, $first: Int!, $after: String) {
        user(login: $login) {
          repositories(first: $first, after: $after) {
            __typename
            totalCount
            nodes {
              name
              url
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;
  }

  get githubGraphQLApiSchemasQuery() {
    return gql`
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `;
  }
}
