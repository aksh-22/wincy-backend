import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { ConfigService } from 'src/config/config.service';
import { ProjectsService } from 'src/projects/projects.service';
import { SystemService } from 'src/system/system.service';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel('Invoice') private readonly invoiceModel: Model<any>,
    @InjectModel('PendingInvoice')
    private readonly pendingInvoiceModel: Model<any>,
    @InjectModel('Transaction') private readonly transactionModel: Model<any>,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    // @InjectModel('Project') private readonly projectModel: Model<any>,
    private readonly utilsService: UtilsService,
    private readonly systemService: SystemService, // private readonly projectsService: ProjectsService,
  ) {}

  async createInvoice(user, orgId, projectId, dto) {
    try {
      dto.paidAmount = this.utilsService.encryptData('0');
      dto.currency =
        dto.currency !== undefined
          ? this.utilsService.encryptData(dto.currency)
          : undefined;
      dto.billTo =
        dto.billTo !== undefined
          ? this.utilsService.encryptData(dto.billTo)
          : undefined;
      dto.raisedOn =
        dto.raisedOn !== undefined ? new Date(dto.raisedOn) : undefined;
      dto.dueDate =
        dto.dueDate !== undefined ? new Date(dto.dueDate) : undefined;
      // dto.settledOn = dto.settledOn !== undefined ? new Date(dto.settledOn) : undefined;
      dto.project = projectId;
      dto.organisation = orgId;
      dto.createdBy = user._id;
      dto.totalTaxes = 0;
      if (dto.taxes && dto.services.length > 0) {
        for (const ele of dto.taxes) {
          dto.totalTaxes += parseFloat(ele.taxedAmount);
          ele.taxName = ele.taxName
            ? this.utilsService.encryptData(ele.taxName)
            : this.utilsService.encryptData('Tax');
          ele.taxedAmount = ele.taxedAmount
            ? this.utilsService.encryptData(String(ele.taxedAmount))
            : this.utilsService.encryptData('0');
        }
      }
      dto.totalTaxes = this.utilsService.encryptData(String(dto.totalTaxes));
      dto.basicAmount = 0;
      dto.paymentPhaseIds = [];
      if (dto.services && dto.services.length > 0) {
        for (const ele of dto.services) {
          // ele.amount = parseFloat(ele.quantity) * parseFloat(ele.rate);
          dto.basicAmount += parseFloat(ele.amount);
          // ele.rate = this.utilsService.encryptData(String(ele.rate));
          // ele.quantity = this.utilsService.encryptData(String(ele.quantity));
          ele.amount = this.utilsService.encryptData(String(ele.amount));
          dto.paymentPhaseIds.push(ele.paymentPhaseId);
          // ele.description = this.utilsService.encryptData(ele.description);
        }
      }
      dto.basicAmount = this.utilsService.encryptData(String(dto.basicAmount));

      dto.discountName =
        dto.discountName !== undefined
          ? this.utilsService.encryptData(dto.discountName)
          : this.utilsService.encryptData('Discount');
      dto.discountedAmount =
        dto.discountedAmount !== undefined
          ? this.utilsService.encryptData(String(dto.discountedAmount))
          : this.utilsService.encryptData('0');
      dto.discount = {
        discountName: dto.discountName,
        discountedAmount: dto.discountedAmount,
      };

      dto.finalAmount =
        parseFloat(this.utilsService.decryptData(dto.basicAmount)) +
        parseFloat(this.utilsService.decryptData(dto.totalTaxes)) -
        parseFloat(
          this.utilsService.decryptData(dto.discount.discountedAmount),
        );
      dto.finalAmount = this.utilsService.encryptData(String(dto.finalAmount));
      dto.noteForClient =
        dto.noteForClient !== undefined
          ? this.utilsService.encryptData(dto.noteForClient)
          : undefined;
      dto.paymentTerms =
        dto.paymentTerms !== undefined
          ? this.utilsService.encryptData(dto.paymentTerms)
          : undefined;
      // const [x, y, yearArr, numArr] = dto.sNo.split('/');
      // const serialSequence = parseInt(
      //   `${yearArr.split('-').join('')}${numArr}`,
      // );
      // dto.serialSequence = serialSequence;

      const serialSequence = dto.sNo.split('/');
      dto.serialSequence = parseInt(serialSequence[serialSequence.length - 1]);

      let invoice = new this.invoiceModel(dto);

      invoice = await invoice.save();

      // Updating the payment phase
      await this.projectsService.updatePaymentPhaseDueAmount(dto.services);

      invoice = await this.utilsService.decryptInvoiceData(invoice);

      // this.clearRaisedInvoice(projectId, paymentPhaseId);

      return {
        data: { invoice },
        success: true,
        message: 'Invoice created successfully.',
      };
    } catch (error) {
      console.error('Error in : createInvoice', error);
    }
  }

  async updateInvoice(user, orgId, projectId, invoiceId, dto) {
    let invoice = await this.invoiceModel
      .findOne({ _id: invoiceId, project: projectId, organisation: orgId })
      .exec();
    if (!invoice) {
      throw new HttpException(
        'No such invoice exists!',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.taxes && dto.taxes.length > 0) {
      dto.totalTaxes = 0;
      for (const ele of dto.taxes) {
        dto.totalTaxes += parseFloat(ele.taxedAmount);
        ele.taxName = ele.taxName
          ? this.utilsService.encryptData(ele.taxName)
          : this.utilsService.encryptData('Tax');
        ele.taxedAmount = ele.taxedAmount
          ? this.utilsService.encryptData(String(ele.taxedAmount))
          : this.utilsService.encryptData('0');
      }
      invoice.taxes = dto.taxes;
      invoice.totalTaxes = this.utilsService.encryptData(
        String(dto.totalTaxes),
      );
    }

    if (dto.services && dto.services.length > 0) {
      dto.basicAmount = 0;
      dto.paymentPhaseIds = [];
      for (const ele of dto.services) {
        // ele.amount = ele.quantity * ele.rate;
        // dto.basicAmount += ele.amount;
        dto.basicAmount += parseFloat(ele.amount);
        // ele.rate = this.utilsService.encryptData(String(ele.rate));
        // ele.quantity = this.utilsService.encryptData(String(ele.quantity));
        // ele.amount = this.utilsService.encryptData(String(ele.amount));
        // ele.description = this.utilsService.encryptData(ele.description);
        ele.amount = this.utilsService.encryptData(String(ele.amount));
        dto.paymentPhaseIds.push(ele.paymentPhaseId);
      }
      invoice.services = dto.services;
      invoice.basicAmount =
        dto.basicAmount !== undefined
          ? this.utilsService.encryptData(String(dto.basicAmount))
          : invoice.Amount;
    }

    if (dto.discountedAmount !== undefined) {
      dto.discountName =
        dto.discountName !== undefined
          ? this.utilsService.encryptData(dto.discountName)
          : this.utilsService.encryptData('Discount');

      invoice.discount = {
        discountName: dto.discountName,
        discountedAmount: this.utilsService.encryptData(
          String(dto.discountedAmount),
        ),
      };
    }

    if (
      dto.discountedAmount !== undefined ||
      (dto.services && dto.services.length > 0) ||
      (dto.taxes && dto.services.length > 0)
    ) {
      dto.finalAmount =
        parseFloat(this.utilsService.decryptData(invoice.basicAmount)) +
        parseFloat(this.utilsService.decryptData(invoice.totalTaxes)) -
        parseFloat(
          this.utilsService.decryptData(invoice.discount.discountedAmount),
        );
      invoice.finalAmount = this.utilsService.encryptData(
        String(dto.finalAmount),
      );
    }

    invoice.sNo = dto.sNo !== undefined ? dto.sNo : invoice.sNo;
    invoice.status = dto.status !== undefined ? dto.status : invoice.status;
    // invoice.paymentPhase =
    //   dto.paymentPhaseId !== undefined
    //     ? dto.paymentPhaseId
    //     : invoice.paymentPhase;
    // invoice.paidAmount = dto.paidAmount !== undefined ? this.utilsService.encryptData(String(dto.paidAmount)) : invoice.paidAmount;
    invoice.currency =
      dto.currency !== undefined
        ? this.utilsService.encryptData(dto.currency)
        : invoice.currency;
    invoice.billTo =
      dto.billTo !== undefined
        ? this.utilsService.encryptData(dto.billTo)
        : invoice.currency;
    invoice.noteForClient =
      dto.noteForClient !== undefined
        ? this.utilsService.encryptData(dto.noteForClient)
        : invoice.noteForClient;
    invoice.currency =
      dto.currency !== undefined
        ? this.utilsService.encryptData(dto.currency)
        : invoice.currency;
    invoice.raisedOn =
      dto.raisedOn !== undefined ? new Date(dto.raisedOn) : invoice.raisedOn;
    invoice.dueDate =
      dto.dueDate !== undefined ? new Date(dto.dueDate) : invoice.dueDate;
    // invoice.settledOn = dto.settledOn !== undefined ? new Date(dto.settledOn) : invoice.settledOn;

    invoice.lastUpdatedBy = user._id;

    invoice = await invoice.save({ new: true });

    await this.projectsService.updatePaymentPhaseDueAmount(dto.services);

    invoice = await this.utilsService.decryptInvoiceData(invoice);

    return {
      data: { invoice },
      success: true,
      message: 'Invoice updated successfully.',
    };
  }

  async deleteInvoice(user, orgId, projectId, invoiceId) {
    const invoice = await this.invoiceModel.findById(invoiceId);
    // .populate('services.paymentPhaseId');

    // await this.projectsService.updatePaymentPhaseDueAmount(
    //   invoice.services,
    //   'ADD',
    // );

    await this.transactionModel.find({ invoice: invoiceId }).exec();
    //----------
    // const transactions = await this.getTransactionsApp(
    //   { invoice: invoiceId, project: projectId },
    //   {},
    // );
    // console.log('transactions', JSON.stringify(transactions, null, 2));
    // if (transactions.length > 0) {
    //   throw new HttpException(
    //     'You can not delete invoice with existing transactions!',
    //     HttpStatus.BAD_REQUEST,
    //   );
    // }
    //-------------

    await this.deleteInvoiceTransaction(projectId, invoiceId);

    const deleted = await this.invoiceModel
      .deleteOne({ _id: invoiceId, project: projectId })
      .exec();
    if (deleted.n === 0) {
      throw new HttpException(
        'Invoice did not get deleted!',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      // data: { deleted },
      success: true,
      message: 'Invoice got deleted successfully.',
    };
  }

  async deleteInvoiceTransaction(projectId, invoiceId) {
    const deleted = await this.transactionModel
      .deleteMany({
        invoice: invoiceId,
        project: projectId,
      })
      .exec();
    return deleted;
  }

  async deleteTransaction(projectId, invoiceId, transactionId) {
    const deleted = await this.transactionModel
      .deleteOne({
        _id: transactionId,
        invoice: invoiceId,
        project: projectId,
      })
      .exec();
    if (deleted.n === 0) {
      throw new HttpException(
        'Transaction did not get deleted!',
        HttpStatus.BAD_REQUEST,
      );
    }
    return {
      data: null,
      success: true,
      message: 'Transaction got deleted successfully.',
    };
  }

  async deleteAllTransaction(orgId, projectId, transactionId) {
    const data = { orgId, projectId, transactionId };
    return data;
  }

  async getAllInvoices(args: any, projection?: any, populate?: any) {
    return await this.invoiceModel.find(args, projection).populate(populate);
  }

  async invoiceAggregate(args: any) {
    return await this.invoiceModel.aggregate(args);
  }

  async getInvoicesNumber(orgId: string, subsiduaryId: string, user: any) {
    let query = {
      organisation: orgId,
      subsiduary: subsiduaryId,
    };
    const invoices = await this.invoiceModel.distinct('sNo', query);
    return invoices;
  }

  async getInvoices(
    orgId,
    subsiduaryId,
    projectId,
    financialYear,
    month,
    user,
    status,
  ) {
    let filter: any = {
      organisation: orgId,
    };

    if (subsiduaryId) {
      filter['subsiduary'] = subsiduaryId;
    }
    if (status) {
      filter['status'] = status;
    }
    if (projectId) {
      filter['project'] = projectId;
    }
    if (financialYear) {
      filter['sNo'] = { $regex: '/' + financialYear + '/' };
    }
    if (month >= 0) {
      if (!financialYear) {
        filter = { ...filter, $expr: { $eq: [{ $month: '$createdAt' }, 2] } };
      } else {
        const [i, f] = financialYear.split('-');

        let selectedYear = Number(
          String(new Date().getFullYear()).substring(0, 2) +
            (month < 4 ? f : i),
        );

        var startDate = moment([selectedYear, month]).toDate();
        const endDate = moment({ month, year: selectedYear })
          .endOf('month')
          .toDate();

        filter['createdAt'] = { $gt: startDate, $lte: endDate };
      }
    }

    let invoices = await this.invoiceModel
      .find(filter)
      .sort({ serialSequence: 1 })
      .select({
        sNo: 1,
        dueDate: 1,
        currency: 1,
        paidAmount: 1,
        basicAmount: 1,
        finalAmount: 1,
        status: 1,
        raisedOn: 1,
        createdBy: 1,
        project: 1,
        serialSequence: 1,
      })
      .populate('project')
      .exec();
    const updatedInvoices = [];

    let isAdmin = false;

    user.userType.forEach((el) => {
      if (String(el.organisation) === orgId) {
        isAdmin = el.userType === 'Admin';
      }
    });

    for (let ele of invoices) {
      ele = await this.utilsService.decryptInvoiceData(ele);
      let temp = {};

      if (String(ele.createdBy) === String(user._id) || isAdmin) {
        temp = ele;
      } else {
        temp = { sNo: ele.sNo, dueDate: ele.dueDate, status: ele.status };
      }
      updatedInvoices.push(temp);
    }
    return { data: { invoices: updatedInvoices }, success: true, message: '' };
  }

  // async fixAllInvoices() {
  //   const invoices = await this.invoiceModel.find();
  //   for (let index = 0; index < invoices.length; index++) {
  //     const el = invoices[index];
  //     if (!el.services[0].paymentPhaseId && el.paymentPhase[0]) {
  //       console.log('el.paymentPhase', el.services);
  //       for (let index = 0; index < el.services.length; index++) {
  //         let elementService = el.services[index];

  //         elementService = {
  //           ...elementService._doc,
  //           paymentPhaseId: el.paymentPhase[0],
  //         };
  //         el.services[index] = elementService;
  //       }
  //       invoices[index] = el;
  //       console.log('services', el.services);
  //       await el.save();
  //     }
  //   }

  //   return { message: 'Already modified' };
  // }

  async getSingleInvoice(orgId, invoiceId, user) {
    let query = {};

    if (user.type === 'Admin') {
      query = {
        organisation: orgId,
        _id: invoiceId,
      };
    } else {
      query = {
        organisation: orgId,
        _id: invoiceId,
        createdBy: user._id,
      };
    }
    let invoice = await this.invoiceModel
      .findOne(query)
      .populate('project')
      .populate('services.paymentPhaseId')
      .populate('customer')
      .populate('account')
      .populate('subsiduary')
      .populate({
        path: 'paymentPhase',
        populate: { path: 'milestones', model: 'Milestone' },
      })
      .select({
        'project.description': 0,
        'project.attachmenats': 0,
        'project.team': 0,
        'project.paymentInfo': 0,
        'project.credentials': 0,
        'project.clientData': 0,
        'paymentPhase.milestones.paymentInfo': 0,
      })
      .exec();

    if (!invoice) {
      throw new HttpException(
        'Either you are not authorized or invoice is not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // let invoice = await this.invoiceModel.aggregate([
    //   {
    //     $match: {organisation: Types.ObjectId(orgId), _id: Types.ObjectId(invoiceId)}
    //   },
    //   {
    //     $lookup: {
    //       from: 'projects',
    //       localField: 'project',
    //       foreignField: '_id',
    //       as: 'project'
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: 'paymentphases',
    //       localField: 'paymentPhase',
    //       foreignField: '_id',
    //       as: 'paymentPhase'
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: 'customers',
    //       localField: 'customer',
    //       foreignField: '_id',
    //       as: 'customer'
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: 'milestones',
    //       localField: `paymentPhase[0].milestones`,
    //       foreignField: '_id',
    //       as: `paymentPhase[0].milestones`,
    //     }
    //   },
    // ])

    const decryptedServices = [];

    if (invoice?.services[0]?.paymentPhaseId) {
      for (const el of invoice.services) {
        const a = await this.utilsService.decryptPaymentPhase(
          el.paymentPhaseId,
        );
        decryptedServices.push(a);
      }
    } else if (invoice.paymentPhase) {
      invoice.paymentPhase = await this.utilsService.decryptPaymentPhase(
        invoice.paymentPhase,
      );
    }

    invoice.customer = await this.utilsService.decryptCustomerData(
      invoice.customer,
    );
    invoice.account = await this.utilsService.decryptAccountData(
      invoice.account,
    );
    invoice = await this.utilsService.decryptInvoiceData(invoice);

    let isAdmin = false;

    user.userType.forEach((el) => {
      if (String(el.organisation) === orgId) {
        isAdmin = el.userType === 'Admin';
      }
    });

    let temp = {};

    if (String(invoice.createdBy) === String(user._id) || isAdmin) {
      temp = invoice;
    } else {
      temp = {
        sNo: invoice.sNo,
        dueDate: invoice.dueDate,
        status: invoice.status,
      };
    }
    return { data: { invoice: temp }, success: true, message: '' };
  }

  async getInvoiceApp(args, proj) {
    const invoices = await this.invoiceModel.find(args, proj).exec();
    return invoices;
  }

  async raiseInvoice(orgId, projectId, paymentPhaseId) {
    const invoice = await this.invoiceModel
      .findOne({ paymentPhase: paymentPhaseId })
      .exec();
    if (!invoice) {
      this.pendingInvoiceModel.create({
        project: projectId,
        paymentPhase: paymentPhaseId,
        organisation: orgId,
      });
    }
    return;
  }

  async getRaisedInvoices(orgId) {
    const raisedInvoices = await this.pendingInvoiceModel
      .find({ organisation: orgId })
      .exec();

    return { data: { raisedInvoices }, success: true, message: '' };
  }

  async clearRaisedInvoice(projectId, paymentPhaseId) {
    this.pendingInvoiceModel
      .deleteOne({ project: projectId, paymentPhase: paymentPhaseId })
      .exec();
    return;
  }

  async addTransaction(user, orgId, invoiceId, attachments, dto) {
    const invoice = await this.getInvoiceApp(
      { organisation: orgId, _id: invoiceId },
      {},
    );

    if (invoice.length === 0) {
      throw new HttpException(
        'Please provide with a valid invoice!',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.gateway) {
      const gateway = await this.systemService.getGateways({
        uniqueName: dto.gateway,
      });
      if (!gateway) {
        dto.gateway = undefined;
      }
    }
    const proAttach = [];
    if (attachments?.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        proAttach.push(
          await this.utilsService.uploadFileS3(
            attachments[i],
            ConfigService.keys.FOLDER_TRANSACTION_ATTACHMENT,
          ),
        );
      }
    }

    dto.attachments = [...proAttach];
    dto.description =
      dto.description !== undefined
        ? this.utilsService.encryptData(dto.description)
        : undefined;
    dto.gatewayFees =
      dto.gatewayFees !== undefined
        ? this.utilsService.encryptData(dto.gatewayFees)
        : undefined;
    dto.gatewayTransactionId =
      dto.gatewayTransactionId !== undefined
        ? this.utilsService.encryptData(dto.gatewayTransactionId)
        : undefined;
    dto.currency = invoice[0].currency;
    dto.localCurrency =
      dto.localCurrency !== undefined
        ? this.utilsService.encryptData(dto.localCurrency)
        : undefined;
    dto.localEquivalentAmount =
      dto.localEquivalentAmount !== undefined
        ? this.utilsService.encryptData(dto.localEquivalentAmount)
        : undefined;
    dto.createdBy = user._id;
    if (dto.amount !== undefined) {
      invoice[0].paidAmount =
        parseFloat(this.utilsService.decryptData(invoice[0].paidAmount)) +
        parseFloat(dto.amount);
      if (
        invoice[0].paidAmount >=
        parseFloat(this.utilsService.decryptData(invoice[0].finalAmount))
      ) {
        invoice[0].status = 'Paid';
      } else if (invoice[0].paidAmount === 0) {
        invoice[0].status = 'Unpaid';
      } else {
        invoice[0].status = 'Partially Paid';
      }
      invoice[0].paidAmount = this.utilsService.encryptData(
        invoice[0].paidAmount,
      );
    }
    dto.amount = this.utilsService.encryptData(dto.amount);

    dto.date = dto.date ? new Date(dto.date) : this.utilsService.dateToday();
    dto.organisation = orgId;

    let transaction = new this.transactionModel(dto);

    transaction.invoice = invoiceId;
    transaction.project = invoice[0].project;
    transaction.createdBy = user._id;

    transaction = await transaction.save();
    await invoice[0].save();

    transaction = await this.decryptTransactionData(transaction);

    return {
      data: { transaction },
      message: 'Transaction added successfully.',
      success: true,
    };
  }

  async updateTransaction(user, orgId, transactionId, addAttachments, dto) {
    let transaction = await this.transactionModel
      .findOne({ _id: transactionId })
      .populate('Invoice')
      .exec();
    if (!transaction) {
      throw new HttpException(
        "This transaction doesn't exist!",
        HttpStatus.BAD_REQUEST,
      );
    }

    const invoice = await this.invoiceModel
      .findOne({ _id: transaction.invoice })
      .exec();

    if (!invoice || String(invoice.organisation) != orgId) {
      throw new HttpException(
        'Wrong transactional data!',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.gateway) {
      const gateway = await this.systemService.getGateways({
        uniqueName: dto.gateway,
      });
      if (!gateway) {
        dto.gateway = undefined;
      }
    }
    const proAttach = [];
    if (addAttachments?.length > 0) {
      for (let i = 0; i < addAttachments.length; i++) {
        proAttach.push(
          await this.utilsService.uploadFileS3(
            addAttachments[i],
            ConfigService.keys.FOLDER_TRANSACTION_ATTACHMENT,
          ),
        );
      }
      transaction.attachments.push(...proAttach);
    }

    if (
      dto.removeAttachments &&
      JSON.parse(dto.removeAttachments)?.length > 0
    ) {
      dto.removeAttachments = JSON.parse(dto.removeAttachments);
      for (let i = 0; i < transaction.attachments.length; i++) {
        if (dto.removeAttachments.includes(transaction.attachments[i])) {
          this.utilsService.deleteFileS3(
            transaction.attachments[i],
            ConfigService.keys.FOLDER_TRANSACTION_ATTACHMENT,
          );
          transaction.attachments.splice(i, 1);
          i--;
        }
      }
    }

    transaction.description =
      dto.description !== undefined
        ? this.utilsService.encryptData(dto.description)
        : transaction.description;
    transaction.gatewayFees =
      dto.gatewayFees !== undefined
        ? this.utilsService.encryptData(dto.gatewayFees)
        : transaction.gatewayFees;
    transaction.gatewayTransactionId =
      dto.gatewayTransactionId !== undefined
        ? this.utilsService.encryptData(dto.gatewayTransactionId)
        : transaction.gatewayTransactionId;
    // transaction.currency = dto.currency !== undefined ? this.utilsService.encryptData(dto.currency) : transaction.currency;
    transaction.localCurrency =
      dto.localCurrency !== undefined
        ? this.utilsService.encryptData(dto.localCurrency)
        : transaction.localCurrency;
    transaction.localEquivalentAmount =
      dto.localEquivalentAmount !== undefined
        ? this.utilsService.encryptData(dto.localEquivalentAmount)
        : transaction.localEquivalentAmount;
    if (dto.amount !== undefined) {
      invoice.paidAmount =
        parseFloat(this.utilsService.decryptData(invoice.paidAmount)) -
        parseFloat(this.utilsService.decryptData(transaction.amount)) +
        parseFloat(dto.amount);
      if (
        invoice.paidAmount >=
        parseFloat(this.utilsService.decryptData(invoice.finalAmount))
      ) {
        invoice.status = 'Paid';
      } else {
        invoice.status = 'Partially Paid';
      }
      invoice.paidAmount = this.utilsService.encryptData(invoice.paidAmount);
      transaction.amount = this.utilsService.encryptData(dto.amount);
    }
    transaction.date = dto.date ? new Date(dto.date) : transaction.date;

    transaction.lastUpdatedBy = user._id;

    transaction = await transaction.save({ new: true });
    await invoice.save();

    transaction = await this.decryptTransactionData(transaction);

    return {
      data: { transaction },
      message: 'Transaction updated successfully.',
      success: true,
    };
  }

  async decryptTransactionData(transaction) {
    if (!transaction) {
      return transaction;
    }

    transaction.gatewayFees = transaction.gatewayFees
      ? parseFloat(this.utilsService.decryptData(transaction.gatewayFees))
      : transaction.gatewayFees;
    transaction.description = transaction.description
      ? this.utilsService.decryptData(transaction.description)
      : transaction.description;
    transaction.gatewayTransactionId = transaction.gatewayTransactionId
      ? this.utilsService.decryptData(transaction.gatewayTransactionId)
      : transaction.gatewayTransactionId;
    transaction.currency = transaction.currency
      ? this.utilsService.decryptData(transaction.currency)
      : transaction.currency;
    transaction.localCurrency = transaction.localCurrency
      ? this.utilsService.decryptData(transaction.localCurrency)
      : transaction.localCurrency;
    transaction.localEquivalentAmount = transaction.localEquivalentAmount
      ? parseFloat(
          this.utilsService.decryptData(transaction.localEquivalentAmount),
        )
      : transaction.localEquivalentAmount;
    transaction.amount = transaction.amount
      ? parseFloat(this.utilsService.decryptData(transaction.amount))
      : transaction.amount;

    return transaction;
  }

  async getTransactions(orgId, invoiceId, user) {
    const userId = user._id;
    const transactions = await this.getTransactionsApp(
      orgId,
      invoiceId,
      userId,
      user.type,
    );
    for (let ele of transactions) {
      // 61543116d8aa0b00169fbfc4
      // 61543116d8aa0b00169fbfc4
      ele = await this.decryptTransactionData(ele);
    }

    return { data: { transactions }, success: true, message: '' };
  }

  async getTransactionsApp(orgId, invoiceId, userId, userType) {
    let query;
    if (userType === 'Admin') {
      query = {
        invoice: invoiceId,
      };
    } else {
      query = {
        invoice: invoiceId,
        createdBy: userId,
      };
    }
    const transaction = await this.transactionModel.find(query).exec();
    return transaction;
  }
}
