import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { QueryService } from './queries.service';
import { of } from 'rxjs';

const NUMBER_OF_RESULT = 10;
const FETCH_POLICY = 'cache-and-network';

@Injectable({
  providedIn: 'root',
})
export class UserRepositoryService {
  private repositoryListEndCursor = '';
  private repositoryListHasNextPage = false;

  private repositories: any;

  userRepositoriesQuery!: QueryRef<any>;

  constructor(private apollo: Apollo, private queryService: QueryService) {}
  private async getMoreUserRepositories() {
    await this.userRepositoriesQuery.fetchMore({
      variables: {
        after: this.repositoryListEndCursor,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        const userRepositories = fetchMoreResult.user.repositories;

        const previousUserRepositories = previousResult.user.repositories.edges;
        const currentUserRepositories = userRepositories.edges;

        const typeName = userRepositories.__typename;
        const count = userRepositories.totalCount;

        const currentPageInfo = fetchMoreResult.user.repositories.pageInfo;

        this.repositoryListEndCursor = currentPageInfo.endCursor;
        this.repositoryListHasNextPage = currentPageInfo.hasNextPage;

        this.repositories = [...currentUserRepositories, ...previousUserRepositories];

        const newRepositories = {
          user: {
            __typename: typeName,
            repositories: {
              __typename: typeName,
              totalCount: count,
              edges: this.repositories,
              pageInfo: currentPageInfo,
            },
          },
        };

        return newRepositories;
      },
    });
  }

  async fetchUserRepositories(loginName: string | undefined, fetchMore: boolean = false, numberOfResult: number = NUMBER_OF_RESULT) {
    const queryUserRepositories = this.queryService.getUsersRepositoriesQuery();
    const queryVariables = {
      login: loginName,
      first: numberOfResult,
    };

    if (fetchMore) {
      await this.getMoreUserRepositories();
    } else {
      this.userRepositoriesQuery = this.apollo.watchQuery<any>({
        query: queryUserRepositories,
        variables: queryVariables,
        fetchPolicy: FETCH_POLICY,
      });
    }
  }

  getUserRepositories(userRepositories: any) {
    if (!userRepositories) {
      return;
    }

    const pageInfo = userRepositories.user.repositories.pageInfo;

    this.repositoryListEndCursor = pageInfo.endCursor;
    this.repositoryListHasNextPage = pageInfo.hasNextPage;

    this.repositories = userRepositories.user.repositories.edges;

    return of(this.repositories);
  }

  get userRepositoriesHasNextPage(): boolean {
    return this.repositoryListHasNextPage;
  }
}
