import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeafFinderComponent } from './leaf-finder';

describe('LeafFinderComponent', () => {
  let component: LeafFinderComponent;
  let fixture: ComponentFixture<LeafFinderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeafFinderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeafFinderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
