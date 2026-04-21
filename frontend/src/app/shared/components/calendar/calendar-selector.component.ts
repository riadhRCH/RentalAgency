import { Component, OnInit, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { DayAvailability } from '../../../services/properties.service';

@Component({
  selector: 'app-calendar-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './calendar-selector.component.html',
  styleUrls: ['./calendar-selector.component.scss']
})
export class CalendarSelectorComponent implements OnInit {
  propertyAvailability = input<DayAvailability[]>([]);
  selectedDates = input<string[]>([]);

  datesSelected = output<Date[]>();

  currentMonth = signal(new Date());
  daysInMonth = signal<(number | null)[]>([]);

  // null = user hasn't interacted yet → fall back to input
  private _userDates = signal<Set<string> | null>(null);

  // Normalize any date string to YYYY-MM-DD
private toDateKey = (dateStr: string | Date): string =>
  (dateStr instanceof Date ? dateStr : new Date(dateStr)).toISOString().split('T')[0];

  private availableDatesMap = computed(() => {
    const map = new Map<string, DayAvailability>();
    this.propertyAvailability().forEach(day => {
      map.set(this.toDateKey(day.date), day);
    });
    return map;
  });

  // Single source of truth — normalized keys always
  private effectiveSelectedDates = computed(() => {
    const userDates = this._userDates();
    if (userDates !== null) return userDates;
    return new Set(this.selectedDates().map(this.toDateKey));
  });

  ngOnInit(): void {
    this.generateCalendarDays();
  }

  private generateCalendarDays(): void {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

    this.daysInMonth.set(days);
  }

  previousMonth(): void {
    const d = new Date(this.currentMonth());
    d.setMonth(d.getMonth() - 1);
    this.currentMonth.set(d);
    this.generateCalendarDays();
  }

  nextMonth(): void {
    const d = new Date(this.currentMonth());
    d.setMonth(d.getMonth() + 1);
    this.currentMonth.set(d);
    this.generateCalendarDays();
  }

  getDateKey(day: number): string {
    const year = this.currentMonth().getFullYear();
    const month = String(this.currentMonth().getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-${String(day).padStart(2, '0')}`;
  }

  isDayAvailable(day: number): boolean {
    const dayData = this.availableDatesMap().get(this.getDateKey(day));
    return !dayData || dayData.isAvailable !== false;
  }

  isDaySelected(day: number): boolean {
    return this.effectiveSelectedDates().has(this.getDateKey(day));
  }

  selectDay(day: number): void {
    if (!this.isDayAvailable(day)) return;
    const key = this.getDateKey(day);
    const newSet = new Set(this.effectiveSelectedDates());
    newSet.has(key) ? newSet.delete(key) : newSet.add(key);
    this._userDates.set(newSet);
    this.datesSelected.emit(Array.from(newSet).sort().map(d => new Date(d)));
  }

  clearSelection(): void {
    this._userDates.set(new Set());
    this.datesSelected.emit([]);
  }

  getMonthYear(): string {
    return this.currentMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getDayOfWeekHeader = (i: number): string =>
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];

  getSelectedDatesArray(): string[] {
    return Array.from(this.effectiveSelectedDates()).sort();
  }
}