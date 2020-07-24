import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { QueryService } from './queries.service';
import { of, Observable } from 'rxjs';
import ApolloClient from 'apollo-client';
import { UserResult } from '../types/UserResult';
import { User } from '../types/User';

const NUMBER_OF_RESULT = 10;
const FETCH_POLICY = 'cache-first';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userListCursor = '';
  private connectionHasNextPage = true;
  private totalCount = 0;
  private currentCount = 0;

  private apolloClient: ApolloClient<any>;
  private usersConnectionCache: any;

  usersConnectionQuery!: QueryRef<any>;

  constructor(private apollo: Apollo, private queryService: QueryService) {
    this.apolloClient = apollo.getClient();
  }

  async fetchUsers(searchWord: string, fetchMore: boolean = false, numberOfResult: number = NUMBER_OF_RESULT) {
    if (fetchMore) {
      return await this.fetchMoreUsers();
    } else {
      try {
        this.usersConnectionQuery.setOptions({
          query: this.queryService.usersQuery,
          variables: {
            first: numberOfResult,
            searchKeyword: searchWord,
          },
        });

        // Try to read from cache
        this.usersConnectionCache = this.apolloClient.readQuery({
          query: this.queryService.usersQuery,
          variables: {
            first: numberOfResult,
            searchKeyword: searchWord,
          },
        });

        return this.usersConnectionCache;
      } catch (error) {
        this.reset();
        this.initializeQuery({
          first: numberOfResult,
          searchKeyword: searchWord,
        });
      }
    }
  }

  getUsers(usersConnection: any): Observable<User[]> | undefined {
    if (!usersConnection.search) {
      return;
    }

    // search.nodes
    // search.pageInfo
    const usersConnectionNodes = usersConnection.search.nodes;
    const currentPageInfo = usersConnection.search.pageInfo;

    // pageInfo.endCursor
    // pageInfo.hasNextPage
    // search.userCount
    this.userListCursor = currentPageInfo.endCursor;
    this.connectionHasNextPage = currentPageInfo.hasNextPage;
    this.totalCount = usersConnection.search.userCount;

    this.currentCount = usersConnectionNodes.length;

    const userList: User[] = this.mapUsers(usersConnectionNodes);
    return of(userList);
  }

  // GETTERS
  get hasNextPage(): boolean {
    return this.connectionHasNextPage;
  }

  get currentTotalCount(): number {
    return this.totalCount;
  }

  get currentResultCount(): number {
    return this.currentCount;
  }

  get defaultNumberOfResultToFetch(): number {
    return NUMBER_OF_RESULT;
  }
  // END: GETTERS

  // PRIVATE FUNCTIONS
  private async fetchMoreUsers() {
    try {
      const queryVariables = {
        after: this.userListCursor,
      };

      let newResults: any;
      await this.usersConnectionQuery.fetchMore({
        variables: queryVariables,
        updateQuery: (previousResult, { fetchMoreResult }) => {
          // search.nodes
          const previousUserNodes = previousResult.search.nodes;
          const currentUserNodes = fetchMoreResult.search.nodes;

          // search.pageInfo
          // search.userCount
          // search.__typename
          const currentPageInfo = fetchMoreResult.search.pageInfo;
          const currentUserCount = fetchMoreResult.search.userCount;
          const typeName = fetchMoreResult.search.__typename;

          // pageInfo.endCursor
          // pageInfo.hasNextPage
          this.userListCursor = currentPageInfo.endCursor;
          this.connectionHasNextPage = currentPageInfo.hasNextPage;

          // Merged previous and current results
          const mergedUserNodes = [...currentUserNodes, ...previousUserNodes];

          this.currentCount = mergedUserNodes.length;

          // Return this result to update the query with the new values
          const newSearchResult: UserResult = {
            search: {
              __typename: typeName,
              userCount: currentUserCount,
              nodes: mergedUserNodes,
              pageInfo: currentPageInfo,
            },
          };

          return (newResults = newSearchResult);
        },
      });
      return newResults;
    } catch (error) {
      console.log(error);
    }
    return null;
  }

  private initializeQuery(queryVariables: any) {
    this.usersConnectionQuery = this.apollo.watchQuery<any>({
      query: this.queryService.usersQuery,
      variables: queryVariables,
      fetchPolicy: FETCH_POLICY,
    });
  }

  private mapUsers(users: any): User[] {
    const userList: User[] = users.map((user: any) => {
      return {
        name: user.login,
      };
    });
    return userList;
  }

  private reset() {
    this.userListCursor = '';
    this.connectionHasNextPage = true;
    this.totalCount = 0;
    this.currentCount = 0;
  }
  // END: PRIVATE FUNCTIONS
}
