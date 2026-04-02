import { Component, Input } from '@angular/core';

export type IconName = 
  | 'plus'
  | 'close'
  | 'edit'
  | 'delete'
  | 'search'
  | 'chevron-down'
  | 'chevron-up'
  | 'checkmark'
  | 'clear'
  | 'copy';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss']
})
export class IconComponent {
  @Input() name!: IconName;
  @Input() width: string = '16';
  @Input() height: string = '16';
  @Input() strokeWidth: string = '2';
  @Input() class: string = '';
}
