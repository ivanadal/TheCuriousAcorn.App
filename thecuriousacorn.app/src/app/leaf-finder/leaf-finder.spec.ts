import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { LeafFinderComponent } from './leaf-finder';
import { LeafService } from '../services/leaf-finder.service';

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeafFinderComponent],
      providers: [{ provide: LeafService, useValue: leafServiceStub }]
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
