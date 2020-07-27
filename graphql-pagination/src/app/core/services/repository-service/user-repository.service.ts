import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { QueryService } from '../query-service/queries.service';
import { of, Observable } from 'rxjs';
import { RepositoryFetchResult } from '../../types/RepositoryFetchResult';
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
  private numberOfResult = 0;

  private apolloClient!: ApolloClient<any>;

  repositoryConnectionQuery!: QueryRef<any>;

  constructor(private apollo: Apollo, private queryService: QueryService) {
    this.apolloClient = apollo.getClient();
  }

  async fetchUserRepositories(
    loginName: string,
    fetchMore: boolean = false,
    numberOfResult: number = NUMBER_OF_RESULT,
  ): Promise<RepositoryFetchResult | null | undefined> {
    if (!loginName) {
      return;
    }

    this.numberOfResult = numberOfResult;

    const queryVariables = {
      first: numberOfResult,
      login: loginName,
    };

    try {
      if (fetchMore) {
        // Fetching more repositories
        return await this.fetchMoreUserRepositories();
      } else {
        // Try to read from cache
        const repositoryConnectionCache = this.readQuery(queryVariables);

        if (repositoryConnectionCache) {
          // Update query variables
          this.updateQueryVariables(queryVariables);
          return repositoryConnectionCache;
        } else {
          // Initial request
          this.reset();
          this.initializeQuery(queryVariables);
        }
      }
    } catch (error) {
      console.log(error);
    }

    return undefined;
  }

  populateRepositories(repositoryConnection: RepositoryFetchResult): Observable<Repository[]> | undefined {
    if (!repositoryConnection) {
      return;
    }

    // user.repositories
    // user.repositories.pageInfo
    const pageInfo = repositoryConnection.user.repositories.pageInfo;

    // pageInfo.endCursor
    // pageInfo.hasNextPage
    this.repositoryConnectionCursor = pageInfo.endCursor ?? '';
    this.connectionHasNextPage = pageInfo.hasNextPage;

    // user.repositories.nodes
    const repositoryConnectionNodes = repositoryConnection.user.repositories.nodes;

    // user.repositories.totalCount
    this.totalCount = repositoryConnection.user.repositories.totalCount;

    this.currentCount = repositoryConnectionNodes?.length ?? 0;

    // // Load results to an array of Repository type
    const repositoryList: Repository[] = [];
    repositoryConnection.user.repositories.nodes?.forEach((repository) => {
      repositoryList.push({
        name: repository?.name ?? '',
        url: repository?.url ?? '',
      });
    });

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

  get numberOfResultToFetch(): number {
    return this.numberOfResult;
  }
  // END: GETTERS

  // PRIVATE FUNCTIONS
  private async fetchMoreUserRepositories(): Promise<RepositoryFetchResult | undefined> {
    try {
      const queryVariables = {
        after: this.repositoryConnectionCursor,
      };
      let repositories: RepositoryFetchResult;
      await this.repositoryConnectionQuery
        .fetchMore({
          variables: queryVariables,
          updateQuery: (previousResult, { fetchMoreResult }) => {
            // user.nodes
            const previousRepositoryNodes = previousResult.user.repositories.nodes;
            const currentRepositoryNodes = fetchMoreResult.user.repositories.nodes;

            // Merged previous and current results
            const mergedUserNodes = [...previousRepositoryNodes, ...currentRepositoryNodes];
            const newSearchResult: RepositoryFetchResult = {
              ...fetchMoreResult,
            };

            newSearchResult.user.repositories.nodes = mergedUserNodes;

            return (repositories = newSearchResult);
          },
        })
        .finally(() => {
          return repositories;
        });
    } catch (error) {
      console.log(error);
    }
    return undefined;
  }

  private readQuery(queryVariables: {}): RepositoryFetchResult | null {
    try {
      const repositoryConnectionCache = this.apolloClient.readQuery<RepositoryFetchResult>({
        query: this.queryService.repositoriesQuery,
        variables: queryVariables,
      });
      return repositoryConnectionCache;
    } catch (error) {
      return null;
    }
  }

  private updateQueryVariables(queryVariables: {}) {
    this.repositoryConnectionQuery.setOptions({
      query: this.queryService.repositoriesQuery,
      variables: queryVariables,
    });
  }

  private initializeQuery(queryVariables: {}) {
    this.repositoryConnectionQuery = this.apollo.watchQuery<RepositoryFetchResult>({
      query: this.queryService.repositoriesQuery,
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
  // END: PRIVATE FUNCTIONS
}
