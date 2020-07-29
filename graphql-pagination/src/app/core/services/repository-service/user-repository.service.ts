import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { of, Observable } from 'rxjs';
import { Repository } from '../../types/Repository';
import ApolloClient from 'apollo-client';
import { GITHUB_USER_REPOSITORIES_QUERY } from '../../../graphql-queries';
import { RepositoryConnection } from 'src/generated/graphql';
import { RepositoryFetchResult } from '../../types/RepositoryFetchResult';

const NUMBER_OF_RESULT = 10;
const FETCH_POLICY = 'cache-first';

@Injectable({
  providedIn: 'root',
})
export class UserRepositoryService {
  private resultCursor = '';
  private resultHasNextPage = false;
  private totalCount = 0;
  private currentCount = 0;
  private apolloClient!: ApolloClient<RepositoryFetchResult>;

  userRepositoriesQuery!: QueryRef<RepositoryFetchResult>;

  constructor(private apollo: Apollo) {
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

  populateRepositories(repositoryConnection: RepositoryConnection): Observable<Repository[]> | undefined {
    if (!repositoryConnection) {
      return;
    }

    // user.repositories
    // user.repositories.pageInfo
    const pageInfo = repositoryConnection.pageInfo;

    // pageInfo.endCursor
    // pageInfo.hasNextPage
    this.resultCursor = pageInfo.endCursor ?? '';
    this.resultHasNextPage = pageInfo.hasNextPage;

    // user.repositories.nodes
    const repositoryConnectionNodes = repositoryConnection.nodes;

    // user.repositories.totalCount
    this.totalCount = repositoryConnection.totalCount;

    this.currentCount = repositoryConnectionNodes?.length ?? 0;

    // // Load results to an array of Repository type
    const repositoryList: Repository[] = [];
    repositoryConnection.nodes?.forEach((repository: any) => {
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
    return this.resultHasNextPage;
  }

  get repositoriesCount(): number {
    return this.totalCount;
  }

  get fetchedCount(): number {
    return this.currentCount;
  }
  // END: GETTERS

  // PRIVATE FUNCTIONS
  private async fetchMoreUserRepositories(): Promise<RepositoryFetchResult> {
    let repositories!: RepositoryFetchResult;
    try {
      const queryVariables = {
        after: this.resultCursor,
      };
      await this.userRepositoriesQuery
        .fetchMore({
          variables: queryVariables,
          updateQuery: (previousResult, { fetchMoreResult }) => {
            if (!fetchMoreResult) {
              return (repositories = previousResult);
            }

            const previousRepositoryNodes = previousResult.user.repositories.nodes;
            const currentRepositoryNodes = fetchMoreResult.user.repositories.nodes;

            // Merged previous and current results
            const mergedUserNodes = [...(previousRepositoryNodes ?? []), ...(currentRepositoryNodes ?? [])];
            fetchMoreResult.user.repositories.nodes = mergedUserNodes;

            return (repositories = fetchMoreResult);
          },
        })
        .finally(() => {
          return repositories;
        });
    } catch (error) {
      console.log(error);
    }
    return repositories;
  }

  private readQuery(queryVariables: {}): RepositoryFetchResult | null {
    try {
      const repositoryConnectionCache = this.apolloClient.readQuery<RepositoryFetchResult>({
        query: GITHUB_USER_REPOSITORIES_QUERY,
        variables: queryVariables,
      });
      return repositoryConnectionCache;
    } catch (error) {
      return null;
    }
  }

  private updateQueryVariables(queryVariables: {}) {
    this.userRepositoriesQuery.setVariables(queryVariables);
  }

  private initializeQuery(queryVariables: {}) {
    this.userRepositoriesQuery = this.apollo.watchQuery<RepositoryFetchResult>({
      query: GITHUB_USER_REPOSITORIES_QUERY,
      variables: queryVariables,
      fetchPolicy: FETCH_POLICY,
    });
  }

  private reset() {
    this.resultCursor = '';
    this.resultHasNextPage = true;
    this.totalCount = 0;
    this.currentCount = 0;
  }
  // END: PRIVATE FUNCTIONS
}
