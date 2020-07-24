import { PageInfo } from './PageInfo';

export type UserResult = {
  search: {
    __typename: string;
    userCount: number;
    nodes: any[];
    pageInfo: PageInfo;
  };
};
