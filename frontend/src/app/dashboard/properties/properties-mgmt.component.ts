import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertiesService, Property } from '../../services/properties.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-properties-mgmt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './properties-mgmt.component.html',
  styleUrls: ['./properties-mgmt.component.scss']
})
export class PropertiesMgmtComponent implements OnInit {
  private propertiesService = inject(PropertiesService);

  properties: Property[] = [];
  loading = true;
  currentPage = 1;
  totalPages = 1;
  typeFilter = '';

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties(page = 1) {
    this.loading = true;
    this.propertiesService.getProperties(page, 10, { type: this.typeFilter || undefined }).subscribe({
      next: (res) => {
        this.properties = res.data;
        this.totalPages = res.totalPages;
        this.currentPage = res.page;
      },
      complete: () => this.loading = false
    });
  }

  deleteProperty(id: string) {
    if (confirm('Are you sure you want to delete this property?')) {
      this.propertiesService.deleteProperty(id).subscribe(() => {
        this.loadProperties(this.currentPage);
      });
    }
  }
}
