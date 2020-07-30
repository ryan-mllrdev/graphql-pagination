import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { UserService } from '../core/services/user-service/user.service';
import { Observable } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { IonInfiniteScroll } from '@ionic/angular';
import { User } from '../core/types/User';
import { UserFetchResult } from '../core/types/UserFetchResult';
import { UserQueryVariables } from '../core/types/UserQueryVariables';

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
  searchBtnText = 'Search';

  filterResultsInput!: FormControl;
  searchUserInput!: FormControl;
  searchHistoryDropdown!: FormControl;
  numberOfResultDropdown!: FormControl;

  constructor(private userService: UserService) {}

  ngAfterViewInit() {
    this.disableInfiniteScroll(true);
  }

  ngOnInit() {
    this.initialize();
  }

  fetchMore(event: any) {
    this.toggleFetchingData(true);
    // Show loading status
    this.showFetchStatus();

    // Load more if has next pages
    if (this.userService.hasNextPage) {
      this.fetchMoreUsers(this.searchUserInput.value);
    } else {
      this.disableInfiniteScroll(true);
      this.toggleFetchingData(false);
    }
  }

  search() {
    const keyword = this.searchUserInput.value;
    if (!keyword) {
      return;
    }
    this.toggleFetchingData(true);
    this.initializeSearch(keyword);
    this.disableInfiniteScroll(false);
    // Look for keywords from history list
    const existingKeyword = this.searchHistory.find((word) => word === keyword);
    if (!existingKeyword) {
      this.searchHistory.push(keyword);
    }

    this.selectedSearchValue = keyword;
  }

  searchHistoryValueChanged() {
    this.searchUserInput.setValue(this.searchHistoryDropdown.value);
    this.search();
  }

  numberOfResultValueChanged() {
    this.numberOfResultValue = this.numberOfResultDropdown.value;
    this.search();
  }

  // PRIVATE FUNCTIONS
  private initialize() {
    this.initializeFormControls();
    this.listenForFilterInputValueChanged();
  }

  private toggleFetchingData(fetching: boolean) {
    this.fetchingData = fetching;
    this.valuesUpdated = !fetching;
    this.searchBtnText = fetching ? 'Loading...' : 'Search';
  }

  private initializeFormControls() {
    this.filterResultsInput = new FormControl();
    this.searchUserInput = new FormControl('', { validators: Validators.required });
    this.searchHistoryDropdown = new FormControl();
    this.numberOfResultDropdown = new FormControl(this.numberOfResultValue);
    this.numberOfResultDropdown.setValue(this.numberOfResultValue);
  }

  private listenForFilterInputValueChanged() {
    this.filterResultsInput.valueChanges.subscribe((value) => {
      this.searchText = value;
    });
  }

  private fetchMoreUsers(keyword: string) {
    // Fetch more data
    this.userService.fetchMoreUsers(this.numberOfResultValue).subscribe((result) => {
      if (!result || this.valuesUpdated) {
        return;
      }
      this.updateValues(result);
    });
  }

  private initializeSearch(keyword: string) {
    const queryVariables: UserQueryVariables = {
      searchKeyword: keyword,
      first: this.numberOfResultValue,
    };

    // Read value from cache first
    let cacheUsers!: UserFetchResult | null;
    this.userService.readUsersFromCache(queryVariables).subscribe((result) => {
      cacheUsers = result;
    });
    // Load values from cache
    if (cacheUsers) {
      this.updateValues(cacheUsers);
    } else {
      this.userService.fetchUsers(queryVariables).subscribe((result) => {
        if (!result || this.valuesUpdated) {
          return;
        }

        this.updateValues(result);
      });
    }
  }

  private disableInfiniteScroll(disabled: boolean) {
    this.infiniteScroll.disabled = disabled;
  }

  private updateValues(usersConnection: UserFetchResult) {
    // Get updated values
    this.users = this.userService.populateUsers(usersConnection.search);
    this.totalCount = this.userService.currentTotalCount;
    this.currentCount = this.userService.currentResultCount;

    this.toggleFetchingData(false);

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
