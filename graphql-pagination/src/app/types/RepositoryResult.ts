import { PageInfo } from './PageInfo';

export type RepositoryResult = {
  user: {
    __typename: string;
    repositories: {
      __typename: string;
      totalCount: number;
      edges: any[];
      pageInfo: PageInfo;
    };
  };
};
