import gql from 'graphql-tag';

export const GITHUB_USERS_QUERY = gql`
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

export const GITHUB_USER_REPOSITORIES_QUERY = gql`
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
