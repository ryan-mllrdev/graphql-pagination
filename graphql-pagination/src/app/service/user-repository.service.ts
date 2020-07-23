import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { QueryService } from './queries.service';
import { of, Observable } from 'rxjs';
import { RepositoryResult } from '../types/RepositoryResult';
import { Repository } from '../types/Repository';
import ApolloClient from 'apollo-client';

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
  private queryVariables: any = {};

  private apolloClient!: ApolloClient<any>;

  userRepositoriesWatchedQuery!: QueryRef<any>;

  constructor(private apollo: Apollo, private queryService: QueryService) {
    this.apolloClient = apollo.getClient();
  }

  async fetchUserRepositories(loginName: string, fetchMore: boolean = false, numberOfResult: number = NUMBER_OF_RESULT) {
    if (!loginName) {
      return;
    }

    try {
      // Update query variables
      this.setQueryVariables(loginName);

      // Read data from cache if available
      const cachedRepositories = this.readFromCached();

      // If cached result hasn't completed, throw an error to redirect to fetching more results
      if (cachedRepositories.user.repositories.pageInfo.hasNextPage) {
        fetchMore = true;
        throw new Error();
      }

      // return all results
      return cachedRepositories;
    } catch (error) {
      // Fetch more results
      if (fetchMore) {
        await this.fetchMoreUserRepositories();
      } else {
        // Initial request
        this.setInitialQuery();
      }
    }
  }

  getCurrentUserRepositories(fetchResult: any): Observable<Repository[]> | undefined {
    if (!fetchResult) {
      return;
    }

    // user.repositories
    // user.repositories.pageInfo
    const userRepositories = fetchResult.user.repositories;
    const pageInfo = userRepositories.pageInfo;

    // pageInfo.endCursor
    // pageInfo.hasNextPage
    this.repositoryListEndCursor = pageInfo.endCursor;
    this.repositoryListHasNextPage = pageInfo.hasNextPage;

    // user.repositories.edges
    const repositoryEdges = userRepositories.edges;

    // user.repositories.totalCount
    this.totalCount = userRepositories.totalCount;

    this.currentCount = repositoryEdges.length;

    // Load results to an array of Repository type
    const repositoryList: Repository[] = this.fetchResultsAsUserRepositories(repositoryEdges);

    // Return as an observable
    return of(repositoryList);
  }

  // GETTERS
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
  // END: GETTERS

  // PRIVATE FUNCTIONS
  private async fetchMoreUserRepositories() {
    const queryVariables = {
      ...this.queryVariables,
      after: this.repositoryListEndCursor,
    };

    await this.userRepositoriesWatchedQuery.fetchMore({
      variables: queryVariables,
      updateQuery: (previousResult, { fetchMoreResult }) => {
        // user.repositories
        const previousUserRepositories = previousResult.user.repositories;
        const currentUserRepositories = fetchMoreResult.user.repositories;

        // user.repositories.edges
        const previousUserRepositoriesEdges = previousUserRepositories.edges;
        const currentUserRepositoriesEdges = currentUserRepositories.edges;

        // user.repositories.__typename
        // user.repositories.totalCount
        const currentTypeName = currentUserRepositories.__typename;
        const currentTotalCount = currentUserRepositories.totalCount;

        // user.repositories.pageInfo
        const currentPageInfo = currentUserRepositories.pageInfo;

        // pageInfo.endCursor
        // pageInfo.hasNextPage
        this.repositoryListEndCursor = currentPageInfo.endCursor;
        this.repositoryListHasNextPage = currentPageInfo.hasNextPage;

        this.currentCount += currentUserRepositoriesEdges.length;

        // Merged previous and current results
        const currentMergedEdges = [...currentUserRepositoriesEdges, ...previousUserRepositoriesEdges];

        // Update query with this new values
        const newResults: RepositoryResult = {
          user: {
            __typename: currentTypeName,
            repositories: {
              __typename: currentTypeName,
              totalCount: currentTotalCount,
              edges: currentMergedEdges,
              pageInfo: currentPageInfo,
            },
          },
        };
        return newResults;
      },
    });
  }

  private setInitialQuery() {
    this.userRepositoriesWatchedQuery = this.apollo.watchQuery<any>({
      query: this.queryService.userRepositoriesQuery,
      variables: this.queryVariables,
      fetchPolicy: FETCH_POLICY,
    });
  }

  private readFromCached(): any {
    const cachedRepositories = this.apolloClient.readQuery({
      query: this.queryService.userRepositoriesQuery,
      variables: this.queryVariables,
    });
    return cachedRepositories;
  }

  private setQueryVariables(loginName: string) {
    this.queryVariables = {
      login: loginName,
      first: NUMBER_OF_RESULT,
    };
  }

  private fetchResultsAsUserRepositories(fetchResults: any): Repository[] {
    const repositoryList: Repository[] = [];
    fetchResults.forEach((repository: any) => repositoryList.push({ name: repository.node.name }));
    return repositoryList;
  }
  // END: PRIVATE FUNCTIONS
}
