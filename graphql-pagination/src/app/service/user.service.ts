import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { QueryService } from './queries.service';
import { of, Observable } from 'rxjs';
import ApolloClient from 'apollo-client';
import { UserResult } from '../types/UserResult';
import { User } from '../types/User';

const NUMBER_OF_RESULT = 50;
const FETCH_POLICY = 'cache-and-network';
const DEFAULT_SEARCH = 'location:dumaguete';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userListCursor = '';
  private userListHasNextPage = true;
  private totalCount = 0;
  private currentCount = 0;

  private apolloClient: ApolloClient<any>;
  private queryVariables = {};

  usersWatchQuery!: QueryRef<any>;

  constructor(private apollo: Apollo, private queryService: QueryService) {
    this.apolloClient = apollo.getClient();
  }

  async fetchUsers(fetchMore: boolean = false, searchWord: string = DEFAULT_SEARCH, numberOfResult: number = NUMBER_OF_RESULT) {
    try {
      this.setQueryVariables(searchWord, numberOfResult);
      if (fetchMore) {
        await this.fetchMoreUsers();
      } else {
        this.setInitialQuery();
      }
    } catch (error) {
      console.log(error);
    }
  }

  getUserResults(usersData: any): Observable<User[]> | undefined {
    if (!usersData) {
      return;
    }

    const currentPageInfo = usersData.search.pageInfo;

    this.userListCursor = currentPageInfo.endCursor;
    this.userListHasNextPage = currentPageInfo.hasNextPage;
    this.totalCount = usersData.search.userCount;

    const users = usersData.search.edges;

    this.currentCount = users.length;

    const userList: User[] = this.fetchResultsAsUsers(users);

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
        ...this.queryVariables,
        after: this.userListCursor,
      };

      await this.usersWatchQuery.fetchMore({
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

          this.currentCount += currentSearchEdges.length;

          // Merged previous and current results
          const mergeEdgesResult = [...currentSearchEdges, ...previousSearchEdges];

          // Load users data to a list of type User
          const userList: User[] = this.fetchResultsAsUsers(mergeEdgesResult);

          // Return this result to update the query with the new values
          const newSearchResult: UserResult = {
            search: {
              __typename: typeName,
              userCount: currentUserCount,
              edges: userList,
              pageInfo: currentPageInfo,
            },
          };

          return newSearchResult;
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  private setQueryVariables(searchWord: string, numberOfResult: number) {
    this.queryVariables = {
      searchKeyword: searchWord,
      first: numberOfResult,
    };
  }

  private setInitialQuery() {
    this.usersWatchQuery = this.apollo.watchQuery<any>({
      query: this.queryService.usersQuery,
      variables: this.queryVariables,
      fetchPolicy: FETCH_POLICY,
    });
  }

  private fetchResultsAsUsers(users: any): User[] {
    const userList: User[] = [];
    users.forEach((user: any) => userList.push({ name: user.node.login }));
    return userList;
  }
  // END: PRIVATE FUNCTIONS
}
