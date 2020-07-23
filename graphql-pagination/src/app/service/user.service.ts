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
  private userListHasNextPage = true;
  private totalCount = 0;
  private currentCount = 0;

  private apolloClient: ApolloClient<any>;
  private usersConnectionCache: any;

  usersConnectionWatchedQuery!: QueryRef<any>;

  constructor(private apollo: Apollo, private queryService: QueryService) {
    this.apolloClient = apollo.getClient();
  }

  async fetchUsers(searchWord: string, fetchMore: boolean = false, numberOfResult: number = NUMBER_OF_RESULT) {
    if (fetchMore) {
      return await this.fetchMoreUsers();
    } else {
      try {
        this.usersConnectionWatchedQuery.setOptions({
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

    // search.edges
    // search.pageInfo
    const usersConnectionEdges = usersConnection.search.edges;
    const currentPageInfo = usersConnection.search.pageInfo;

    // pageInfo.endCursor
    // pageInfo.hasNextPage
    // search.userCount
    this.userListCursor = currentPageInfo.endCursor;
    this.userListHasNextPage = currentPageInfo.hasNextPage;
    this.totalCount = usersConnection.search.userCount;

    this.currentCount = usersConnectionEdges.length;

    const userList: User[] = this.fetchResultsAsUsers(usersConnectionEdges);
    return of(userList);
  }

  // GETTERS
  get usersHasNextPage(): boolean {
    return this.userListHasNextPage;
  }

  get usersCount(): number {
    return this.totalCount;
  }

  get fetchedCount(): number {
    return this.currentCount;
  }

  get numberOfResult(): number {
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
      await this.usersConnectionWatchedQuery.fetchMore({
        variables: queryVariables,
        updateQuery: (previousResult, { fetchMoreResult }) => {
          // search.edges
          const previousSearchEdges = previousResult.search.edges;
          const currentSearchEdges = fetchMoreResult.search.edges;

          // search.pageInfo
          // search.userCount
          // search.__typename
          const currentPageInfo = fetchMoreResult.search.pageInfo;
          const currentUserCount = fetchMoreResult.search.userCount;
          const typeName = fetchMoreResult.search.__typename;

          // pageInfo.endCursor
          // pageInfo.hasNextPage
          this.userListCursor = currentPageInfo.endCursor;
          this.userListHasNextPage = currentPageInfo.hasNextPage;

          // Merged previous and current results
          const mergeEdgesResult = [...currentSearchEdges, ...previousSearchEdges];

          this.currentCount = mergeEdgesResult.length;

          // Return this result to update the query with the new values
          const newSearchResult: UserResult = {
            search: {
              __typename: typeName,
              userCount: currentUserCount,
              edges: mergeEdgesResult,
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
    this.usersConnectionWatchedQuery = this.apollo.watchQuery<any>({
      query: this.queryService.usersQuery,
      variables: queryVariables,
      fetchPolicy: FETCH_POLICY,
    });
  }

  private fetchResultsAsUsers(users: any): User[] {
    const userList: User[] = [];
    users.forEach((user: any) => userList.push({ name: user.node.login }));
    return userList;
  }

  private reset() {
    this.userListCursor = '';
    this.userListHasNextPage = true;
    this.totalCount = 0;
    this.currentCount = 0;
  }
  // END: PRIVATE FUNCTIONS
}
