import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../i18n/translate.pipe';
import { DayAvailability } from '../../../services/properties.service';

@Component({
  selector: 'app-calendar-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './calendar-selector.component.html',
  styleUrls: ['./calendar-selector.component.scss']
})
export class CalendarSelectorComponent implements OnInit, OnDestroy {
  private propertyCalendarDataSignal = signal<DayAvailability[]>([]);
  private selectedDatesControlSignal = signal<FormControl>(new FormControl([]));

  @Input()
  set propertyCalendarData(value: DayAvailability[]) {
    this.propertyCalendarDataSignal.set(value || []);
  }
  get propertyCalendarData(): DayAvailability[] {
    return this.propertyCalendarDataSignal();
  }

  @Input()
  set selectedDatesControl(value: FormControl) {
    this.selectedDatesControlSignal.set(value);
  }
  get selectedDatesControl(): FormControl {
    return this.selectedDatesControlSignal();
  }

  @Output() datesSelected = new EventEmitter<Date[]>();

  currentMonth = signal(new Date());
  daysInMonth = signal<(number | null)[]>([]);
  selectedDates = signal<Set<string>>(new Set());

  private availableDatesMap = new Map<string, DayAvailability>();
  private selectedDatesSubscription: Subscription | null = null;

  constructor() {
  }

  ngOnInit(): void {
    this.generateCalendarDays();
    this.loadSelectedDates();
    this.subscribeToControl();

    effect(() => {
      this.propertyCalendarData;
      this.buildAvailabilityMap();
      this.generateCalendarDays();
    });

    effect(() => {
      const control = this.selectedDatesControl;
      if (control) {
        this.subscribeToControl(control);
        this.loadSelectedDates();
      }
    });
  }

  private subscribeToControl(control?: FormControl): void {
    if (this.selectedDatesSubscription) {
      this.selectedDatesSubscription.unsubscribe();
    }

    const formControl = control ?? this.selectedDatesControl;
    if (formControl) {
      this.selectedDatesSubscription = formControl.valueChanges.subscribe(() => {
        this.loadSelectedDates();
      });
    }
  }

  private buildAvailabilityMap(): void {
    this.availableDatesMap.clear();
    this.propertyCalendarData.forEach(day => {
      const dateStr = new Date(day.date).toISOString().split('T')[0];
      this.availableDatesMap.set(dateStr, day);
    });
  }

  private loadSelectedDates(): void {
    const dates = this.selectedDatesControl?.value || [];
    if (Array.isArray(dates)) {
      const selectedSet = new Set<string>();
      dates.forEach(dateStr => {
        selectedSet.add(dateStr);
      });
      this.selectedDates.set(selectedSet);
    } else {
      this.selectedDates.set(new Set());
    }
  }

  private generateCalendarDays(): void {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysArray: (number | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      daysArray.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      daysArray.push(day);
    }

    this.daysInMonth.set(daysArray);
  }

  previousMonth(): void {
    const newDate = new Date(this.currentMonth());
    newDate.setMonth(newDate.getMonth() - 1);
    this.currentMonth.set(newDate);
    this.generateCalendarDays();
  }

  nextMonth(): void {
    const newDate = new Date(this.currentMonth());
    newDate.setMonth(newDate.getMonth() + 1);
    this.currentMonth.set(newDate);
    this.generateCalendarDays();
  }

  getDateFromDay(day: number): string {
    const year = this.currentMonth().getFullYear();
    const month = String(this.currentMonth().getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  }

  isDayAvailable(day: number): boolean {
    if (!day) return false;
    const dateStr = this.getDateFromDay(day);
    const dayData = this.availableDatesMap.get(dateStr);
    if (!dayData) return true; // If not in calendar data, assume available
    return dayData.isAvailable !== false;
  }

  isDaySelected(day: number): boolean {
    if (!day) return false;
    const dateStr = this.getDateFromDay(day);
    return this.selectedDates().has(dateStr);
  }

  selectDay(day: number): void {
    if (!this.isDayAvailable(day)) return;

    const dateStr = this.getDateFromDay(day);
    const newSet = new Set(this.selectedDates());

    if (newSet.has(dateStr)) {
      newSet.delete(dateStr);
    } else {
      newSet.add(dateStr);
    }

    this.selectedDates.set(newSet);
    this.updateFormControl();
    this.datesSelected.emit(Array.from(newSet).sort().map(d => new Date(d)));
  }

  clearSelection(): void {
    this.selectedDates.set(new Set());
    this.updateFormControl();
  }

  private updateFormControl(): void {
    const datesArray = Array.from(this.selectedDates()).sort();
    this.selectedDatesControl?.setValue(datesArray);
  }

  ngOnDestroy(): void {
    if (this.selectedDatesSubscription) {
      this.selectedDatesSubscription.unsubscribe();
    }
  }

  getMonthYear(): string {
    return this.currentMonth().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  getDayOfWeekHeader(index: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[index];
  }

  getSelectedDatesArray(): string[] {
    return Array.from(this.selectedDates()).sort();
  }
}
