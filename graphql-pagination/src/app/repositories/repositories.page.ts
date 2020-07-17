import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-repositories',
  templateUrl: './repositories.page.html',
  styleUrls: ['./repositories.page.scss'],
})
export class RepositoriesPage implements OnInit {
  repositories!: Observable<any>;
  // tslint:disable-next-line: whitespace
  login: string | undefined = '';
  counter = 0;

  constructor(private route: ActivatedRoute, private dataService: DataService) {}

  ngOnInit() {
    this.login = this.route.snapshot.paramMap.get('login')?.toString();
    this.loadInitialRepositories();
  }

  loadRepositories(event: any) {
    if (this.dataService.userRepositoriesHasNextPage) {
      this.loadNextRepositories();
      event.target.complete();
    } else {
      event.target.disabled = true;
    }
  }

  private async loadNextRepositories() {
    this.repositories = await this.dataService.getUserRepositories(this.login, true);
  }

  private async loadInitialRepositories() {
    this.repositories = await this.dataService.getUserRepositories(this.login);
  }
}
