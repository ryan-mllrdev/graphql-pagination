import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UserRepositoryService } from '../core/services/repository-service/user-repository.service';
import { Repository } from '../core/types/Repository';
import { IonInfiniteScroll, IonContent } from '@ionic/angular';
import { FormControl } from '@angular/forms';
import { RepositoryFetchResult } from '../core/types/RepositoryFetchResult';
import { RepositoryQueryVariables } from '../core/types/RepositoryQueryVariables';

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
  loadingStatus = '';
  searchText = '';
  totalCount = 0;
  currentCount = 0;

  constructor(private route: ActivatedRoute, private repositoryService: UserRepositoryService) {}

  ngAfterViewInit() {
    this.disableInfiniteScroll(true);
    this.initialize();
  }

  ngOnInit() {}

  fetchMore(event: any) {
    this.valuesUpdated = false;
    // Show loading status
    this.showFetchStatus();

    // Load more if has next pages
    if (this.repositoryService.userRepositoriesHasNextPage) {
      this.fetchMoreRepositories();
    } else {
      this.disableInfiniteScroll(true);
    }
  }

  backToTop() {
    this.content.scrollToTop();
  }

  // PRIVATE FUNCTIONS
  private initialize() {
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
    const queryVariables: RepositoryQueryVariables = {
      login: this.loginName,
      first: this.numberOfResult,
    };

    const cacheRepositories: RepositoryFetchResult | null = this.repositoryService.readRepositoriesFromCache(queryVariables);

    // Load values from cache
    if (cacheRepositories) {
      this.updateValues(cacheRepositories);
    } else {
      this.repositoryService.fetchRepositories(queryVariables).subscribe((result) => {
        if (!result || this.valuesUpdated) {
          return;
        }
        this.updateValues(result);
      });
    }

    // Enable infinite scroll
    this.disableInfiniteScroll(false);
  }

  private fetchMoreRepositories() {
    // Fetch more data
    this.repositoryService.fetchMoreRepositories(this.numberOfResult).subscribe((result) => {
      if (!result || this.valuesUpdated) {
        return;
      }
      this.updateValues(result);
    });
  }

  private updateValues(repositoryFetchResult: RepositoryFetchResult) {
    // Get the updated values
    this.valuesUpdated = true;
    this.repositories = this.repositoryService.populateRepositories(repositoryFetchResult.user.repositories);
    this.totalCount = this.repositoryService.repositoriesCount;
    this.currentCount = this.repositoryService.fetchedCount;
    // Call complete to make the infinite scroll available for the next request
    this.infiniteScroll.complete();
  }

  // Show the number of result to fetch over the remaining number of results
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
