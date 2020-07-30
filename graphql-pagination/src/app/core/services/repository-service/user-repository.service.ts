import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from '../../types/Repository';
import ApolloClient from 'apollo-client';
import { GITHUB_USER_REPOSITORIES_QUERY } from '../../../graphql-queries';
import { RepositoryConnection } from 'src/generated/graphql';
import { RepositoryFetchResult } from '../../types/RepositoryFetchResult';
import { RepositoryQueryVariables } from '../../types/RepositoryQueryVariables';

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

  fetchRepositories(queryVariables: RepositoryQueryVariables): Observable<RepositoryFetchResult> {
    this.userRepositoriesQuery = this.apollo.watchQuery<RepositoryFetchResult>({
      query: GITHUB_USER_REPOSITORIES_QUERY,
      variables: queryVariables,
      fetchPolicy: FETCH_POLICY,
    });

    const result = this.userRepositoriesQuery.valueChanges.pipe(
      map((fetchResult: any) => {
        const repositoryFetchResult: RepositoryFetchResult = {
          user: fetchResult.data.user,
        };
        return repositoryFetchResult;
      }),
    );

    return result;
  }

  fetchMoreRepositories(numberOfResult: number): Observable<RepositoryFetchResult> {
    let repositoryFetchResult!: RepositoryFetchResult;
    try {
      const queryVariables = {
        first: numberOfResult,
        after: this.resultCursor,
      };
      this.userRepositoriesQuery
        .fetchMore({
          variables: queryVariables,
          updateQuery: (previousResult, { fetchMoreResult }) => {
            if (!fetchMoreResult) {
              return (repositoryFetchResult = previousResult);
            }

            const previousRepositoryNodes = previousResult.user.repositories.nodes;
            const currentRepositoryNodes = fetchMoreResult.user.repositories.nodes;

            // Merged previous and current results
            const mergedUserNodes = [...(previousRepositoryNodes ?? []), ...(currentRepositoryNodes ?? [])];
            fetchMoreResult.user.repositories.nodes = mergedUserNodes;

            return (repositoryFetchResult = fetchMoreResult);
          },
        })
        .finally(() => {
          return repositoryFetchResult;
        });
    } catch (error) {
      console.log(error);
    }
    return of(repositoryFetchResult);
  }

  readRepositoriesFromCache(queryVariables: RepositoryQueryVariables): RepositoryFetchResult | null {
    let repositoryCache!: RepositoryFetchResult | null;
    try {
      // Try to read from cache
      const cache = this.readQuery(queryVariables);

      if (cache) {
        repositoryCache = cache;
        // Update query variables
        this.updateQueryVariables(queryVariables);
        return repositoryCache;
      }
    } catch (error) {
      console.log(error);
    }

    return repositoryCache;
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

  private readQuery(queryVariables: RepositoryQueryVariables): RepositoryFetchResult | null {
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

  private updateQueryVariables(queryVariables: RepositoryQueryVariables) {
    this.userRepositoriesQuery.setVariables(queryVariables);
  }
  // END: PRIVATE FUNCTIONS
}
