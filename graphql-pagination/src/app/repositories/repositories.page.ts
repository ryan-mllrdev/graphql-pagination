import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UserRepositoryService } from '../service/user-repository.service';
import { Repository } from '../types/Repository';

@Component({
  selector: 'app-repositories',
  templateUrl: './repositories.page.html',
  styleUrls: ['./repositories.page.scss'],
})
export class RepositoriesPage implements OnInit {
  repositories!: Observable<Repository[]> | undefined;
  login = '';
  counter = 0;
  event!: any;
  totalCount = 0;
  currentCount = 0;
  loadingStatus = '';

  constructor(private route: ActivatedRoute, private userRepositoryService: UserRepositoryService) {}

  ngOnInit() {
    // tslint:disable-next-line: no-non-null-assertion
    this.login = this.route.snapshot.paramMap.get('login')!;
    this.loadInitialRepositories();
  }

  loadRepositories(event: any) {
    this.event = event;
    this.showFetchStatus();

    if (this.userRepositoryService.userRepositoriesHasNextPage) {
      this.loadNextRepositories();
    } else {
      event.target.disabled = true;
    }
  }

  private showFetchStatus() {
    const remainingCount: number = this.totalCount - this.currentCount;
    const fetchCount =
      remainingCount < this.userRepositoryService.numberOfResult ? remainingCount : this.userRepositoryService.numberOfResult;
    this.loadingStatus = `Loading ${fetchCount} of ${remainingCount}...`;
  }

  private async loadNextRepositories() {
    const cachedRepositories = await this.userRepositoryService.fetchUserRepositories(this.login, true);
    if (cachedRepositories) {
      this.updateValues(cachedRepositories);
    }
  }

  private updateValues(fetchResult: any) {
    this.repositories = this.userRepositoryService.getCurrentUserRepositories(fetchResult);
    this.totalCount = this.userRepositoryService.repositoriesCount;
    this.currentCount = this.userRepositoryService.fetchedCount;

    if (this.event) {
      this.event.target.complete();
    }
  }

  private async loadInitialRepositories() {
    const cachedRepositories = await this.userRepositoryService.fetchUserRepositories(this.login);
    if (cachedRepositories) {
      this.updateValues(cachedRepositories);
      return;
    }

    this.userRepositoryService.userRepositoriesWatchedQuery.valueChanges.subscribe((userRepositoryData) => {
      if (!userRepositoryData.data || userRepositoryData.loading) {
        return;
      }
      this.updateValues(userRepositoryData.data);
    });
  }
}
