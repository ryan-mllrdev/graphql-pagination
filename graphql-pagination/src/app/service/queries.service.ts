import { Injectable } from '@angular/core';
import gql from 'graphql-tag';

@Injectable({
  providedIn: 'root',
})
export class QueryService {
  constructor() {}

  getUsersQuery() {
    return gql`
      query($searchKeyword: String!, $first: Int!, $after: String) {
        search(query: $searchKeyword, type: USER, first: $first, after: $after) {
          userCount
          edges {
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
            startCursor
            endCursor
          }
        }
      }
    `;
  }

  getUsersRepositoriesQuery() {
    return gql`
      query UserRepositories($login: String!, $first: Int!, $after: String) {
        user(login: $login) {
          repositories(first: $first, after: $after) {
            totalCount
            edges {
              node {
                name
              }
            }
            pageInfo {
              hasNextPage
              startCursor
              endCursor
            }
          }
        }
      }
    `;
  }
}
