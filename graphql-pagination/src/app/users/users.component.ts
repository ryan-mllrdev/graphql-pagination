import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { UserService } from '../service/user.service';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { User } from '../types/User';
import { IonInfiniteScroll } from '@ionic/angular';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements AfterViewInit, OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;
  users!: Observable<User[]> | undefined;
  searchInput!: FormControl;
  searchText = '';
  totalCount = 0;
  currentCount = 0;
  loadingStatus = '';
  filter!: FormControl;
  subscribed = false;
  searchHistory: string[] = [];
  selectedSearchHistory!: FormControl;
  usersWatchQuerySubscription!: Subscription;
  valuesUpdated = false;

  constructor(private userService: UserService) {}

  ngAfterViewInit() {
    this.disableInfiniteScroll(true);
  }

  ngOnInit() {
    this.searchInput = new FormControl();
    this.filter = new FormControl();
    this.selectedSearchHistory = new FormControl();

    this.selectedSearchHistory.valueChanges.subscribe((value) => {
      this.filter.setValue(value);
    });

    this.searchInput.valueChanges.subscribe((value) => {
      this.searchText = value;
    });
  }

  async loadUsers(event: any) {
    this.valuesUpdated = false;
    this.showFetchStatus();

    if (this.userService.usersHasNextPage) {
      await this.loadMoreUsers(this.filter.value);
    } else {
      this.disableInfiniteScroll(true);
    }
  }

  async applyFilter() {
    const keyword = this.filter.value;
    if (!keyword) {
      return;
    }
    this.valuesUpdated = false;
    await this.initialize(keyword);
    this.disableInfiniteScroll(false);
    const existingKeyword = this.searchHistory.find((word) => word === keyword);
    if (!existingKeyword) {
      this.searchHistory.push(keyword);
    }
  }

  private async loadMoreUsers(keyword: string) {
    const values = await this.userService.fetchUsers(keyword, true);
    if (values) {
      this.updateValues(values);
    }
  }

  private async initialize(keyword: string) {
    const cachedUserConnections = await this.userService.fetchUsers(keyword);
    this.unsubscribeFromQuery();
    this.subscribeToQuery();
    if (cachedUserConnections) {
      this.updateValues(cachedUserConnections);
    }
  }

  private unsubscribeFromQuery() {
    if (this.usersWatchQuerySubscription) {
      this.usersWatchQuerySubscription.unsubscribe();
    }
  }

  private subscribeToQuery() {
    this.userService.usersWatchQuery.valueChanges.subscribe((userConnections) => {
      if (!userConnections || userConnections.loading) {
        return;
      }
      if (!this.valuesUpdated) {
        this.updateValues(userConnections.data);
      }
    });
  }

  private disableInfiniteScroll(disabled: boolean) {
    this.infiniteScroll.disabled = disabled;
  }

  private updateValues(usersData: any) {
    this.valuesUpdated = true;
    this.users = this.userService.getUserResults(usersData);
    this.totalCount = this.userService.usersCount;
    this.currentCount = this.userService.fetchedCount;
    this.infiniteScroll.complete();
  }

  private showFetchStatus() {
    const remainingCount: number = this.totalCount - this.currentCount;
    const fetchCount = remainingCount < this.userService.numberOfResult ? remainingCount : this.userService.numberOfResult;
    this.loadingStatus = `Loading ${fetchCount} of ${remainingCount}...`;
  }
}
