import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AgencySelectionComponent } from './auth/agency-selection/agency-selection.component';
import { authGuard, agencyGuard } from './auth/auth.guard';
import { OverviewComponent } from './dashboard/overview/overview.component';
import { LeadsComponent } from './dashboard/leads/leads.component';
import { ConfigComponent } from './dashboard/config/config.component';
import { VisitsComponent } from './dashboard/visits/visits.component';
import { PropertiesMgmtComponent } from './dashboard/properties/properties-mgmt.component';
import { TeamsComponent } from './dashboard/teams/teams.component';
import { DashboardLayoutComponent } from './dashboard/layout/dashboard-layout.component';
import { RentalsListComponent } from './dashboard/rentals/rentals-list.component';
import { RentalProvisioningComponent } from './dashboard/rentals/rental-provisioning.component';
import { RentalDetailComponent } from './dashboard/rentals/rental-detail.component';

export const routes: Routes = [
    { path: '', component: LandingPage },
    { path: 'auth/login', component: LoginComponent },
    { path: 'auth/register', component: RegisterComponent },
    { path: 'auth/select-agency', component: AgencySelectionComponent, canActivate: [authGuard] },
    {
        path: 'dashboard',
        component: DashboardLayoutComponent,
        canActivate: [authGuard, agencyGuard],
        children: [
            { path: 'overview', component: OverviewComponent },
            { path: 'leads', component: LeadsComponent },
            { path: 'visits', component: VisitsComponent },
            { path: 'properties', component: PropertiesMgmtComponent },
            { path: 'rentals', component: RentalsListComponent },
            { path: 'rentals/provision', component: RentalProvisioningComponent },
            { path: 'rentals/:id', component: RentalDetailComponent },
            { path: 'teams', component: TeamsComponent },
            { path: 'config', component: ConfigComponent }
        ]
    }
];
