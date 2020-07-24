import { Component, OnInit, Input } from '@angular/core';
import { Repository } from 'src/app/types/Repository';

@Component({
  selector: 'app-repository',
  templateUrl: './repository.component.html',
  styleUrls: ['./repository.component.scss'],
})
export class RepositoryComponent implements OnInit {
  @Input() repository!: Repository;

  constructor() {}

  ngOnInit() {}

  goToUrl() {
    if (!this.repository || !this.repository?.url) {
      return;
    }
    window.open(this.repository.url, '_blank');
  }
}
