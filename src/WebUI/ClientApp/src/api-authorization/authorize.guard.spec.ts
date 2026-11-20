import { TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthorizeGuard } from './authorize.guard';
import { AuthorizeService } from './authorize.service';

describe('AuthorizeGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthorizeGuard,
        { provide: AuthorizeService, useValue: jasmine.createSpyObj('AuthorizeService', ['isAuthenticated']) }
      ]
    });
  });

  it('should ...', inject([AuthorizeGuard], (guard: AuthorizeGuard) => {
    expect(guard).toBeTruthy();
  }));
});
