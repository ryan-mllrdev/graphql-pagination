import { PageInfo } from './PageInfo';

export type UserResult = {
  search: {
    __typename: string;
    userCount: number;
    edges: any[];
    pageInfo: PageInfo;
  };
};
