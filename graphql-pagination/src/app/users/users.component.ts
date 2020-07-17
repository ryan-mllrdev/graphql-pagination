import { Component, OnInit } from '@angular/core';
import { UserService } from '../service/user.service';
import { of } from 'rxjs';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  users!: any;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadInitialUsers();
  }

  loadUsers(event: any) {
    if (this.userService.usersHasNextPage) {
      this.loadMoreUsers();
      event.target.complete();
    } else {
      event.target.disabled = true;
    }
  }

  private async loadMoreUsers() {
    await this.userService.fetchUsersData(true);
  }

  private async loadInitialUsers() {
    await this.userService.fetchUsersData();
    this.userService.usersQuery.valueChanges.subscribe((usersData: any) => {
      this.users = this.userService.getUsersData(usersData.data);
    });
  }
}
