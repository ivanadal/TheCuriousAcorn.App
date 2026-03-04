import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeafFinder } from './leaf-finder';

describe('LeafFinder', () => {
  let component: LeafFinder;
  let fixture: ComponentFixture<LeafFinder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeafFinder],
    }).compileComponents();

    fixture = TestBed.createComponent(LeafFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
