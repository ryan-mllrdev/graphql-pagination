import { Component, OnInit, Input } from '@angular/core';
import { Repository } from '../../core/types/Repository';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
  selector: 'app-repository',
  templateUrl: './repository.component.html',
  styleUrls: ['./repository.component.scss'],
})
export class RepositoryComponent implements OnInit {
  @Input() repository!: Repository;

  constructor(private inAppBrowser: InAppBrowser) {}

  ngOnInit() {}

  goToUrl() {
    if (!this.repository || !this.repository?.url) {
      return;
    }
    const browser = this.inAppBrowser.create(this.repository.url, '_blank');
    browser.close();
  }
}
