import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { QueryService } from './queries.service';
import { of, Observable } from 'rxjs';
import { RepositoryResult } from '../types/RepositoryResult';
import { Repository } from '../types/Repository';
import ApolloClient from 'apollo-client';

const NUMBER_OF_RESULT = 10;
const FETCH_POLICY = 'cache-first';

@Injectable({
  providedIn: 'root',
})
export class UserRepositoryService {
  private repositoryConnectionCursor = '';
  private repositoryConnectionHasNextPage = false;
  private totalCount = 0;
  private currentCount = 0;
  private queryVariables: any = {};
  private userRepositoriesConnectionCache: any;

  private apolloClient!: ApolloClient<any>;

  userRepositoriesConnectionWatchedQuery!: QueryRef<any>;

  constructor(private apollo: Apollo, private queryService: QueryService) {
    this.apolloClient = apollo.getClient();
  }

  async fetchUserRepositoriesConnection(loginName: string, fetchMore: boolean = false, numberOfResult: number = NUMBER_OF_RESULT) {
    if (!loginName) {
      return;
    }

    if (fetchMore) {
      return await this.fetchMoreUserRepositoriesConnection();
    } else {
      try {
        this.userRepositoriesConnectionWatchedQuery.setOptions({
          query: this.queryService.userRepositoriesQuery,
          variables: {
            first: numberOfResult,
            login: loginName,
          },
        });

        // Try to read from cache
        this.userRepositoriesConnectionCache = this.apolloClient.readQuery({
          query: this.queryService.userRepositoriesQuery,
          variables: {
            first: numberOfResult,
            login: loginName,
          },
        });

        return this.userRepositoriesConnectionCache;
      } catch (error) {
        this.reset();
        this.initializeQuery({
          first: numberOfResult,
          login: loginName,
        });
      }
    }
  }

  private initializeQuery(queryVariables: any) {
    this.userRepositoriesConnectionWatchedQuery = this.apollo.watchQuery<any>({
      query: this.queryService.userRepositoriesQuery,
      variables: queryVariables,
      fetchPolicy: FETCH_POLICY,
    });
  }

  private reset() {
    this.repositoryConnectionCursor = '';
    this.repositoryConnectionHasNextPage = true;
    this.totalCount = 0;
    this.currentCount = 0;
  }

  getUserRepositoriesConnection(fetchResult: any): Observable<Repository[]> | undefined {
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
    this.repositoryConnectionHasNextPage = pageInfo.hasNextPage;

    // user.repositories.edges
    const repositoryConnectionEdges = userRepositoriesConnection.edges;

    // user.repositories.totalCount
    this.totalCount = userRepositoriesConnection.totalCount;

    this.currentCount = repositoryConnectionEdges.length;

    // Load results to an array of Repository type
    const repositoryList: Repository[] = this.fetchResultsAsUserRepositories(repositoryConnectionEdges);

    // Return as an observable
    return of(repositoryList);
  }

  // GETTERS
  get userRepositoriesHasNextPage(): boolean {
    return this.repositoryConnectionHasNextPage;
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
  private async fetchMoreUserRepositoriesConnection() {
    try {
      const queryVariables = {
        after: this.repositoryConnectionCursor,
      };

      let newResults!: RepositoryResult;
      await this.userRepositoriesConnectionWatchedQuery.fetchMore({
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

          // Merged previous and current results
          const currentMergedEdges = [...currentUserRepositoriesEdges, ...previousUserRepositoriesEdges];

          this.currentCount = currentMergedEdges.length;

          // Update query with this new values
          newResults = {
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
      return newResults;
    } catch (error) {
      console.log(error);
    }
    return null;
  }

  private fetchResultsAsUserRepositories(fetchResults: any): Repository[] {
    const repositoryList: Repository[] = [];
    fetchResults.forEach((repository: any) => repositoryList.push({ name: repository.node.name }));
    return repositoryList;
  }
  // END: PRIVATE FUNCTIONS
}
