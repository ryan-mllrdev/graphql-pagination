import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { QueryService } from './queries.service';
import { of } from 'rxjs';

const NUMBER_OF_RESULT = 10;
const FETCH_POLICY = 'cache-and-network';
const DEFAULT_SEARCH = 'location:philippines';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userListCursor = '';
  private userListHasNextPage = false;

  private users: any;

  usersQuery!: QueryRef<any>;

  constructor(private apollo: Apollo, private queryService: QueryService) {}

  private async getMoreUsers() {
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

  async fetchUsersData(fetchMore: boolean = false, searchWord: string = DEFAULT_SEARCH, numberOfResult: number = NUMBER_OF_RESULT) {
    const queryUsers = this.queryService.getUsersQuery();
    const queryVariables = {
      searchKeyword: searchWord,
      first: numberOfResult,
    };

    if (fetchMore) {
      await this.getMoreUsers();
    } else {
      this.usersQuery = this.apollo.watchQuery<any>({
        query: queryUsers,
        variables: queryVariables,
        fetchPolicy: FETCH_POLICY,
      });
    }
  }

  getUsersData(usersData: any) {
    if (!usersData) {
      return;
    }

    const currentPageInfo = usersData.search.pageInfo;

    this.userListCursor = currentPageInfo.endCursor;
    this.userListHasNextPage = currentPageInfo.hasNextPage;

    const [, ...users] = usersData.search.edges;

    return of(users);
  }

  get usersHasNextPage(): boolean {
    return this.userListHasNextPage;
  }
}
