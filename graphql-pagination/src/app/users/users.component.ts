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
  filter!: FormControl;
  subscribed = false;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.searchInput = new FormControl();
    this.filter = new FormControl('location:dumaguete');
    this.searchInput.valueChanges.subscribe((value) => {
      this.searchText = value;
    });
  }

  async loadUsers(event: any) {
    this.event = event;

    this.showFetchStatus();

    if (this.userService.usersHasNextPage) {
      await this.loadMoreUsers(this.filter.value);
    } else {
      event.target.disabled = true;
    }
  }

  async applyFilter() {
    if (this.event) {
      this.event.target.disabled = false;
    }
    const keyword = this.filter.value;
    await this.loadInitialUsers(keyword);
  }

  private async loadMoreUsers(keyword: string) {
    await this.userService.fetchUsers(keyword, true);
  }

  private async loadInitialUsers(keyword: string) {
    await this.userService.fetchUsers(keyword);

    this.userService.usersWatchQuery.valueChanges.subscribe((usersData: any) => {
      this.subscribed = true;

      if (!this.userService.usersHasNextPage) {
        this.event.target.disabled = true;
        this.updateValues();
        return;
      }

      if (!usersData.data || usersData.loading) {
        return;
      }

      this.users = this.userService.getUserResults(usersData.data);
      this.updateValues();
    });
  }

  private updateValues() {
    this.totalCount = this.userService.usersCount;
    this.currentCount = this.userService.fetchedCount;

    if (this.event) {
      this.event.target.complete();
    }
  }

  private showFetchStatus() {
    const remainingCount: number = this.totalCount - this.currentCount;
    const fetchCount = remainingCount < this.userService.numberOfResult ? remainingCount : this.userService.numberOfResult;
    this.loadingStatus = `Loading ${fetchCount} of ${remainingCount}...`;
  }
}
