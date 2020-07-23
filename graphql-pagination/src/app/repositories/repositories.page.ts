import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UserRepositoryService } from '../service/user-repository.service';
import { Repository } from '../types/Repository';
import { IonInfiniteScroll } from '@ionic/angular';

@Component({
  selector: 'app-repositories',
  templateUrl: './repositories.page.html',
  styleUrls: ['./repositories.page.scss'],
})
export class RepositoriesPage implements OnInit, AfterViewInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;
  repositories!: Observable<Repository[]> | undefined;
  loginName = '';
  counter = 0;
  event!: any;
  totalCount = 0;
  currentCount = 0;
  loadingStatus = '';
  private valuesUpdated = false;

  constructor(private route: ActivatedRoute, private userRepositoryService: UserRepositoryService) {}

  ngAfterViewInit() {
    this.disableInfiniteScroll(true);
  }

  ngOnInit() {
    // tslint:disable-next-line: no-non-null-assertion
    this.loginName = this.route.snapshot.paramMap.get('login')!;
    this.initialize(this.loginName);
  }

  async loadRepositories(event: any) {
    this.valuesUpdated = false;
    // Show loading status
    this.showFetchStatus();

    // Load more if has next pages
    if (this.userRepositoryService.userRepositoriesHasNextPage) {
      await this.loadMoreUserRepositoriesConnection(this.loginName);
    } else {
      this.disableInfiniteScroll(true);
    }
  }

  // PRIVATE FUNCTIONS
  private async initialize(loginName: string) {
    this.valuesUpdated = false;
    // Check if in cache
    const cachedUserRepositoriesConnection = await this.userRepositoryService.fetchUserRepositoriesConnection(loginName);
    // Listen to value changes
    this.initializeQuery();
    // Load values from cache
    if (cachedUserRepositoriesConnection) {
      this.updateValues(cachedUserRepositoriesConnection);
    }
    this.disableInfiniteScroll(false);
  }

  private initializeQuery() {
    this.userRepositoryService.userRepositoriesConnectionWatchedQuery.valueChanges.subscribe((userRepositoriesConnection) => {
      if (!userRepositoriesConnection || userRepositoriesConnection.loading) {
        return;
      }
      if (!this.valuesUpdated) {
        this.updateValues(userRepositoriesConnection.data);
      }
    });
  }

  private async loadMoreUserRepositoriesConnection(loginName: string) {
    const userRepositoriesConnection = await this.userRepositoryService.fetchUserRepositoriesConnection(loginName, true);
    if (userRepositoriesConnection) {
      this.updateValues(userRepositoriesConnection);
    }
  }

  private updateValues(userRepositoriesConnection: any) {
    this.valuesUpdated = true;
    this.repositories = this.userRepositoryService.getUserRepositories(userRepositoriesConnection);
    this.totalCount = this.userRepositoryService.repositoriesCount;
    this.currentCount = this.userRepositoryService.fetchedCount;
    this.infiniteScroll.complete();
  }

  private showFetchStatus() {
    const remainingCount: number = this.totalCount - this.currentCount;
    const fetchCount =
      remainingCount < this.userRepositoryService.numberOfResult ? remainingCount : this.userRepositoryService.numberOfResult;
    this.loadingStatus = `Loading ${fetchCount} of ${remainingCount}...`;
  }

  private disableInfiniteScroll(disabled: boolean) {
    this.infiniteScroll.disabled = disabled;
  }
  // END: PRIVATE FUNCTIONS
}
