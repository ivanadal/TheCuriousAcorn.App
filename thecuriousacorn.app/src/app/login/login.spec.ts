import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';

import { LoginComponent } from './login';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const authServiceStub = {
    isLoading: signal(false),
    error: signal<string | null>(null),
    isLoggedIn: () => false,
    initGoogleAuth: () => undefined
  };

  const configServiceStub = {
    getGoogleClientId: () => ''
  };

  const routerStub = {
    navigate: () => Promise.resolve(true),
    navigateByUrl: () => Promise.resolve(true),
    url: '/login'
  };

  const activatedRouteStub = {
    snapshot: {
      queryParamMap: {
        get: () => null
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: ConfigService, useValue: configServiceStub },
        { provide: Router, useValue: routerStub },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
