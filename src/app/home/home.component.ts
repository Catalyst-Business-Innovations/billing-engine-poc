import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Prototype {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  tags: string[];
}

@Component({
  selector: 'app-home',
  template: `
    <div class="home-container">
      <header class="home-header">
        <h1 class="home-title">UI Prototypes</h1>
        <p class="home-subtitle">Browse and interact with UI prototypes for various modules</p>
      </header>

      <div class="cards-grid">
        <div
          class="prototype-card"
          *ngFor="let prototype of prototypes"
          (click)="openPrototype(prototype.route)"
        >
          <div class="card-icon">{{ prototype.icon }}</div>
          <div class="card-content">
            <h2 class="card-title">{{ prototype.title }}</h2>
            <p class="card-description">{{ prototype.description }}</p>
            <div class="card-tags">
              <span class="tag" *ngFor="let tag of prototype.tags">{{ tag }}</span>
            </div>
          </div>
          <div class="card-arrow">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .home-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 48px 24px;
      }

      .home-header {
        margin-bottom: 40px;
      }

      .home-title {
        font-size: 32px;
        font-weight: 700;
        color: #1a2332;
        margin-bottom: 8px;
      }

      .home-subtitle {
        font-size: 16px;
        color: #64748b;
      }

      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 20px;
      }

      .prototype-card {
        display: flex;
        align-items: center;
        gap: 16px;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .prototype-card:hover {
        border-color: #6366f1;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.12);
        transform: translateY(-2px);
      }

      .card-icon {
        flex-shrink: 0;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #eef2ff;
        border-radius: 12px;
        font-size: 28px;
      }

      .card-content {
        flex: 1;
        min-width: 0;
      }

      .card-title {
        font-size: 18px;
        font-weight: 600;
        color: #1a2332;
        margin-bottom: 4px;
      }

      .card-description {
        font-size: 14px;
        color: #64748b;
        line-height: 1.5;
        margin-bottom: 10px;
      }

      .card-tags {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }

      .tag {
        font-size: 12px;
        font-weight: 500;
        color: #6366f1;
        background: #eef2ff;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .card-arrow {
        flex-shrink: 0;
        color: #94a3b8;
        transition: color 0.2s ease;
      }

      .prototype-card:hover .card-arrow {
        color: #6366f1;
      }
    `
  ]
})
export class HomeComponent {
  prototypes: Prototype[] = [
    {
      id: 'billing-engine',
      title: 'Billing Engine',
      description: 'Manage subscription plans, billable services, charges, and company discounts.',
      route: '/billing-engine',
      icon: '\u{1F4B3}',
      tags: ['Plans', 'Services', 'Discounts']
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Metabase analytics integration prototype with dashboards, reports, and data exploration.',
      route: '/analytics',
      icon: '\u{1F4CA}',
      tags: ['TPM', 'POS', 'Lister', 'Donation']
    }
  ];

  constructor(private router: Router) {}

  openPrototype(route: string): void {
    this.router.navigate([route]);
  }
}
