import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { QueryService } from './queries.service';
import { of, Observable } from 'rxjs';
import { IUser } from '../interfaces/IUser';

const NUMBER_OF_RESULT = 50;
const FETCH_POLICY = 'cache-and-network';
const DEFAULT_SEARCH = 'location:toronto location:philippines location:japan location:canada';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userListCursor = '';
  private userListHasNextPage = false;
  private totalCount = 0;
  private currentCount = 0;

  private users: any;

  usersQuery!: QueryRef<any>;

  constructor(private apollo: Apollo, private queryService: QueryService) {}

  private async fetchMoreUsers() {
    try {
      await this.usersQuery.fetchMore({
        variables: {
          after: this.userListCursor,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const previousUsers = previousResult.search.edges;
          const currentUsers = fetchMoreResult.search.edges;

          const currentPageInfo = fetchMoreResult.search.pageInfo;
          const currentUserCount = fetchMoreResult.search.userCount;
          const typeName = fetchMoreResult.search.__typename;

          this.userListCursor = currentPageInfo.endCursor;
          this.userListHasNextPage = currentPageInfo.hasNextPage;

          this.currentCount += currentUsers.length;

          const users = [...currentUsers, ...previousUsers];

          this.users = users;

          const newUsersList = {
            search: {
              __typename: typeName,
              userCount: currentUserCount,
              edges: this.users,
              pageInfo: currentPageInfo,
            },
          };

          return newUsersList;
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async fetchUsers(fetchMore: boolean = false, searchWord: string = DEFAULT_SEARCH, numberOfResult: number = NUMBER_OF_RESULT) {
    const usersQuery = this.queryService.usersQuery;
    const queryVariables = {
      searchKeyword: searchWord,
      first: numberOfResult,
    };

    if (fetchMore) {
      await this.fetchMoreUsers();
    } else {
      this.fetchInitialUsers(usersQuery, queryVariables);
    }
  }

  private fetchInitialUsers(usersQuery: any, queryVariables: {}) {
    this.usersQuery = this.apollo.watchQuery<any>({
      query: usersQuery,
      variables: queryVariables,
      fetchPolicy: FETCH_POLICY,
    });
  }

  getCurrentUsers(usersData: any): Observable<IUser[]> | undefined {
    if (!usersData) {
      return;
    }

    const currentPageInfo = usersData.search.pageInfo;

    this.userListCursor = currentPageInfo.endCursor;
    this.userListHasNextPage = currentPageInfo.hasNextPage;
    this.totalCount = usersData.search.userCount;

    const users = usersData.search.edges;

    this.currentCount = users.length;

    const userList: IUser[] = [];
    users.forEach((user: any) => userList.push({ name: user.node.login }));

    return of(userList);
  }

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
}
