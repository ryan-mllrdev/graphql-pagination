import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { of, Observable } from 'rxjs';
import ApolloClient from 'apollo-client';
import { User } from '../../types/User';
import { SearchResultItemConnection } from 'src/generated/graphql';
import { GITHUB_USERS_QUERY } from '../../../graphql-queries';
import { UserFetchResult } from '../../types/UserFetchResult';

const NUMBER_OF_RESULT = 10;
const FETCH_POLICY = 'cache-first';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private resultCursor = '';
  private resultHasNextPage = false;
  private totalCount = 0;
  private currentCount = 0;
  private apolloClient: ApolloClient<UserFetchResult>;

  usersQuery!: QueryRef<UserFetchResult>;

  constructor(private apollo: Apollo) {
    this.apolloClient = apollo.getClient();
  }

  async fetchUsers(
    searchWord: string,
    fetchMore: boolean = false,
    numberOfResult: number = NUMBER_OF_RESULT,
  ): Promise<UserFetchResult | null | undefined> {
    const queryVariables = {
      first: numberOfResult,
      searchKeyword: searchWord,
    };

    try {
      if (fetchMore) {
        // Fetching more users
        return await this.fetchMoreUsers(numberOfResult);
      } else {
        // Try to read from cache
        const usersConnectionCache = this.readQuery(queryVariables);

        if (usersConnectionCache) {
          // Update query variables
          this.updateQueryVariables(queryVariables);
          return usersConnectionCache;
        } else {
          // Initial request
          this.reset();
          this.initializeQuery(queryVariables);
        }
      }
    } catch (error) {
      console.log(error);
    }

    return undefined;
  }

  populateUsers(usersConnection: SearchResultItemConnection | undefined): Observable<User[]> | undefined {
    if (!usersConnection || !usersConnection.nodes) {
      return;
    }

    // search.nodes
    // search.pageInfo
    const usersConnectionNodes = usersConnection.nodes;
    const currentPageInfo = usersConnection.pageInfo;

    // pageInfo.endCursor
    // pageInfo.hasNextPage
    // search.userCount
    this.resultCursor = currentPageInfo.endCursor ?? '';
    this.resultHasNextPage = currentPageInfo.hasNextPage;
    this.totalCount = usersConnection.userCount;

    this.currentCount = usersConnectionNodes?.length ?? 0;

    const userList: User[] = usersConnectionNodes?.map((user: any) => {
      return {
        name: user.name,
        login: user.login,
        get displayName(): string {
          return user.name ?? user.login ?? '';
        },
      };
    });

    return of(userList);
  }

  // GETTERS
  get hasNextPage(): boolean | null | undefined {
    return this.resultHasNextPage;
  }

  get currentTotalCount(): number {
    return this.totalCount;
  }

  get currentResultCount(): number {
    return this.currentCount;
  }
  // END: GETTERS

  // PRIVATE FUNCTIONS
  private async fetchMoreUsers(numberOfResult: number): Promise<UserFetchResult> {
    let queryResult!: UserFetchResult;
    try {
      const queryVariables = {
        first: numberOfResult,
        after: this.resultCursor,
      };
      await this.usersQuery
        .fetchMore({
          variables: queryVariables,
          updateQuery: (previousResult, { fetchMoreResult }) => {
            if (!fetchMoreResult) {
              return previousResult;
            }

            const currentUserNodes = fetchMoreResult.search.nodes;
            const previousUserNodes = previousResult.search.nodes;

            // Merged previous and current results
            const mergedUserNodes = [...(previousUserNodes ?? []), ...(currentUserNodes ?? [])];
            fetchMoreResult.search.nodes = mergedUserNodes;

            return (queryResult = fetchMoreResult);
          },
        })
        .finally(() => {
          return queryResult;
        });
    } catch (error) {
      console.log(error);
    }
    return queryResult;
  }

  private readQuery(queryVariables: {}): UserFetchResult | null {
    try {
      const usersConnectionCache = this.apolloClient.readQuery<UserFetchResult>({
        query: GITHUB_USERS_QUERY,
        variables: queryVariables,
      });
      return usersConnectionCache;
    } catch (error) {
      return null;
    }
  }

  private initializeQuery(queryVariables: {}) {
    this.usersQuery = this.apollo.watchQuery<UserFetchResult>({
      query: GITHUB_USERS_QUERY,
      variables: queryVariables,
      fetchPolicy: FETCH_POLICY,
    });
  }

  private updateQueryVariables(queryVariables: {}) {
    this.usersQuery.setVariables(queryVariables);
  }

  private reset() {
    this.resultCursor = '';
    this.resultHasNextPage = true;
    this.totalCount = 0;
    this.currentCount = 0;
  }
  // END: PRIVATE FUNCTIONS
}
