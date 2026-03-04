import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LeafFinderComponent } from './leaf-finder/leaf-finder';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LeafFinderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('thecuriousacorn.app');
}
