import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { QueryService } from './queries.service';
import { of, Observable } from 'rxjs';
import { RepositoryResult } from '../types/RepositoryResult';
import { Repository } from '../types/Repository';

const NUMBER_OF_RESULT = 50;
const FETCH_POLICY = 'cache-and-network';

@Injectable({
  providedIn: 'root',
})
export class UserRepositoryService {
  private repositoryListEndCursor = '';
  private repositoryListHasNextPage = false;
  private totalCount = 0;
  private currentCount = 0;

  private repositories: any;

  userRepositoriesQuery!: QueryRef<any>;

  constructor(private apollo: Apollo, private queryService: QueryService) {}
  private async fetchMoreUserRepositories() {
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

        this.currentCount += currentUserRepositories.length;

        this.repositories = [...currentUserRepositories, ...previousUserRepositories];

        const newResults: RepositoryResult = {
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

        return newResults;
      },
    });
  }

  async fetchUserRepositories(loginName: string, fetchMore: boolean = false, numberOfResult: number = NUMBER_OF_RESULT) {
    if (!loginName) {
      return;
    }

    const queryUserRepositories = this.queryService.userRepositoriesQuery;
    const queryVariables = {
      login: loginName,
      first: numberOfResult,
    };

    if (fetchMore) {
      await this.fetchMoreUserRepositories();
    } else {
      this.userRepositoriesQuery = this.apollo.watchQuery<any>({
        query: queryUserRepositories,
        variables: queryVariables,
        fetchPolicy: FETCH_POLICY,
      });
    }
  }

  getCurrentUserRepositories(userRepositories: any): Observable<Repository[]> | undefined {
    if (!userRepositories) {
      return;
    }

    const pageInfo = userRepositories.user.repositories.pageInfo;

    this.repositoryListEndCursor = pageInfo.endCursor;
    this.repositoryListHasNextPage = pageInfo.hasNextPage;

    this.repositories = userRepositories.user.repositories.edges;

    this.totalCount = userRepositories.user.repositories.totalCount;
    this.currentCount = this.repositories.length;

    const repositoryList: Repository[] = [];
    this.repositories.forEach((repository: any) => repositoryList.push({ name: repository.node.name }));

    return of(repositoryList);
  }

  get userRepositoriesHasNextPage(): boolean {
    return this.repositoryListHasNextPage;
  }

  get repositoriesCount(): number {
    return this.totalCount;
  }

  get fetchedCount(): number {
    return this.currentCount;
  }

  get numberOfResult(): number {
    return NUMBER_OF_RESULT;
  }
}
