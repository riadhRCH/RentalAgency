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

  private toDateKey = (date: string | Date): string =>
    (date instanceof Date ? date : new Date(date)).toISOString().split('T')[0];

  // Derived directly from inputs — no intermediate signals needed
  private availableDatesMap = computed(() =>
    new Map(this.propertyAvailability().map(d => [this.toDateKey(d.date), d]))
  );

  selectedKeys = computed(() =>
    new Set(this.selectedDates().map(this.toDateKey))
  );

  ngOnInit(): void {
    this.generateCalendarDays();
  }

  private generateCalendarDays(): void {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const days: (number | null)[] = [];
    for (let i = 0; i < new Date(year, month, 1).getDay(); i++) days.push(null);
    for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) days.push(d);
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
    const y = this.currentMonth().getFullYear();
    const m = String(this.currentMonth().getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-${String(day).padStart(2, '0')}`;
  }

  isDayAvailable(day: number): boolean {
    const data = this.availableDatesMap().get(this.getDateKey(day));
    return !data || data.isAvailable !== false;
  }

  isDaySelected(day: number): boolean {
    return this.selectedKeys().has(this.getDateKey(day));
  }

  selectDay(day: number): void {
    if (!this.isDayAvailable(day)) return;
    const key = this.getDateKey(day);
    const next = new Set(this.selectedKeys());
    next.has(key) ? next.delete(key) : next.add(key);
    this.datesSelected.emit(Array.from(next).sort().map(d => new Date(d)));
  }

  clearSelection(): void {
    this.datesSelected.emit([]);
  }

  getMonthYear(): string {
    return this.currentMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getDayOfWeekHeader = (i: number): string =>
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];

  getSelectedDatesArray(): string[] {
    return Array.from(this.selectedKeys()).sort();
  }
}