import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {
  @Input() activeRoute: string = 'plans';
  @Output() navigate = new EventEmitter<string>();

  onNavigate(route: string): void {
    this.navigate.emit(route);
  }
}
