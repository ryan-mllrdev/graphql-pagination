import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { QueryService } from './queries.service';
import { of } from 'rxjs';

const NUMBER_OF_RESULT = 10;
const FETCH_POLICY = 'network-only';
const DEFAULT_SEARCH = 'location:philippines';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private repositoryListEndCursor = '';
  private repositoryListHasNextPage = false;
  private userListEndCursor = '';
  private userListHasNextPage = false;

  private users: any;
  private repositories: any;

  usersQuery!: QueryRef<any>;
  userRepositoriesQuery!: QueryRef<any>;

  constructor(private apollo: Apollo, private queryService: QueryService) {}

  private async getMoreUsers() {
    await this.usersQuery.fetchMore({
      variables: {
        after: this.userListEndCursor,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        const previousUsers = previousResult.search.edges;
        const currentUsers = fetchMoreResult.search.edges;

        const pageInfo = fetchMoreResult.search.pageInfo;

        this.userListEndCursor = pageInfo.endCursor;
        this.userListHasNextPage = pageInfo.hasNextPage;

        const users = [...currentUsers, ...previousUsers];

        this.users = users;
      },
    });
    return of(this.users);
  }

  async getUsers(fetchMore: boolean = false, searchWord: string = DEFAULT_SEARCH, numberOfResult: number = NUMBER_OF_RESULT) {
    if (fetchMore) {
      return await this.getMoreUsers();
    } else {
      this.usersQuery = this.apollo.watchQuery<any>({
        query: this.queryService.getUsersQuery(),
        variables: {
          searchKeyword: searchWord,
          first: numberOfResult,
        },
        fetchPolicy: FETCH_POLICY,
      });

      return this.usersQuery.valueChanges.pipe(
        map(({ data }) => {
          if (data) {
            const pageInfo = data.search.pageInfo;

            this.userListEndCursor = pageInfo.endCursor;
            this.userListHasNextPage = pageInfo.hasNextPage;

            const [, ...users] = data.search.edges;

            return (this.users = users);
          }
        }),
      );
    }
  }

  private async getMoreUserRepositories() {
    await this.userRepositoriesQuery.fetchMore({
      variables: {
        after: this.repositoryListEndCursor,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        const previousUserRepositories = previousResult.user.repositories.edges;
        const currentUserRepositories = fetchMoreResult.user.repositories.edges;

        const pageInfo = fetchMoreResult.user.repositories.pageInfo;

        this.repositoryListEndCursor = pageInfo.endCursor;
        this.repositoryListHasNextPage = pageInfo.hasNextPage;

        this.repositories = [...currentUserRepositories, ...previousUserRepositories];
      },
    });

    return of(this.repositories);
  }

  async getUserRepositories(loginName: string | undefined, fetchMore: boolean = false, numberOfResult: number = NUMBER_OF_RESULT) {
    if (fetchMore) {
      return await this.getMoreUserRepositories();
    } else {
      this.userRepositoriesQuery = this.apollo.watchQuery<any>({
        query: this.queryService.getUsersRepositoriesQuery(),
        variables: {
          login: loginName,
          first: numberOfResult,
        },
        fetchPolicy: FETCH_POLICY,
      });

      return this.userRepositoriesQuery.valueChanges.pipe(
        map(({ data }) => {
          if (data) {
            const pageInfo = data.user.repositories.pageInfo;

            this.repositoryListEndCursor = pageInfo.endCursor;
            this.repositoryListHasNextPage = pageInfo.hasNextPage;

            this.repositories = data.user.repositories.edges;

            return this.repositories;
          }
          return null;
        }),
      );
    }
  }

  get userRepositoriesHasNextPage(): boolean {
    return this.repositoryListHasNextPage;
  }

  get usersHasNextPage(): boolean {
    return this.userListHasNextPage;
  }

  get userList() {
    return of(this.users);
  }
}
