import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RepositoriesPage } from './repositories.page';

describe('RepositoriesPage', () => {
  let component: RepositoriesPage;
  let fixture: ComponentFixture<RepositoriesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RepositoriesPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RepositoriesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
