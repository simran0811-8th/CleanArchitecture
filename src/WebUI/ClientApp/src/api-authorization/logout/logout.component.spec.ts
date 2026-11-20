import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap, UrlSegment } from '@angular/router';

import { LogoutComponent } from './logout.component';
import { AuthorizeService } from '../authorize.service';
import { LogoutActions } from '../api-authorization.constants';

describe('LogoutComponent', () => {
  let component: LogoutComponent;
  let fixture: ComponentFixture<LogoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ RouterTestingModule ],
      declarations: [ LogoutComponent ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              url: [new UrlSegment('authentication', {}), new UrlSegment(LogoutActions.LoggedOut, {})],
              queryParams: {},
              queryParamMap: convertToParamMap({})
            }
          }
        },
        {
          provide: AuthorizeService,
          useValue: jasmine.createSpyObj('AuthorizeService', [
            'isAuthenticated', 'getUser', 'getAccessToken', 'signIn', 'completeSignIn', 'signOut', 'completeSignOut'
          ])
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
