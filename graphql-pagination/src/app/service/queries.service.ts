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
          edges {
            cursor
            node {
              ... on User {
                id
                email
                login
              }
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

  get userRepositoriesQuery() {
    return gql`
      query UserRepositories($login: String!, $first: Int!, $after: String) {
        user(login: $login) {
          repositories(first: $first, after: $after) {
            __typename
            totalCount
            edges {
              node {
                name
              }
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
}
