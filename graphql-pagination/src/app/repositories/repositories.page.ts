import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UserRepositoryService } from '../service/user-repository.service';
import { IRepository } from '../interfaces/IRepository';

@Component({
  selector: 'app-repositories',
  templateUrl: './repositories.page.html',
  styleUrls: ['./repositories.page.scss'],
})
export class RepositoriesPage implements OnInit {
  repositories!: Observable<IRepository[]> | undefined;
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
    const remainingCount: number = this.totalCount - this.currentCount;
    const fetchCount =
      remainingCount < this.userRepositoryService.numberOfResult ? remainingCount : this.userRepositoryService.numberOfResult;
    this.loadingStatus = `Loading ${fetchCount} of ${remainingCount}...`;

    this.event = event;

    if (this.userRepositoryService.userRepositoriesHasNextPage) {
      this.loadNextRepositories();
    } else {
      event.target.disabled = true;
    }
  }

  private async loadNextRepositories() {
    await this.userRepositoryService.fetchUserRepositories(this.login, true);
  }

  private async loadInitialRepositories() {
    await this.userRepositoryService.fetchUserRepositories(this.login);
    this.userRepositoryService.userRepositoriesQuery.valueChanges.subscribe((userRepositoryData) => {
      if (!userRepositoryData.data || userRepositoryData.loading) {
        return;
      }

      this.repositories = this.userRepositoryService.getCurrentUserRepositories(userRepositoryData.data);
      this.totalCount = this.userRepositoryService.repositoriesCount;
      this.currentCount = this.userRepositoryService.fetchedCount;

      if (this.event) {
        this.event.target.complete();
      }
    });
  }
}
