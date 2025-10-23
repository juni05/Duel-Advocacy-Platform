import { Component } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  imports: [DashboardComponent],
  template: `
    <div class="container">
      <header>
        <h1>Duel Advocacy Platform Dashboard</h1>
      </header>
      <app-dashboard></app-dashboard>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 {
      margin: 0;
      font-size: 28px;
    }
  `]
})
export class AppComponent {
  title = 'Duel Advocacy Platform';
}
