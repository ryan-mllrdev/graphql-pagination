import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { UsersComponent } from '../users/users.component';
import { RepositoriesPage } from '../repositories/repositories.page';
import { UserComponent } from '../users/user/user.component';

import { NgSearchPipe } from 'ng-search-pipe';
import { RepositoryComponent } from '../repositories/repository/repository.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, HomePageRoutingModule, ReactiveFormsModule, NgSearchPipe],
  declarations: [HomePage, UsersComponent, UserComponent, RepositoriesPage, RepositoryComponent],
})
export class HomePageModule {}
