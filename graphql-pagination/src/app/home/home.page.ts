import { Component, OnInit } from '@angular/core';
import gql from 'graphql-tag';
import { Apollo, QueryRef } from 'apollo-angular';
import { SearchType } from '../enums/search-type';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const usersQuery = gql`
  query($search: String!, $type: SearchType!, $first: Int!) {
    search(query: $search, type: $type, first: $first) {
      edges {
        node {
          ... on User {
            id
            email
            login
            name
          }
        }
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

  constructor(private apollo: Apollo) {
    this.data = this.apollo
      .watchQuery<any>({
        query: usersQuery,
        variables: {
          search: 'mllrdev',
          type: SearchType.USER,
          first: 10,
        },
        fetchPolicy: 'cache-and-network',
      })
      .valueChanges.pipe(
        map(({ data }) => {
          console.log(data);
          return data;
        }),
      );
  }

  ngOnInit() {}
}
