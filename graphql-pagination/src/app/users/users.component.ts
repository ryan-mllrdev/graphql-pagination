import { Component, OnInit } from '@angular/core';
import { UserService } from '../service/user.service';
import { of, Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { User } from '../types/User';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  users!: Observable<User[]> | undefined;
  searchInput!: FormControl;
  searchText = '';
  totalCount = 0;
  currentCount = 0;
  event!: any;
  loadingStatus = '';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadInitialUsers();
    this.searchInput = new FormControl();
    this.searchInput.valueChanges.subscribe((value) => {
      this.searchText = value;
    });
  }

  loadUsers(event: any) {
    const remainingCount: number = this.totalCount - this.currentCount;
    const fetchCount = remainingCount < this.userService.numberOfResult ? remainingCount : this.userService.numberOfResult;
    this.loadingStatus = `Loading ${fetchCount} of ${remainingCount}...`;

    this.event = event;
    if (this.userService.usersHasNextPage) {
      this.loadMoreUsers();
    } else {
      event.target.disabled = true;
    }
  }

  private async loadMoreUsers() {
    await this.userService.fetchUsers(true);
  }

  private async loadInitialUsers() {
    await this.userService.fetchUsers();
    this.userService.usersQuery.valueChanges.subscribe((usersData: any) => {
      if (!usersData.data || usersData.loading) {
        return;
      }

      this.users = this.userService.getUserResults(usersData.data);
      this.totalCount = this.userService.usersCount;
      this.currentCount = this.userService.fetchedCount;

      if (this.event) {
        this.event.target.complete();
      }
    });
  }
}
