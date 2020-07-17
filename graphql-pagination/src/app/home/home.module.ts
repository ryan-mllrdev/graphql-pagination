import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { UsersComponent } from '../users/users.component';
import { RepositoriesPage } from '../repositories/repositories.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, HomePageRoutingModule, ReactiveFormsModule],
  declarations: [HomePage, UsersComponent, RepositoriesPage],
})
export class HomePageModule {}
