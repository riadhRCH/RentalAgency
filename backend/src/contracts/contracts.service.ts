import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { promises as fs } from 'fs';
import * as path from 'path';
import PizZip from 'pizzip';
import { Contract, ContractDocument } from '../schemas/contract.schema';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { AgenciesService } from '../agencies/agencies.service';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    private transactionsService: TransactionsService,
    private agenciesService: AgenciesService,
  ) {}

  async create(agencyId: string, createContractDto: CreateContractDto): Promise<ContractDocument> {
    const transaction = await this.transactionsService.findOne(createContractDto.transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const contract = new this.contractModel({
      ...createContractDto,
      agencyId: new Types.ObjectId(agencyId),
      transactionId: new Types.ObjectId(createContractDto.transactionId),
      title: createContractDto.title || `Contract for Transaction ${createContractDto.transactionId}`,
    });

    const savedContract = await contract.save();

    await this.transactionsService.update(createContractDto.transactionId, {
      metadata: {
        ...transaction.metadata,
        contracts: [...(transaction.metadata.contracts || []), savedContract._id.toString()],
      },
    });

    return savedContract;
  }

  async findAll(agencyId: string): Promise<ContractDocument[]> {
    return this.contractModel
      .find({ agencyId: new Types.ObjectId(agencyId) })
      .populate('transactionId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<ContractDocument> {
    const contract = await this.contractModel
      .findById(id)
      .populate('transactionId')
      .exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async update(id: string, updateContractDto: UpdateContractDto): Promise<ContractDocument> {
    const updatedContract = await this.contractModel
      .findByIdAndUpdate(id, updateContractDto, { new: true })
      .exec();

    if (!updatedContract) {
      throw new NotFoundException('Contract not found');
    }

    return updatedContract;
  }

  async delete(id: string): Promise<void> {
    const result = await this.contractModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Contract not found');
    }
  }

  async generateContract(id: string): Promise<ContractDocument> {
    const contract = await this.findOne(id);
    const transaction = await this.transactionsService.findOne(contract.transactionId.toString());
    const agency = await this.agenciesService.getProfile(contract.agencyId.toString());

    const templatePath = await this.resolveTemplatePath();
    const templateBinary = await fs.readFile(templatePath, 'binary');
    const zip = new PizZip(templateBinary);
    const generatedXml = this.buildDocumentXml(contract, agency.name);

    zip.file('word/document.xml', generatedXml);

    const outputDir = path.resolve(process.cwd(), 'generated-contracts');
    await fs.mkdir(outputDir, { recursive: true });

    const safeTitle = (contract.title || 'contract')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const fileName = `${safeTitle || 'contract'}-${contract._id}.docx`;
    const absolutePath = path.join(outputDir, fileName);

    await fs.writeFile(absolutePath, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));

    const updatedContract = await this.contractModel.findByIdAndUpdate(
      id,
      {
        generatedFileUrl: `/contracts/${id}/download`,
        metadata: {
          ...(contract.metadata || {}),
          templateName: 'Contrat_Location.docx',
          templatePath,
          generatedAt: new Date().toISOString(),
          generatedForTransactionId: transaction._id.toString(),
          agencyName: agency.name,
          generatedFileName: fileName,
          generatedFilePath: absolutePath,
        },
      },
      { new: true },
    ).exec();

    if (!updatedContract) {
      throw new NotFoundException('Contract not found');
    }

    return updatedContract;
  }

  async getGeneratedFileInfo(id: string): Promise<{ path: string; fileName: string }> {
    const contract = await this.findOne(id);
    const generatedFilePath = contract.metadata?.generatedFilePath;
    const generatedFileName = contract.metadata?.generatedFileName;

    if (!generatedFilePath || !generatedFileName) {
      throw new NotFoundException('Generated contract file not found');
    }

    return {
      path: generatedFilePath,
      fileName: generatedFileName,
    };
  }

  private async resolveTemplatePath(): Promise<string> {
    const candidates = [
      path.resolve(process.cwd(), '..', 'Contrat_Location.docx'),
      path.resolve(process.cwd(), 'Contrat_Location.docx'),
    ];

    for (const candidate of candidates) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }

    throw new NotFoundException('Contract template not found');
  }

  private buildDocumentXml(contract: ContractDocument, agencyName: string): string {
    const content = contract.content || {};
    const title = this.escapeXml(contract.title || 'CONTRAT DE LOCATION');
    const contractDate = this.escapeXml(this.readString(content, 'contractDate', ''));
    const city = this.escapeXml(this.readString(content, 'city', 'Tunis'));
    const landlordName = this.escapeXml(this.readString(content, 'landlordName', ''));
    const landlordDetails = this.escapeXml(this.readString(content, 'landlordDetails', ''));
    const tenantName = this.escapeXml(this.readString(content, 'tenantName', ''));
    const tenantDetails = this.escapeXml(this.readString(content, 'tenantDetails', ''));
    const propertyReference = this.escapeXml(this.readString(content, 'propertyReference', ''));
    const propertyAddress = this.escapeXml(this.readString(content, 'propertyAddress', ''));
    const propertyDescription = this.escapeXml(this.readString(content, 'propertyDescription', ''));
    const rentAmount = this.escapeXml(String(this.readNumber(content, 'rentAmount', 0)));
    const depositAmount = this.escapeXml(String(this.readNumber(content, 'depositAmount', 0)));
    const paymentFrequency = this.escapeXml(this.readString(content, 'paymentFrequency', ''));
    const startDate = this.escapeXml(this.readString(content, 'startDate', ''));
    const endDate = this.escapeXml(this.readString(content, 'endDate', ''));
    const duration = this.escapeXml(this.readString(content, 'duration', ''));
    const closingStatement = this.escapeXml(this.readString(content, 'closingStatement', ''));
    const signatureOwner = this.escapeXml(this.readString(content, 'signatureLabelOwner', 'Signature du bailleur'));
    const signatureTenant = this.escapeXml(this.readString(content, 'signatureLabelTenant', 'Signature du preneur'));
    const clauses = this.readClauses(content);

    const paragraphBlocks = [
      this.headingParagraph(title),
      this.normalParagraph(this.escapeXml(agencyName)),
      this.spacerParagraph(),
      this.normalParagraph('ENTRE LES SOUSSIGNES :'),
      this.normalParagraph(`Le bailleur : ${landlordName}`),
      this.normalParagraph(landlordDetails),
      this.spacerParagraph(),
      this.normalParagraph(`Le preneur : ${tenantName}`),
      this.normalParagraph(tenantDetails),
      this.spacerParagraph(),
      this.normalParagraph(`Bien concerne : ${propertyAddress} (${propertyReference})`),
      this.normalParagraph(propertyDescription),
      this.normalParagraph(`Loyer : ${rentAmount} TND | Depot : ${depositAmount} TND | Frequence : ${paymentFrequency}`),
      this.normalParagraph(`Periode contractuelle : ${startDate} au ${endDate} | Duree : ${duration}`),
      this.spacerParagraph(),
      ...clauses.flatMap((clause) => [
        this.articleParagraph(this.escapeXml(clause.title)),
        ...this.multilineParagraphs(this.escapeXml(clause.body)),
        this.spacerParagraph(),
      ]),
      this.normalParagraph(`Fait a ${city}, le ${contractDate}.`),
      this.normalParagraph(closingStatement),
      this.spacerParagraph(),
      this.normalParagraph(`${signatureOwner} _______________________________`),
      this.spacerParagraph(),
      this.normalParagraph(`${signatureTenant} _______________________________`),
    ].join('');

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mo="http://schemas.microsoft.com/office/mac/office/2008/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:mv="urn:schemas-microsoft-com:mac:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14">
  <w:body>
    ${paragraphBlocks}
    <w:sectPr w:rsidR="00FC693F" w:rsidRPr="0006063C" w:rsidSect="00034616">
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1800" w:bottom="1440" w:left="1800" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;
  }

  private readClauses(content: Record<string, any>): Array<{ title: string; body: string }> {
    const clauses = content['clauses'];

    if (Array.isArray(clauses) && clauses.length > 0) {
      return clauses.map((clause) => ({
        title: this.readString(clause, 'title', ''),
        body: this.readString(clause, 'body', ''),
      }));
    }

    return [];
  }

  private readString(source: Record<string, any>, key: string, fallback: string): string {
    const value = source?.[key];
    return typeof value === 'string' ? value : fallback;
  }

  private readNumber(source: Record<string, any>, key: string, fallback: number): number {
    const value = source?.[key];
    return typeof value === 'number' ? value : fallback;
  }

  private headingParagraph(text: string): string {
    return `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
  }

  private articleParagraph(text: string): string {
    return `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
  }

  private normalParagraph(text: string): string {
    return `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
  }

  private spacerParagraph(): string {
    return `<w:p><w:r><w:br/></w:r></w:p>`;
  }

  private multilineParagraphs(text: string): string[] {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => this.normalParagraph(line));
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
