import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LeafFinder } from './leaf-finder/leaf-finder';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LeafFinder],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('thecuriousacorn.app');
}
