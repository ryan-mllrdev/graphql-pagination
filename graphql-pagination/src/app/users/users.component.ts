import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  users!: Observable<any>;

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadInitialUsers();
  }

  loadUsers(event: any) {
    if (this.dataService.usersHasNextPage) {
      this.loadMoreUsers();
      event.target.complete();
    } else {
      event.target.disabled = true;
    }
  }

  private async loadMoreUsers() {
    this.users = await this.dataService.getUsers(true);
  }

  private async loadInitialUsers() {
    this.users = await this.dataService.getUsers();
  }
}
