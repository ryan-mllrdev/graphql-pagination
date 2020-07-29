import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { UserService } from '../core/services/user-service/user.service';
import { Observable } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { IonInfiniteScroll } from '@ionic/angular';
import { User } from '../core/types/User';
import { UserFetchResult } from '../core/types/UserFetchResult';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements AfterViewInit, OnInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;
  private valuesUpdated = false;

  users!: Observable<User[]> | undefined;
  searchText = '';
  loadingStatus = '';
  numberOfResultValue = 10;
  searchHistory: string[] = [];
  fetchingData = false;
  selectedSearchValue!: string;
  numberOfResultOptions: number[] = [10, 20, 50, 100];
  totalCount = 0;
  currentCount = 0;

  searchInput!: FormControl;
  filter!: FormControl;
  searchHistoryDropdown!: FormControl;
  numberOfResultDropdown!: FormControl;

  constructor(private userService: UserService) {}

  ngAfterViewInit() {
    this.disableInfiniteScroll(true);
  }

  ngOnInit() {
    this.initialize();
  }

  async loadUsers(event: any) {
    this.fetchingData = true;
    this.valuesUpdated = false;
    // Show loading status
    this.showFetchStatus();

    // Load more if has next pages
    if (this.userService.hasNextPage) {
      await this.loadMoreUsers(this.filter.value);
    } else {
      this.disableInfiniteScroll(true);
      this.fetchingData = false;
    }
  }

  async applyFilter() {
    const keyword = this.filter.value;
    if (!keyword) {
      return;
    }
    this.fetchingData = true;
    this.valuesUpdated = false;
    await this.initializeSearch(keyword);
    this.disableInfiniteScroll(false);
    // Look for keywords from history list
    const existingKeyword = this.searchHistory.find((word) => word === keyword);
    if (!existingKeyword) {
      this.searchHistory.push(keyword);
    }

    this.selectedSearchValue = keyword;
  }

  searchHistoryValueChanged() {
    this.filter.setValue(this.searchHistoryDropdown.value);
    this.applyFilter();
  }

  numberOfResultValueChanged() {
    this.numberOfResultValue = this.numberOfResultDropdown.value;
    this.applyFilter();
  }

  // PRIVATE FUNCTIONS
  private initialize() {
    this.initializeFormControls();
    this.listenForFilterInputValueChanged();
  }

  private initializeFormControls() {
    this.searchInput = new FormControl();
    this.filter = new FormControl('', { validators: Validators.required });
    this.searchHistoryDropdown = new FormControl();
    this.numberOfResultDropdown = new FormControl(this.numberOfResultValue);
    this.numberOfResultDropdown.setValue(this.numberOfResultValue);
  }

  private listenForFilterInputValueChanged() {
    this.searchInput.valueChanges.subscribe((value) => {
      this.searchText = value;
    });
  }

  private async loadMoreUsers(keyword: string) {
    // Fetch more data
    const userConnections = await this.userService.fetchUsers(keyword, true, this.numberOfResultValue);
    if (userConnections) {
      this.updateValues(userConnections);
    }
  }

  private async initializeSearch(keyword: string) {
    // Check if in cache
    const cachedUserConnections = await this.userService.fetchUsers(keyword, false, this.numberOfResultValue);
    // Load values from cache
    if (cachedUserConnections) {
      this.updateValues(cachedUserConnections);
    }
    // Listen to value changes
    this.subscribeForIncomingData();
  }

  private subscribeForIncomingData() {
    this.userService.usersQuery.valueChanges.subscribe((userConnections) => {
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

  private updateValues(usersConnection: UserFetchResult) {
    // Get updated values
    this.valuesUpdated = true;
    this.users = this.userService.populateUsers(usersConnection.search);
    this.totalCount = this.userService.currentTotalCount;
    this.currentCount = this.userService.currentResultCount;
    this.fetchingData = false;

    // Call complete to make infinite scroll available for the next batch
    this.infiniteScroll.complete();
  }

  private showFetchStatus() {
    // Show current number of result to fetch over the remaining
    const remainingCount: number = this.totalCount - this.currentCount;
    const fetchCount = remainingCount < this.numberOfResultValue ? remainingCount : this.numberOfResultValue;
    this.loadingStatus = `Loading ${fetchCount} of ${remainingCount}...`;
  }
  // END: PRIVATE FUNCTIONS
}
