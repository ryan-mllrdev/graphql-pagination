import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import ApolloClient from 'apollo-client';
import { User } from '../../types/User';
import { SearchResultItemConnection } from 'src/generated/graphql';
import { GITHUB_USERS_QUERY } from '../../../graphql-queries';
import { UserFetchResult } from '../../types/UserFetchResult';
import { UserQueryVariables } from '../../types/UserQueryVariables';

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

  fetchUsers(queryVariables: UserQueryVariables): Observable<UserFetchResult> {
    this.usersQuery = this.apollo.watchQuery<UserFetchResult>({
      query: GITHUB_USERS_QUERY,
      variables: queryVariables,
      fetchPolicy: FETCH_POLICY,
    });

    const result = this.usersQuery.valueChanges.pipe(
      map((fetchResult: any) => {
        const usersConnection: UserFetchResult = {
          search: fetchResult.data.search,
        };
        return usersConnection;
      }),
    );

    return result;
  }

  fetchMoreUsers(numberOfResult: number): Observable<UserFetchResult> {
    let fetchResult!: UserFetchResult;
    try {
      const queryVariables = {
        first: numberOfResult,
        after: this.resultCursor,
      };
      this.usersQuery
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

            return (fetchResult = fetchMoreResult);
          },
        })
        .finally(() => {
          return fetchResult;
        });
    } catch (error) {
      console.log(error);
    }
    return of(fetchResult);
  }

  readUsersFromCache(queryVariables: UserQueryVariables): Observable<UserFetchResult | null> {
    let usersConnectionCache: Observable<UserFetchResult | null>;
    try {
      // Try to read from cache
      const cache = this.readQuery(queryVariables);

      if (cache) {
        usersConnectionCache = of(cache);
        // Update query variables
        this.updateQueryVariables(queryVariables);
        return usersConnectionCache;
      }
    } catch (error) {
      console.log(error);
    }

    return of(null);
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
  private readQuery(queryVariables: UserQueryVariables): UserFetchResult | null {
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

  private updateQueryVariables(queryVariables: UserQueryVariables) {
    this.usersQuery.setVariables(queryVariables);
  }
  // END: PRIVATE FUNCTIONS
}
