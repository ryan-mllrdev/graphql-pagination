import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { QueryService } from '../query-service/queries.service';
import { of, Observable } from 'rxjs';
import ApolloClient from 'apollo-client';
import { UserFetchResult } from '../../types/UserFetchResult';
import { User } from '../../types/User';
import { SearchResultItemConnection } from 'src/generated/graphql';

const NUMBER_OF_RESULT = 10;
const FETCH_POLICY = 'cache-first';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userConnectionCursor = '';
  private connectionHasNextPage = false;
  private totalCount = 0;
  private currentCount = 0;
  private apolloClient: ApolloClient<UserFetchResult>;

  usersConnectionQuery!: QueryRef<UserFetchResult>;

  constructor(private apollo: Apollo, private queryService: QueryService) {
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
    this.userConnectionCursor = currentPageInfo.endCursor ?? '';
    this.connectionHasNextPage = currentPageInfo.hasNextPage;
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
    return this.connectionHasNextPage;
  }

  get currentTotalCount(): number {
    return this.totalCount;
  }

  get currentResultCount(): number {
    return this.currentCount;
  }
  // END: GETTERS

  // PRIVATE FUNCTIONS
  private async fetchMoreUsers(numberOfResult: number): Promise<UserFetchResult | undefined> {
    try {
      const queryVariables = {
        first: numberOfResult,
        after: this.userConnectionCursor,
      };
      let users: UserFetchResult;
      await this.usersConnectionQuery
        .fetchMore({
          variables: queryVariables,
          updateQuery: (previousResult, { fetchMoreResult }) => {
            // search.nodes
            const previousUserNodes = previousResult.search?.nodes;
            const currentUserNodes = fetchMoreResult?.search?.nodes;

            // Merged previous and current results
            const mergedUserNodes = [...(previousUserNodes ?? []), ...(currentUserNodes ?? [])];
            const newSearchResult: UserFetchResult = {
              ...fetchMoreResult,
            };

            if (newSearchResult.search?.nodes) {
              newSearchResult.search.nodes = mergedUserNodes;
            }

            return (users = newSearchResult);
          },
        })
        .finally(() => {
          return users;
        });
    } catch (error) {
      console.log(error);
    }
    return undefined;
  }

  private readQuery(queryVariables: {}): UserFetchResult | null {
    try {
      const usersConnectionCache = this.apolloClient.readQuery<UserFetchResult>({
        query: this.queryService.usersQuery,
        variables: queryVariables,
      });
      return usersConnectionCache;
    } catch (error) {
      return null;
    }
  }

  private initializeQuery(queryVariables: {}) {
    this.usersConnectionQuery = this.apollo.watchQuery<UserFetchResult>({
      query: this.queryService.usersQuery,
      variables: queryVariables,
      fetchPolicy: FETCH_POLICY,
    });
  }

  private updateQueryVariables(queryVariables: {}) {
    this.usersConnectionQuery.setOptions({
      variables: queryVariables,
    });
  }

  private reset() {
    this.userConnectionCursor = '';
    this.connectionHasNextPage = true;
    this.totalCount = 0;
    this.currentCount = 0;
  }
  // END: PRIVATE FUNCTIONS
}
