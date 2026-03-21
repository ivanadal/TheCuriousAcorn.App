import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { LeafFinderComponent } from './leaf-finder';
import { LeafService } from '../services/leaf-finder.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

describe('LeafFinderComponent', () => {
  let component: LeafFinderComponent;
  let fixture: ComponentFixture<LeafFinderComponent>;

  const leafServiceStub = {
    analyzeLeaf: () =>
      of({
        leafName: 'Oak',
        explanation: 'A sturdy tree.',
        funFact: 'Acorns are oak seeds.'
      })
  };

  const authServiceStub = {
    hasActiveSession: () => true
  };

  const routerStub = {
    navigate: () => Promise.resolve(true)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeafFinderComponent],
      providers: [
        { provide: LeafService, useValue: leafServiceStub },
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LeafFinderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show a friendly error when no image is selected', () => {
    component.handleImageUpload();
    expect(component.errorMessage()).toContain('Please select an image first');
  });
});
