import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AgencySelectionComponent } from './auth/agency-selection/agency-selection.component';
import { authGuard, agencyGuard } from './auth/auth.guard';
import { OverviewComponent } from './dashboard/overview/overview.component';
import { AgencyOverviewComponent } from './dashboard/overview/agency-overview.component';
import { LeadsComponent } from './dashboard/leads/leads.component';
import { AddLeadComponent } from './dashboard/leads/add-lead/add-lead.component';
import { ConfigComponent } from './dashboard/config/config.component';
import { VisitsComponent } from './dashboard/visits/visits.component';
import { PropertiesMgmtComponent } from './dashboard/properties/properties-mgmt.component';
import { AddPropertyComponent } from './dashboard/properties/add-property/add-property.component';
import { TeamsComponent } from './dashboard/teams/teams.component';
import { DashboardLayoutComponent } from './dashboard/layout/dashboard-layout.component';
import { TransactionsListComponent } from './dashboard/transactions/transactions-list.component';
import { TransactionProvisioningComponent } from './dashboard/transactions/transaction-provisioning.component';
import { TransactionDetailComponent } from './dashboard/transactions/transaction-detail.component';
import { ContractEditorComponent } from './dashboard/contracts/contract-editor.component';
import { PropertyDetailsComponent } from './public/property-details/property-details.component';
import { ThankYouComponent } from './public/thank-you/thank-you.component';
import { CarouselComponent } from './public/carousel/carousel.component';
import { TransactionComponent } from './public/transaction/transaction.component';
import { BankDetailsComponent } from './dashboard/bank-details/bank-details.component';
import { OwnersPageComponent } from './dashboard/personnel/owners-page/owners-page.component';
import { OwnerDashboardComponent } from './public/owner-dashboard/owner-dashboard.component';
import { AnnouncementsComponent } from './dashboard/announcements/announcements.component';
import { AgencyLandingPageComponent } from './public/agency-landing-page/agency-landing-page.component';

export const routes: Routes = [
    { path: '', component: LandingPage },
    { path: 'announce/:id', component: PropertyDetailsComponent },
    { path: 'transaction/:id', component: TransactionComponent },
    { path: 'owner-dashboard/:token', component: OwnerDashboardComponent },
    { path: 'thank-you', component: ThankYouComponent },
    { path: 'carousel', component: CarouselComponent },
    { path: 'auth/login', component: LoginComponent },
    { path: 'auth/register', component: RegisterComponent },
    { path: 'auth/select-agency', component: AgencySelectionComponent, canActivate: [authGuard] },
    {
        path: 'dashboard',
        component: DashboardLayoutComponent,
        canActivate: [authGuard, agencyGuard],
        children: [
            { path: '', redirectTo: 'overview/leads', pathMatch: 'full' },
            { 
                path: 'overview', 
                component: AgencyOverviewComponent,
                children: [
                    { path: '', redirectTo: 'leads', pathMatch: 'full' },
                    { path: 'leads', component: LeadsComponent },
                    { path: 'visits', component: VisitsComponent },
                    { path: 'transactions', component: TransactionsListComponent }
                ]
            },
            { path: 'leads', redirectTo: 'overview/leads' },
            { path: 'visits', redirectTo: 'overview/visits' },
            { path: 'transactions', redirectTo: 'overview/transactions' },
            { path: 'leads/add', component: AddLeadComponent },
            { path: 'properties', component: PropertiesMgmtComponent },
            { path: 'announcements', component: AnnouncementsComponent },
            { path: 'properties/add', component: AddPropertyComponent },
            { path: 'properties/edit/:id', component: AddPropertyComponent },
            { path: 'transactions/provision', component: TransactionProvisioningComponent },
            { path: 'transactions/:id/contract', component: ContractEditorComponent },
            { path: 'transactions/:id', component: TransactionDetailComponent },
            { path: 'personnel/team', component: TeamsComponent },
            { path: 'personnel/owners', component: OwnersPageComponent },
            { path: 'teams', component: TeamsComponent },
            { path: 'config', component: ConfigComponent },
            { path: 'bank-details', component: BankDetailsComponent }
        ]
    },
    { path: ':agencyId', component: AgencyLandingPageComponent }
];
