import { Injectable } from '@angular/core';

export type TransactionStepKey =
  | 'property'
  | 'timeline'
  | 'customer'
  | 'financial'
  | 'documents'
  | 'status';

@Injectable({
  providedIn: 'root'
})
export class TransactionStepsService {
  isStepDone(step: TransactionStepKey, transaction: any, formValue?: any): boolean {
    switch (step) {
      case 'property':
        return !!transaction?.propertyId?.reference && !!transaction?.propertyId?.address;
      case 'timeline':
        if ((formValue?.financialDetails?.paymentFrequency || transaction?.financialDetails?.paymentFrequency) === 'DAILY') {
          return (formValue?.timeline?.selectedDates?.length ?? transaction?.timeline?.selectedDates?.length ?? 0) > 0;
        }
        return !!(formValue?.timeline?.startDate || transaction?.timeline?.startDate)
          && !!(formValue?.timeline?.endDate || transaction?.timeline?.endDate);
      case 'customer':
        return !!(formValue?.customerName || this.getCustomerName(transaction))
          && !!(formValue?.customerPhone || transaction?.personnelId?.phone);
      case 'financial':
        return Number(formValue?.financialDetails?.rentAmount ?? transaction?.financialDetails?.rentAmount ?? 0) > 0
          && !!(formValue?.financialDetails?.paymentFrequency || transaction?.financialDetails?.paymentFrequency);
      case 'documents':
        return !!(formValue?.metadata?.cinNumber || transaction?.metadata?.cinNumber)
          && !!(formValue?.metadata?.numberOfPersons || transaction?.metadata?.numberOfPersons)
          && !!(transaction?.metadata?.documents?.length)
          && !!transaction?.metadata?.paymentProof;
      case 'status':
        return !!(formValue?.status || transaction?.status);
      default:
        return false;
    }
  }

  getFirstUndoneStep(transaction: any, formValue?: any): TransactionStepKey {
    const orderedSteps: TransactionStepKey[] = ['property', 'timeline', 'customer', 'financial', 'documents', 'status'];
    return orderedSteps.find((step) => !this.isStepDone(step, transaction, formValue)) ?? 'status';
  }

  private getCustomerName(transaction: any): string {
    return `${transaction?.personnelId?.firstName || ''} ${transaction?.personnelId?.lastName || ''}`.trim();
  }
}
