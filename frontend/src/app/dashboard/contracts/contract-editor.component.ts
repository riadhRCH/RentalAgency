import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContractsService, Contract } from '../../services/contracts.service';
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
  private readonly contractsService = inject(ContractsService);
  private readonly agencyService = inject(AgencyService);
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly datePipe = inject(DatePipe);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isGenerating = signal(false);

  transaction: Transaction | null = null;
  contract: Contract | null = null;
  contractId: string | null = null;
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
            name: fallbackAgency.name
          };
        }
      }
    });
  }

  private loadTransaction(transactionId: string): void {
    this.transactionsService.findOne(transactionId).subscribe({
      next: (transaction) => {
        this.transaction = transaction;
        this.resolveContract(transaction);
      },
      error: () => {
        this.error = this.i18n.translate('CONTRACT_EDITOR.LOAD_TRANSACTION_FAILED');
        this.isLoading.set(false);
      }
    });
  }

  private resolveContract(transaction: Transaction): void {
    const existingContractId = transaction.metadata?.contracts?.[0];

    if (!existingContractId) {
      this.createContractFromTransaction(transaction);
      return;
    }

    this.contractsService.findOne(existingContractId).subscribe({
      next: (contract) => {
        this.applyContract(contract);
      },
      error: () => {
        this.createContractFromTransaction(transaction);
      }
    });
  }

  private createContractFromTransaction(transaction: Transaction): void {
    const payload = this.buildDefaultContractPayload(transaction);

    this.contractsService.create(payload).subscribe({
      next: (contract) => {
        this.applyContract(contract);
      },
      error: () => {
        this.error = this.i18n.translate('CONTRACT_EDITOR.CREATE_FAILED');
        this.isLoading.set(false);
      }
    });
  }

  private applyContract(contract: Contract): void {
    this.contract = contract;
    this.contractId = contract._id ?? null;
    this.documentModel = this.buildDocumentModel(contract);
    this.isLoading.set(false);
  }

  private buildDocumentModel(contract: Contract): ContractDocumentModel {
    const content = contract.content ?? {};
    const clauses = this.normalizeClauses(content);

    return {
      title: this.asString(contract.title, this.i18n.translate('CONTRACT_EDITOR.DEFAULT_TITLE')),
      contractDate: this.asString(content['contractDate'], this.formatDate(new Date())),
      city: this.asString(content['city'], 'Tunis'),
      landlordName: this.asString(content['landlordName'], ''),
      landlordDetails: this.asString(content['landlordDetails'], ''),
      tenantName: this.asString(content['tenantName'], ''),
      tenantDetails: this.asString(content['tenantDetails'], this.buildTenantDetails(this.transaction)),
      propertyReference: this.asString(content['propertyReference'], this.transaction?.propertyId?.reference ?? ''),
      propertyAddress: this.asString(content['propertyAddress'], this.transaction?.propertyId?.address ?? ''),
      propertyDescription: this.asString(content['propertyDescription'], this.i18n.translate('CONTRACT_EDITOR.DEFAULT_PROPERTY_DESCRIPTION')),
      paymentFrequency: this.asString(content['paymentFrequency'], this.getPaymentFrequencyLabel(this.transaction?.financialDetails?.paymentFrequency)),
      rentAmount: this.asNumber(content['rentAmount'], this.transaction?.financialDetails?.rentAmount ?? 0),
      depositAmount: this.asNumber(content['depositAmount'], this.transaction?.financialDetails?.depositAmount ?? 0),
      startDate: this.asString(content['startDate'], this.formatDate(this.transaction?.timeline?.startDate)),
      endDate: this.asString(content['endDate'], this.formatDate(this.transaction?.timeline?.endDate)),
      duration: this.asString(content['duration'], this.getDurationLabel(this.transaction?.timeline?.duration)),
      closingStatement: this.asString(content['closingStatement'], this.i18n.translate('CONTRACT_EDITOR.DEFAULT_CLOSING')),
      signatureLabelOwner: this.asString(content['signatureLabelOwner'], this.i18n.translate('CONTRACT_EDITOR.SIGNATURE_OWNER')),
      signatureLabelTenant: this.asString(content['signatureLabelTenant'], this.i18n.translate('CONTRACT_EDITOR.SIGNATURE_TENANT')),
      clauses
    };
  }

  private normalizeClauses(content: Record<string, any>): ContractClause[] {
    const rawClauses = content['clauses'];

    if (Array.isArray(rawClauses) && rawClauses.length > 0) {
      return rawClauses.map((clause: any, index: number) => ({
        id: this.asString(clause?.id, this.generateClauseId(index)),
        title: this.asString(clause?.title, `${this.i18n.translate('CONTRACT_EDITOR.CLAUSE')} ${index + 1}`),
        body: this.asString(clause?.body, ''),
        removable: clause?.removable !== false
      }));
    }

    return this.buildLegacyClauses(content);
  }

  private buildLegacyClauses(content: Record<string, any>): ContractClause[] {
    const startDate = this.formatDate(this.transaction?.timeline?.startDate);
    const endDate = this.formatDate(this.transaction?.timeline?.endDate);
    const rentAmount = this.transaction?.financialDetails?.rentAmount ?? 0;
    const depositAmount = this.transaction?.financialDetails?.depositAmount ?? 0;
    const propertyAddress = this.transaction?.propertyId?.address ?? '';
    const propertyReference = this.transaction?.propertyId?.reference ?? '';
    const utilityNotes = this.transaction?.metadata?.utilityNotes ?? '';

    return [
      {
        id: this.generateClauseId(1),
        title: 'ARTICLE 1 : Objet du contrat',
        body: this.asString(
          content['propertyClause'],
          `Par le present contrat, le bailleur loue au preneur le bien situe a ${propertyAddress} et reference ${propertyReference}. ${this.i18n.translate('CONTRACT_EDITOR.DEFAULT_PROPERTY_DESCRIPTION')}`
        ),
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
        body: `Le present bail est consenti pour une duree de ${this.getDurationLabel(this.transaction?.timeline?.duration)} prenant effet du ${startDate} au ${endDate}.`
      },
      {
        id: this.generateClauseId(4),
        title: 'ARTICLE 4 : Loyer et charges',
        body: this.asString(
          content['financialClause'],
          `Le loyer est fixe a ${rentAmount} TND, payable ${this.getPaymentFrequencyLabel(this.transaction?.financialDetails?.paymentFrequency).toLowerCase()}. Les charges usuelles liees a l occupation sont a la charge du preneur, sauf dispositions contraires.`
        )
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
        body: this.asString(
          content['obligationsClause'],
          'Le bailleur s engage a delivrer un logement en bon etat et a garantir une jouissance paisible. Le preneur s engage a payer le loyer et les charges aux echeances convenues, a entretenir le bien et a signaler tout incident sans delai.'
        )
      },
      {
        id: this.generateClauseId(8),
        title: 'ARTICLE 8 : Conditions particulieres',
        body: this.asString(content['specialConditions'], utilityNotes || 'Aucune condition particuliere supplementaire n est prevue au jour de la signature.')
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

  private buildDefaultContractPayload(transaction: Transaction) {
    const tenantName = `${transaction.personnelId?.firstName ?? ''} ${transaction.personnelId?.lastName ?? ''}`.trim();
    const payloadModel = this.buildDocumentModel({
      title: `Contrat de location - ${transaction.propertyId?.reference ?? transaction._id}`,
      transactionId: transaction._id!,
      content: {
        contractDate: this.formatDate(new Date()),
        city: 'Tunis',
        landlordName: '',
        landlordDetails: '',
        tenantName,
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
        signatureLabelTenant: this.i18n.translate('CONTRACT_EDITOR.SIGNATURE_TENANT')
      }
    } as Contract);

    return {
      transactionId: transaction._id!,
      title: payloadModel.title,
      content: this.serializeDocumentModel(payloadModel)
    };
  }

  private serializeDocumentModel(model: ContractDocumentModel): Record<string, any> {
    return {
      contractDate: model.contractDate,
      city: model.city,
      landlordName: model.landlordName,
      landlordDetails: model.landlordDetails,
      tenantName: model.tenantName,
      tenantDetails: model.tenantDetails,
      propertyReference: model.propertyReference,
      propertyAddress: model.propertyAddress,
      propertyDescription: model.propertyDescription,
      paymentFrequency: model.paymentFrequency,
      rentAmount: model.rentAmount,
      depositAmount: model.depositAmount,
      startDate: model.startDate,
      endDate: model.endDate,
      duration: model.duration,
      closingStatement: model.closingStatement,
      signatureLabelOwner: model.signatureLabelOwner,
      signatureLabelTenant: model.signatureLabelTenant,
      clauses: model.clauses.map((clause) => ({
        id: clause.id,
        title: clause.title,
        body: clause.body,
        removable: clause.removable !== false
      })),
      templateName: 'Contrat_Location.docx'
    };
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

  private asString(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
  }

  private asNumber(value: unknown, fallback = 0): number {
    return typeof value === 'number' ? value : fallback;
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
    this.successMessage = null;
    this.error = null;
  }

  saveContract(): void {
    if (!this.contractId || !this.documentModel) {
      return;
    }

    this.isSaving.set(true);
    this.successMessage = null;
    this.error = null;

    this.contractsService.update(this.contractId, {
      title: this.documentModel.title,
      content: this.serializeDocumentModel(this.documentModel),
      metadata: {
        templateName: 'Contrat_Location.docx',
        editorMode: 'inline-preview'
      }
    }).subscribe({
      next: (contract) => {
        this.contract = contract;
        this.documentModel = this.buildDocumentModel(contract);
        this.successMessage = this.i18n.translate('CONTRACT_EDITOR.SAVE_SUCCESS');
        this.isSaving.set(false);
      },
      error: () => {
        this.error = this.i18n.translate('CONTRACT_EDITOR.SAVE_FAILED');
        this.isSaving.set(false);
      }
    });
  }

  generateContract(): void {
    if (!this.contractId) {
      return;
    }

    this.isGenerating.set(true);
    this.successMessage = null;
    this.error = null;

    this.contractsService.generate(this.contractId).subscribe({
      next: (contract) => {
        this.contract = contract;
        this.successMessage = this.i18n.translate('CONTRACT_EDITOR.GENERATE_SUCCESS');
        this.isGenerating.set(false);
      },
      error: () => {
        this.error = this.i18n.translate('CONTRACT_EDITOR.GENERATE_FAILED');
        this.isGenerating.set(false);
      }
    });
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
