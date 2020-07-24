import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { UserService } from '../service/user.service';
import { Observable, Subscription } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { User } from '../types/User';
import { IonInfiniteScroll } from '@ionic/angular';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements AfterViewInit, OnInit {
  private valuesUpdated = false;
  @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;
  users!: Observable<User[]> | undefined;
  searchInput!: FormControl;
  searchText = '';
  totalCount = 0;
  currentCount = 0;
  loadingStatus = '';
  filter!: FormControl;
  searchHistory: string[] = [];
  searchHistoryDropdown!: FormControl;
  selectedSearchHistory = '';
  disableApplyButton = false;

  constructor(private userService: UserService) {}

  ngAfterViewInit() {
    this.disableInfiniteScroll(true);
  }

  ngOnInit() {
    this.searchInput = new FormControl();
    this.filter = new FormControl('', { validators: Validators.required });
    this.searchHistoryDropdown = new FormControl();

    this.searchHistoryDropdown.valueChanges.subscribe((value) => {
      this.filter.setValue(value);
    });

    this.searchInput.valueChanges.subscribe((value) => {
      this.searchText = value;
    });
  }

  async loadUsers(event: any) {
    this.disableApplyButton = true;
    this.valuesUpdated = false;
    // Show loading status
    this.showFetchStatus();

    // Load more if has next pages
    if (this.userService.usersHasNextPage) {
      await this.loadMoreUserConnections(this.filter.value);
    } else {
      this.disableInfiniteScroll(true);
    }
  }

  async applyFilter() {
    const keyword = this.filter.value;
    if (!keyword) {
      return;
    }
    this.disableApplyButton = true;
    this.valuesUpdated = false;
    await this.initialize(keyword);
    this.disableInfiniteScroll(false);
    // Look for keywords from history list
    const existingKeyword = this.searchHistory.find((word) => word === keyword);
    if (!existingKeyword) {
      this.searchHistory.push(keyword);
    }
    // Auto select this keyword from the dropdown list
    this.selectedSearchHistory = keyword;
  }

  selectedSearchHistoryValueChanged() {
    this.applyFilter();
  }

  // PRIVATE FUNCTIONS
  private async loadMoreUserConnections(keyword: string) {
    const userConnections = await this.userService.fetchUsers(keyword, true);
    if (userConnections) {
      this.updateValues(userConnections);
    }
  }

  private async initialize(keyword: string) {
    // Check if in cache
    const cachedUserConnections = await this.userService.fetchUsers(keyword);
    // Listen to value changes
    this.initializeQuery();
    // Load values from cache
    if (cachedUserConnections) {
      this.updateValues(cachedUserConnections);
    }
  }

  private initializeQuery() {
    this.userService.usersConnectionWatchedQuery.valueChanges.subscribe((userConnections) => {
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
    this.users = this.userService.getUsers(usersData);
    this.totalCount = this.userService.usersCount;
    this.currentCount = this.userService.fetchedCount;
    this.infiniteScroll.complete();
    this.disableApplyButton = false;
  }

  private showFetchStatus() {
    const remainingCount: number = this.totalCount - this.currentCount;
    const fetchCount = remainingCount < this.userService.numberOfResult ? remainingCount : this.userService.numberOfResult;
    this.loadingStatus = `Loading ${fetchCount} of ${remainingCount}...`;
  }
  // END: PRIVATE FUNCTIONS
}
