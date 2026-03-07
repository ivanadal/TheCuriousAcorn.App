import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'leaf-finder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaf-finder.html',
  styleUrl: './leaf-finder.css'
})
export class LeafFinderComponent {
  screen = signal<'home' | 'loading' | 'result'>('home');
  selectedAgeGroup = signal('early');
  leafResult = signal<any>(null);
  selectedImage = signal<string | null>(null);

  ageGroups = [
    { id: 'preschool', label: '4-6 years', emoji: '🌱' },
    { id: 'early', label: '7-9 years', emoji: '🌿' },
    { id: 'middle', label: '10-12 years', emoji: '🌳' },
    { id: 'teen', label: '13+ years', emoji: '🌲' }
  ];

  mockResponses = {
    preschool: {
      leafName: 'Oak Leaf',
      explanation: "Wow! This is a big leaf! Leaves help plants drink the sun! It's green because it loves the sunshine!",
      funFact: 'Did you know? Leaves are like little solar panels! ☀️'
    },
    early: {
      leafName: 'Oak Leaf',
      explanation: "This is a beautiful oak leaf! Oak trees can live for a very long time. The leaf is green because it has something called chlorophyll that helps the tree make food from sunlight. That's pretty cool!",
      funFact: 'Oak trees are home to hundreds of different insects and animals! 🦗🐿️'
    },
    middle: {
      leafName: 'White Oak (Quercus alba)',
      explanation: "This is an oak leaf from a white oak tree. Notice the rounded lobes - this leaf shape is specially designed to reduce water loss in dry conditions. Oak leaves turn red or brown in fall because the tree stops making chlorophyll to save energy for winter. These trees are super important for wildlife - squirrels, birds, and insects depend on them for food and shelter.",
      funFact: 'White oak trees can live for over 300 years! Some are older than the United States! 🌳'
    },
    teen: {
      leafName: 'White Oak (Quercus alba)',
      explanation: "This appears to be a white oak, identifiable by its characteristic rounded lobes with sinuses that don't reach the midrib. The pinnate venation pattern maximizes photosynthetic surface area while the lobed morphology reduces wind resistance. The waxy cuticle on the leaf surface serves as a protective barrier against water loss and pathogenic infection.",
      funFact: 'Oak species support over 500 specialized insect species, which form the foundation of temperate forest food webs. 🔗🌍'
    }
  };

  handleImageUpload() {
    this.screen.set('loading');
    
    // Simulate file upload
    setTimeout(() => {
      const response = this.mockResponses[this.selectedAgeGroup() as keyof typeof this.mockResponses];
      this.leafResult.set(response);
      this.selectedImage.set('https://images.unsplash.com/photo-1511656828935-0cb5233d976d?w=400&h=300&fit=crop');
      this.screen.set('result');
    }, 2000);
  }

  backToHome() {
    this.screen.set('home');
    this.leafResult.set(null);
    this.selectedImage.set(null);
  }

  findAnotherLeaf() {
    this.screen.set('home');
    this.leafResult.set(null);
    this.selectedImage.set(null);
  }

  selectAgeGroup(ageId: string) {
    this.selectedAgeGroup.set(ageId);
  }
}
