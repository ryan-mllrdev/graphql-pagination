import { Component, OnInit, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild(IonContent) content!: IonContent;

  constructor() {}

  ngOnInit() {}

  backToTop() {
    this.content.scrollToTop();
  }
}
