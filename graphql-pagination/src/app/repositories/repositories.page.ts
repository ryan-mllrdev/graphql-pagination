import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { UserRepositoryService } from '../service/user-repository.service';

@Component({
  selector: 'app-repositories',
  templateUrl: './repositories.page.html',
  styleUrls: ['./repositories.page.scss'],
})
export class RepositoriesPage implements OnInit {
  repositories!: any;
  // tslint:disable-next-line: whitespace
  login: string | undefined = '';
  counter = 0;

  constructor(private route: ActivatedRoute, private userRepositoryService: UserRepositoryService) {}

  ngOnInit() {
    this.login = this.route.snapshot.paramMap.get('login')?.toString();
    this.loadInitialRepositories();
  }

  loadRepositories(event: any) {
    if (this.userRepositoryService.userRepositoriesHasNextPage) {
      this.loadNextRepositories();
      event.target.complete();
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
      this.repositories = this.userRepositoryService.getUserRepositories(userRepositoryData.data);
    });
  }
}
