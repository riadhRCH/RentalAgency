import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TransactionsService, Transaction } from '../../services/transactions.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { AgencyProfile, AgencyService } from '../../services/agency.service';
import { AuthService } from '../../auth/auth.service';

interface ContractClause {
  id: string;
  title: string;
  body: string;
  removable?: boolean;
}

interface ContractDocumentModel {
  title: string;
  contractDate: string;
  city: string;
  landlordName: string;
  landlordDetails: string;
  tenantName: string;
  tenantDetails: string;
  propertyReference: string;
  propertyAddress: string;
  propertyDescription: string;
  paymentFrequency: string;
  rentAmount: number;
  depositAmount: number;
  startDate: string;
  endDate: string;
  duration: string;
  closingStatement: string;
  signatureLabelOwner: string;
  signatureLabelTenant: string;
  clauses: ContractClause[];
}

@Component({
  selector: 'app-contract-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  providers: [DatePipe],
  templateUrl: './contract-editor.component.html',
  styleUrls: ['./contract-editor.component.scss']
})
export class ContractEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transactionsService = inject(TransactionsService);
  private readonly agencyService = inject(AgencyService);
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly datePipe = inject(DatePipe);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isPrinting = signal(false);
  readonly isDownloading = signal(false);

  transaction: Transaction | null = null;
  agencyProfile: AgencyProfile | null = null;
  error: string | null = null;
  successMessage: string | null = null;
  documentModel: ContractDocumentModel | null = null;

  ngOnInit(): void {
    const transactionId = this.route.snapshot.paramMap.get('id');

    if (!transactionId) {
      this.error = this.i18n.translate('CONTRACT_EDITOR.MISSING_TRANSACTION');
      this.isLoading.set(false);
      return;
    }

    this.loadAgencyProfile();
    this.loadTransaction(transactionId);
  }

  private loadAgencyProfile(): void {
    this.agencyService.getProfile().subscribe({
      next: (profile) => {
        this.agencyProfile = profile;
      },
      error: () => {
        const activeAgencyId = this.authService.activeAgencyId();
        const fallbackAgency = this.authService.userAgencies().find((agency) => agency.id === activeAgencyId) ?? this.authService.userAgencies()[0];

        if (fallbackAgency) {
          this.agencyProfile = {
            id: fallbackAgency.id,
            name: fallbackAgency.name,
          };
        }
      }
    });
  }

  private loadTransaction(transactionId: string): void {
    this.transactionsService.findOne(transactionId).subscribe({
      next: (transaction) => {
        this.transaction = transaction;
        this.documentModel = this.buildDocumentModel(transaction);
        this.isLoading.set(false);
      },
      error: () => {
        this.error = this.i18n.translate('CONTRACT_EDITOR.LOAD_TRANSACTION_FAILED');
        this.isLoading.set(false);
      }
    });
  }

  private buildDocumentModel(transaction: Transaction): ContractDocumentModel {
    const baseModel: ContractDocumentModel = {
      title: `Contrat de location - ${transaction.propertyId?.reference ?? transaction._id}`,
      contractDate: this.formatDate(new Date()),
      city: 'Tunis',
      landlordName: '',
      landlordDetails: '',
      tenantName: `${transaction.personnelId?.firstName ?? ''} ${transaction.personnelId?.lastName ?? ''}`.trim(),
      tenantDetails: this.buildTenantDetails(transaction),
      propertyReference: transaction.propertyId?.reference ?? '',
      propertyAddress: transaction.propertyId?.address ?? '',
      propertyDescription: this.i18n.translate('CONTRACT_EDITOR.DEFAULT_PROPERTY_DESCRIPTION'),
      paymentFrequency: this.getPaymentFrequencyLabel(transaction.financialDetails?.paymentFrequency),
      rentAmount: transaction.financialDetails?.rentAmount ?? 0,
      depositAmount: transaction.financialDetails?.depositAmount ?? 0,
      startDate: this.formatDate(transaction.timeline?.startDate),
      endDate: this.formatDate(transaction.timeline?.endDate),
      duration: this.getDurationLabel(transaction.timeline?.duration),
      closingStatement: this.i18n.translate('CONTRACT_EDITOR.DEFAULT_CLOSING'),
      signatureLabelOwner: this.i18n.translate('CONTRACT_EDITOR.SIGNATURE_OWNER'),
      signatureLabelTenant: this.i18n.translate('CONTRACT_EDITOR.SIGNATURE_TENANT'),
      clauses: this.buildLegacyClauses(transaction),
    };

    const draft = this.readStoredDraft(transaction._id ?? '');
    if (!draft) {
      return baseModel;
    }

    return {
      ...baseModel,
      ...draft,
      clauses: Array.isArray(draft.clauses) && draft.clauses.length > 0 ? draft.clauses : baseModel.clauses,
    };
  }

  private buildLegacyClauses(transaction: Transaction): ContractClause[] {
    const startDate = this.formatDate(transaction.timeline?.startDate);
    const endDate = this.formatDate(transaction.timeline?.endDate);
    const rentAmount = transaction.financialDetails?.rentAmount ?? 0;
    const depositAmount = transaction.financialDetails?.depositAmount ?? 0;
    const propertyAddress = transaction.propertyId?.address ?? '';
    const propertyReference = transaction.propertyId?.reference ?? '';
    const utilityNotes = transaction.metadata?.utilityNotes ?? '';

    return [
      {
        id: this.generateClauseId(1),
        title: 'ARTICLE 1 : Objet du contrat',
        body: `Par le present contrat, le bailleur loue au preneur le bien situe a ${propertyAddress} et reference ${propertyReference}. ${this.i18n.translate('CONTRACT_EDITOR.DEFAULT_PROPERTY_DESCRIPTION')}`,
        removable: false
      },
      {
        id: this.generateClauseId(2),
        title: 'ARTICLE 2 : Destination du bien loue',
        body: 'Usage strictement a l habitation. Toute activite professionnelle ou commerciale est interdite sans accord ecrit prealable du bailleur.'
      },
      {
        id: this.generateClauseId(3),
        title: 'ARTICLE 3 : Duree',
        body: `Le present bail est consenti pour une duree de ${this.getDurationLabel(transaction.timeline?.duration)} prenant effet du ${startDate} au ${endDate}.`
      },
      {
        id: this.generateClauseId(4),
        title: 'ARTICLE 4 : Loyer et charges',
        body: `Le loyer est fixe a ${rentAmount} TND, payable ${this.getPaymentFrequencyLabel(transaction.financialDetails?.paymentFrequency).toLowerCase()}. Les charges usuelles liees a l occupation sont a la charge du preneur, sauf dispositions contraires.`
      },
      {
        id: this.generateClauseId(5),
        title: 'ARTICLE 5 : Depot de garantie',
        body: `Le preneur verse un depot de garantie de ${depositAmount} TND. Ce montant ne saurait etre impute sur les loyers et sera restitue apres verification de l etat des lieux et apurement des sommes dues.`
      },
      {
        id: this.generateClauseId(6),
        title: 'ARTICLE 6 : Etat des lieux',
        body: 'Un etat des lieux contradictoire sera etabli a l entree et a la sortie des lieux et signe par les deux parties.'
      },
      {
        id: this.generateClauseId(7),
        title: 'ARTICLE 7 : Obligations des parties',
        body: 'Le bailleur s engage a delivrer un logement en bon etat et a garantir une jouissance paisible. Le preneur s engage a payer le loyer et les charges aux echeances convenues, a entretenir le bien et a signaler tout incident sans delai.'
      },
      {
        id: this.generateClauseId(8),
        title: 'ARTICLE 8 : Conditions particulieres',
        body: utilityNotes || 'Aucune condition particuliere supplementaire n est prevue au jour de la signature.'
      },
      {
        id: this.generateClauseId(9),
        title: 'ARTICLE 9 : Resiliation du bail',
        body: 'Toute resiliation anticipee devra respecter un preavis ecrit de deux mois sauf manquement grave justifiant la resolution immediate dans les conditions legales applicables.'
      },
      {
        id: this.generateClauseId(10),
        title: 'ARTICLE 10 : Election de domicile et juridiction competente',
        body: 'Pour l execution des presentes, les parties elisent domicile a leurs adresses respectives. Tout litige relevera de la competence des juridictions territorialement competentes.'
      }
    ];
  }

  private buildTenantDetails(transaction: Transaction | null): string {
    if (!transaction?.personnelId) {
      return '';
    }

    const details = [
      transaction.personnelId?.phone,
      transaction.personnelId?.email
    ].filter(Boolean);

    return details.join(' | ');
  }

  private getDurationLabel(duration?: number): string {
    if (!duration) {
      return '';
    }

    return `${duration} mois`;
  }

  private formatDate(value: string | Date | undefined | null): string {
    if (!value) {
      return '';
    }

    return this.datePipe.transform(value, 'yyyy-MM-dd') ?? '';
  }

  private getPaymentFrequencyLabel(paymentFrequency?: string): string {
    switch (paymentFrequency) {
      case 'DAILY':
        return 'Quotidien';
      case 'QUARTERLY':
        return 'Trimestriel';
      case 'YEARLY':
        return 'Annuel';
      case 'MONTHLY':
      default:
        return 'Mensuel';
    }
  }

  private generateClauseId(seed: number): string {
    return `clause-${seed}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private getDraftStorageKey(transactionId: string): string {
    return `contract-draft:${transactionId}`;
  }

  private readStoredDraft(transactionId: string): ContractDocumentModel | null {
    if (!transactionId) {
      return null;
    }

    try {
      const rawDraft = localStorage.getItem(this.getDraftStorageKey(transactionId));
      return rawDraft ? JSON.parse(rawDraft) as ContractDocumentModel : null;
    } catch {
      return null;
    }
  }

  private persistDraft(): void {
    if (!this.transaction?._id || !this.documentModel) {
      return;
    }

    localStorage.setItem(this.getDraftStorageKey(this.transaction._id), JSON.stringify(this.documentModel));
  }

  private sanitizeFileName(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'contract';
  }

  get agencyName(): string {
    return this.agencyProfile?.name || this.i18n.translate('NAVBAR.DEFAULT_AGENCY_NAME');
  }

  get agencyInitials(): string {
    return this.agencyName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  editableText(event: Event): string {
    return ((event.target as HTMLElement).innerText || '').replace(/\u00a0/g, ' ').trim();
  }

  editableMultilineText(event: Event): string {
    return ((event.target as HTMLElement).innerText || '').replace(/\u00a0/g, ' ').trim();
  }

  updateField(field: keyof ContractDocumentModel, value: string | number): void {
    if (!this.documentModel) {
      return;
    }

    this.documentModel = {
      ...this.documentModel,
      [field]: value
    };
    this.persistDraft();
    this.successMessage = null;
    this.error = null;
  }

  updateClause(index: number, field: 'title' | 'body', value: string): void {
    if (!this.documentModel) {
      return;
    }

    const clauses = [...this.documentModel.clauses];
    clauses[index] = {
      ...clauses[index],
      [field]: value
    };

    this.documentModel = {
      ...this.documentModel,
      clauses
    };
    this.persistDraft();
    this.successMessage = null;
    this.error = null;
  }

  addClause(): void {
    if (!this.documentModel) {
      return;
    }

    const clauseNumber = this.documentModel.clauses.length + 1;
    this.documentModel = {
      ...this.documentModel,
      clauses: [
        ...this.documentModel.clauses,
        {
          id: this.generateClauseId(clauseNumber),
          title: `ARTICLE ${clauseNumber} : ${this.i18n.translate('CONTRACT_EDITOR.NEW_CLAUSE_TITLE')}`,
          body: this.i18n.translate('CONTRACT_EDITOR.NEW_CLAUSE_BODY'),
          removable: true
        }
      ]
    };
    this.persistDraft();
    this.successMessage = null;
    this.error = null;
  }

  removeClause(index: number): void {
    if (!this.documentModel) {
      return;
    }

    const targetClause = this.documentModel.clauses[index];
    if (!targetClause?.removable) {
      return;
    }

    this.documentModel = {
      ...this.documentModel,
      clauses: this.documentModel.clauses.filter((_, clauseIndex) => clauseIndex !== index)
    };
    this.persistDraft();
    this.successMessage = null;
    this.error = null;
  }

  saveContract(): void {
    this.isSaving.set(true);
    this.persistDraft();
    this.successMessage = this.i18n.translate('CONTRACT_EDITOR.SAVE_SUCCESS');
    this.error = null;
    this.isSaving.set(false);
  }

  printContract(): void {
    if (!this.documentModel) {
      return;
    }

    this.isPrinting.set(true);
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      this.error = this.i18n.translate('CONTRACT_EDITOR.PRINT_FAILED');
      this.isPrinting.set(false);
      return;
    }

    printWindow.document.open();
    printWindow.document.write(this.buildStandaloneContractHtml());
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      this.isPrinting.set(false);
    }, 250);
  }

  downloadContract(): void {
    if (!this.documentModel) {
      return;
    }

    this.isDownloading.set(true);
    const html = this.buildStandaloneContractHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${this.sanitizeFileName(this.documentModel.title)}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    this.isDownloading.set(false);
  }

  private buildStandaloneContractHtml(): string {
    const model = this.documentModel!;
    const logoMarkup = this.agencyProfile?.logo
      ? `<img src="${this.escapeHtml(this.agencyProfile.logo)}" alt="${this.escapeHtml(this.agencyName)}" class="brand-logo-image" />`
      : `<div class="brand-logo-fallback">${this.escapeHtml(this.agencyInitials)}</div>`;

    const clausesMarkup = model.clauses.map((clause) => `
      <section class="clause-block">
        <h3>${this.escapeHtml(clause.title)}</h3>
        ${this.escapeParagraphs(clause.body)}
      </section>
    `).join('');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHtml(model.title)}</title>
  <style>
    body {
      margin: 0;
      background: #f3f4f6;
      color: #111111;
      font-family: Arial, Helvetica, sans-serif;
    }
    .page {
      max-width: 900px;
      margin: 24px auto;
      background: #ffffff;
      border: 1px solid #d1d5db;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      padding: 48px;
    }
    .header {
      text-align: center;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 24px;
    }
    .brand-logo-image, .brand-logo-fallback {
      width: 96px;
      height: 96px;
      margin: 0 auto 12px;
      border: 1px solid #d1d5db;
      object-fit: contain;
      display: block;
      background: #ffffff;
    }
    .brand-logo-fallback {
      display: grid;
      place-items: center;
      font-size: 24px;
      font-weight: 700;
    }
    .agency-name {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
    }
    .agency-subtitle {
      margin: 6px 0 0;
      color: #4b5563;
      font-size: 14px;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px 24px;
      margin-top: 24px;
    }
    .meta-row {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
      font-size: 14px;
    }
    .meta-label {
      font-weight: 700;
      text-transform: uppercase;
      color: #374151;
      font-size: 12px;
      margin-right: 8px;
    }
    .title {
      text-align: center;
      margin: 32px 0 24px;
      font-size: 40px;
      line-height: 1.2;
      text-transform: uppercase;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .box {
      border: 1px solid #d1d5db;
      padding: 16px;
      margin-bottom: 16px;
    }
    .label {
      margin: 0 0 10px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 12px;
      font-weight: 700;
    }
    .value {
      margin: 0;
      line-height: 1.7;
    }
    .four-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .clause-block {
      border: 1px solid #d1d5db;
      padding: 18px;
      margin-bottom: 16px;
    }
    .clause-block h3 {
      margin: 0 0 12px;
      font-size: 16px;
      text-transform: uppercase;
    }
    .clause-block p {
      margin: 0 0 10px;
      line-height: 1.7;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 32px;
      margin-top: 32px;
    }
    .signature-card {
      padding-top: 40px;
    }
    .signature-line {
      display: block;
      border-bottom: 1px solid #111111;
      margin-top: 48px;
    }
    @media print {
      body {
        background: #ffffff;
      }
      .page {
        margin: 0;
        box-shadow: none;
        border: none;
        max-width: none;
      }
    }
  </style>
</head>
<body>
  <article class="page">
    <header class="header">
      ${logoMarkup}
      <p class="agency-name">${this.escapeHtml(this.agencyName)}</p>
      <p class="agency-subtitle">${this.escapeHtml(this.i18n.translate('CONTRACT_EDITOR.PROFESSIONAL_LEASE'))}</p>
      <div class="meta">
        <div class="meta-row"><span class="meta-label">${this.escapeHtml(this.i18n.translate('CONTRACT_EDITOR.PREVIEW_META'))}</span>${this.escapeHtml(model.contractDate)}</div>
        <div class="meta-row"><span class="meta-label">${this.escapeHtml(this.i18n.translate('CONTRACT_EDITOR.CITY_LABEL'))}</span>${this.escapeHtml(model.city)}</div>
      </div>
    </header>

    <h1 class="title">${this.escapeHtml(model.title)}</h1>

    <section class="grid">
      <div class="box">
        <p class="label">${this.escapeHtml(this.i18n.translate('CONTRACT_EDITOR.LANDLORD_NAME'))}</p>
        <p class="value"><strong>${this.escapeHtml(model.landlordName)}</strong></p>
        ${this.escapeParagraphs(model.landlordDetails)}
      </div>
      <div class="box">
        <p class="label">${this.escapeHtml(this.i18n.translate('CONTRACT_EDITOR.TENANT_NAME'))}</p>
        <p class="value"><strong>${this.escapeHtml(model.tenantName)}</strong></p>
        ${this.escapeParagraphs(model.tenantDetails)}
      </div>
    </section>

    <section class="four-grid">
      <div class="box"><p class="label">${this.escapeHtml(this.i18n.translate('TRANSACTION_DETAIL.PROPERTY_REFERENCE'))}</p><p class="value">${this.escapeHtml(model.propertyReference)}</p></div>
      <div class="box"><p class="label">${this.escapeHtml(this.i18n.translate('PROPERTY_FORM.ADDRESS'))}</p><p class="value">${this.escapeHtml(model.propertyAddress)}</p></div>
      <div class="box"><p class="label">${this.escapeHtml(this.i18n.translate('TRANSACTION_FORM.RENT_AMOUNT'))}</p><p class="value">${this.escapeHtml(String(model.rentAmount))}</p></div>
      <div class="box"><p class="label">${this.escapeHtml(this.i18n.translate('TRANSACTION_FORM.DEPOSIT_AMOUNT'))}</p><p class="value">${this.escapeHtml(String(model.depositAmount))}</p></div>
      <div class="box"><p class="label">${this.escapeHtml(this.i18n.translate('TRANSACTION_FORM.START_DATE'))}</p><p class="value">${this.escapeHtml(model.startDate)}</p></div>
      <div class="box"><p class="label">${this.escapeHtml(this.i18n.translate('TRANSACTION_FORM.END_DATE'))}</p><p class="value">${this.escapeHtml(model.endDate)}</p></div>
      <div class="box"><p class="label">${this.escapeHtml(this.i18n.translate('TRANSACTION_FORM.DURATION'))}</p><p class="value">${this.escapeHtml(model.duration)}</p></div>
      <div class="box"><p class="label">${this.escapeHtml(this.i18n.translate('TRANSACTION_FORM.PAYMENT_FREQUENCY'))}</p><p class="value">${this.escapeHtml(model.paymentFrequency)}</p></div>
    </section>

    <section class="box">
      <p class="label">${this.escapeHtml(this.i18n.translate('CONTRACT_EDITOR.PROPERTY_DESCRIPTION'))}</p>
      ${this.escapeParagraphs(model.propertyDescription)}
    </section>

    ${clausesMarkup}

    <section class="box">
      <p class="label">${this.escapeHtml(this.i18n.translate('CONTRACT_EDITOR.CLOSING_SECTION'))}</p>
      ${this.escapeParagraphs(model.closingStatement)}
    </section>

    <section class="signature-grid">
      <div class="signature-card">
        <p>${this.escapeHtml(model.signatureLabelOwner)}</p>
        <span class="signature-line"></span>
      </div>
      <div class="signature-card">
        <p>${this.escapeHtml(model.signatureLabelTenant)}</p>
        <span class="signature-line"></span>
      </div>
    </section>
  </article>
</body>
</html>`;
  }

  private escapeParagraphs(value: string): string {
    return (value || '')
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => `<p class="value">${this.escapeHtml(line)}</p>`)
      .join('') || '<p class="value"></p>';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  backToTransaction(): void {
    const transactionId = this.transaction?._id;

    if (!transactionId) {
      this.router.navigate(['/dashboard/transactions']);
      return;
    }

    this.router.navigate(['/dashboard/transactions', transactionId]);
  }
}
