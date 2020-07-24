import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { QueryService } from '../query-service/queries.service';
import { of, Observable } from 'rxjs';
import { RepositoryResult } from '../../types/RepositoryResult';
import { Repository } from '../../types/Repository';
import ApolloClient from 'apollo-client';

const NUMBER_OF_RESULT = 10;
const FETCH_POLICY = 'cache-first';

@Injectable({
  providedIn: 'root',
})
export class UserRepositoryService {
  private repositoryConnectionCursor = '';
  private connectionHasNextPage = false;
  private totalCount = 0;
  private currentCount = 0;
  private cacheData: any;

  private apolloClient!: ApolloClient<any>;

  userRepositoriesConnectionQuery!: QueryRef<any>;

  constructor(private apollo: Apollo, private queryService: QueryService) {
    this.apolloClient = apollo.getClient();
  }

  async fetchUserRepositoriesConnection(loginName: string, fetchMore: boolean = false, numberOfResult: number = NUMBER_OF_RESULT) {
    if (!loginName) {
      return;
    }

    const queryVariables = {
      first: numberOfResult,
      login: loginName,
    };

    if (fetchMore) {
      // Fetch more repositories
      return await this.fetchMoreUserRepositories();
    } else {
      // Read from cached data
      try {
        // Try to read from cache
        this.cacheData = this.apolloClient.readQuery({
          query: this.queryService.userRepositoriesQuery,
          variables: {
            first: numberOfResult,
            login: loginName,
          },
        });

        this.updateQueryVariables(queryVariables);

        return this.cacheData;
      } catch (error) {
        // Initial request
        this.reset();
        this.initializeQuery(queryVariables);
      }
    }
  }

  getUserRepositories(fetchResult: any): Observable<Repository[]> | undefined {
    if (!fetchResult) {
      return;
    }

    // user.repositories
    // user.repositories.pageInfo
    const userRepositoriesConnection = fetchResult.user.repositories;
    const pageInfo = userRepositoriesConnection.pageInfo;

    // pageInfo.endCursor
    // pageInfo.hasNextPage
    this.repositoryConnectionCursor = pageInfo.endCursor;
    this.connectionHasNextPage = pageInfo.hasNextPage;

    // user.repositories.nodes
    const repositoryConnectionNodes = userRepositoriesConnection.nodes;

    // user.repositories.totalCount
    this.totalCount = userRepositoriesConnection.totalCount;

    this.currentCount = repositoryConnectionNodes.length;

    // Load results to an array of Repository type
    const repositoryList: Repository[] = this.mapUserRepositories(repositoryConnectionNodes);

    // Return as an observable
    return of(repositoryList);
  }

  // GETTERS
  get userRepositoriesHasNextPage(): boolean {
    return this.connectionHasNextPage;
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
    try {
      const queryVariables = {
        after: this.repositoryConnectionCursor,
      };

      let newResults!: RepositoryResult;
      await this.userRepositoriesConnectionQuery.fetchMore({
        variables: queryVariables,
        updateQuery: (previousResult, { fetchMoreResult }) => {
          // user.repositories
          const previousUserRepositories = previousResult.user.repositories;
          const currentUserRepositories = fetchMoreResult.user.repositories;

          // user.repositories.nodes
          const previousUserRepositoriesNodes = previousUserRepositories.nodes;
          const currentUserRepositoriesNodes = currentUserRepositories.nodes;

          // user.repositories.__typename
          // user.repositories.totalCount
          const currentTypeName = currentUserRepositories.__typename;
          const currentTotalCount = currentUserRepositories.totalCount;

          // user.repositories.pageInfo
          const currentPageInfo = currentUserRepositories.pageInfo;

          // Merged previous and current results
          const currentMergedNodes = [...currentUserRepositoriesNodes, ...previousUserRepositoriesNodes];

          this.currentCount = currentMergedNodes.length;

          // Update query with this new values
          newResults = {
            user: {
              __typename: currentTypeName,
              repositories: {
                __typename: currentTypeName,
                totalCount: currentTotalCount,
                nodes: currentMergedNodes,
                pageInfo: currentPageInfo,
              },
            },
          };
          return newResults;
        },
      });
      return newResults;
    } catch (error) {
      console.log(error);
    }
    return null;
  }

  private updateQueryVariables(queryVariables: {}) {
    this.userRepositoriesConnectionQuery.setOptions({
      query: this.queryService.userRepositoriesQuery,
      variables: queryVariables,
    });
  }

  private initializeQuery(queryVariables: any) {
    this.userRepositoriesConnectionQuery = this.apollo.watchQuery<any>({
      query: this.queryService.userRepositoriesQuery,
      variables: queryVariables,
      fetchPolicy: FETCH_POLICY,
    });
  }

  private reset() {
    this.repositoryConnectionCursor = '';
    this.connectionHasNextPage = true;
    this.totalCount = 0;
    this.currentCount = 0;
  }

  private mapUserRepositories(fetchResults: any): Repository[] {
    const repositoryList: Repository[] = fetchResults.map((repository: any) => {
      return {
        name: repository.name,
        url: repository.url,
      };
    });
    return repositoryList;
  }
  // END: PRIVATE FUNCTIONS
}
