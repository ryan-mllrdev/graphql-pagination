import { Component, OnInit } from '@angular/core';
import gql from 'graphql-tag';
import { Apollo, QueryRef } from 'apollo-angular';
import { SearchType } from '../enums/search-type';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const searchType = SearchType.USER;
const usersQuery = gql`
  query($searchText: String!, $first: Int!) {
    search(query: $searchText, type: USER, first: $first) {
      nodes {
        ... on User {
          id
          email
          login
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  usersQuery!: QueryRef<any>;

  data!: Observable<any>;

  constructor(private apollo: Apollo) {}

  ngOnInit() {
    this.data = this.apollo
      .watchQuery<any>({
        query: usersQuery,
        variables: {
          searchText: 'mllrdev',
          first: 10,
        },
        fetchPolicy: 'cache-and-network',
      })
      .valueChanges.pipe(
        map(({ data }) => {
          if (data) {
            console.log(data);
            const [, ...users] = [data.search.nodes][0];
            return users;
          }
        }),
      );
  }
}
