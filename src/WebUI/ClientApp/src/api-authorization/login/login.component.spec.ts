import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap, UrlSegment } from '@angular/router';

import { LoginComponent } from './login.component';
import { AuthorizeService } from '../authorize.service';
import { LoginActions } from '../api-authorization.constants';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ RouterTestingModule ],
      declarations: [ LoginComponent ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              url: [new UrlSegment('authentication', {}), new UrlSegment(LoginActions.LoginFailed, {})],
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
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
