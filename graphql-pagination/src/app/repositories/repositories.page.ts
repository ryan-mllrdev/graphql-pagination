import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UserRepositoryService } from '../core/services/repository-service/user-repository.service';
import { Repository } from '../core/types/Repository';
import { IonInfiniteScroll, IonContent } from '@ionic/angular';
import { FormControl } from '@angular/forms';
import { RepositoryFetchResult } from '../core/types/RepositoryFetchResult';

@Component({
  selector: 'app-repositories',
  templateUrl: './repositories.page.html',
  styleUrls: ['./repositories.page.scss'],
})
export class RepositoriesPage implements OnInit, AfterViewInit {
  @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;
  @ViewChild(IonContent) content!: IonContent;

  private valuesUpdated = false;
  private numberOfResult = 10;

  searchInput!: FormControl;
  repositories!: Observable<Repository[]> | undefined;
  loginName!: string;
  counter = 0;
  event!: any;
  totalCount = 0;
  currentCount = 0;
  loadingStatus = '';
  searchText = '';

  constructor(private route: ActivatedRoute, private userRepositoryService: UserRepositoryService) {}

  ngAfterViewInit() {
    this.disableInfiniteScroll(true);
  }

  ngOnInit() {
    this.initialize();
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

  backToTop() {
    this.content.scrollToTop();
  }

  // PRIVATE FUNCTIONS
  private async initialize() {
    this.searchInput = new FormControl();
    this.loginName = this.route.snapshot.paramMap.get('login') ?? '';

    if (!this.loginName) {
      console.log('Login name is not provided.');
      return;
    }

    this.searchInput.valueChanges.subscribe((value) => {
      this.searchText = value;
    });

    this.valuesUpdated = false;
    // Check if in cache
    const cachedUserRepositoriesConnection = await this.userRepositoryService.fetchUserRepositories(
      this.loginName,
      false,
      this.numberOfResult,
    );
    // Listen to value changes
    this.initializeQuery();
    // Load values from cache
    if (cachedUserRepositoriesConnection) {
      this.updateValues(cachedUserRepositoriesConnection);
    }
    this.disableInfiniteScroll(false);
  }

  private initializeQuery() {
    this.userRepositoryService.repositoryConnectionQuery.valueChanges.subscribe((userRepositoriesConnection) => {
      if (!userRepositoriesConnection || userRepositoriesConnection.loading) {
        return;
      }
      if (!this.valuesUpdated) {
        this.updateValues(userRepositoriesConnection.data);
      }
    });
  }

  private async loadMoreUserRepositoriesConnection(loginName: string) {
    const userRepositoriesConnection = await this.userRepositoryService.fetchUserRepositories(loginName, true, this.numberOfResult);
    if (userRepositoriesConnection) {
      this.updateValues(userRepositoriesConnection);
    }
  }

  private updateValues(userRepositoriesConnection: RepositoryFetchResult) {
    this.valuesUpdated = true;
    this.repositories = this.userRepositoryService.populateRepositories(userRepositoriesConnection);
    this.totalCount = this.userRepositoryService.repositoriesCount;
    this.currentCount = this.userRepositoryService.fetchedCount;
    this.infiniteScroll.complete();
  }

  private showFetchStatus() {
    const remainingCount: number = this.totalCount - this.currentCount;
    const fetchCount = remainingCount < this.numberOfResult ? remainingCount : this.numberOfResult;
    this.loadingStatus = `Loading ${fetchCount} of ${remainingCount}...`;
  }

  private disableInfiniteScroll(disabled: boolean) {
    this.infiniteScroll.disabled = disabled;
  }
  // END: PRIVATE FUNCTIONS
}
