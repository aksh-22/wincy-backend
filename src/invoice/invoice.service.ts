import {
  HttpException,
  HttpStatus,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { PaymentScheduleModel } from 'src/payment-schedule/schema/paymentSchedule.schema';
import { ProjectsService } from 'src/projects/projects.service';
import { UtilsService } from 'src/utils/utils.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceModel } from './schema/invoice.schema';
import { PAYMENT_SCHEDULE_STATUS } from 'src/payment-schedule/paymentSchedule.enum';
import * as mongoose from 'mongoose';
import { INVOICE_STATUS } from './enum/status.enum';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(InvoiceModel.name) private InvoiceModel: Model<InvoiceModel>,
    @InjectModel(PaymentScheduleModel.name)
    private PaymentScheduleModel: Model<PaymentScheduleModel>,
    @InjectModel('Customer') private readonly customerModel: Model<any>,
    private readonly projectsService: ProjectsService,
    private readonly utilsService: UtilsService,
  ) {}

  async getOneInvoice(filter) {
    const $match = filter;

    const $lookup = [
      {
        $lookup: {
          from: 'projects',
          localField: 'projectId',
          foreignField: '_id',
          as: 'projectId',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      {
        $lookup: {
          from: 'Subsiduary',
          localField: 'subsiduary',
          foreignField: '_id',
          as: 'subsiduary',
        },
      },
      {
        $lookup: {
          from: 'Customer',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'paymentschedulemodels',
          localField: 'paymentSchedule',
          foreignField: '_id',
          as: 'paymentSchedule',
        },
      },
    ];

    const ags = [{ $match }, ...$lookup];

    const invoices = await this.InvoiceModel.findById(filter)
      .populate('customer')
      .populate('paymentSchedule')
      .populate('createBy')
      .populate('projectId')
      .populate('subsiduary');
    const decryptInvoices = await this.utilsService.decryptOneNewInvoiceData([
      invoices,
    ]);

    return decryptInvoices;
  }

  async aggInvoice(filter = {}, sort = { createdAt: 1 }) {
    const invoices = await this.InvoiceModel.find(filter)
      // .sort(sort)
      .populate({ path: 'projectId', select: '_id title' })
      .populate({ path: 'subsiduary', select: '_id title address gstNo' })
      .populate({ path: 'customer', select: '_id fullName email address' })
      .populate({ path: 'createBy', select: '_id name profilePicture' });

    const decryptInvoices = await this.utilsService.decryptNewInvoiceData(
      invoices,
    );

    return decryptInvoices;
  }

  async getInvoices(user: any, paymentSchedule: string, filterData: any) {
    try {
      const {
        status,
        projectId,
        month,
        year,
        subsiduary,
        createdAt,
        invoiceId,
      } = filterData;

      const isAdmin = user?.type === 'Admin';
      const filter = {
        ...(!isAdmin && { isRestricted: false }),
        ...(projectId && { projectId }),
        ...(paymentSchedule && {
          paymentSchedule,
        }),
        ...(status && { status }),
        ...(subsiduary && { subsiduary }),
        // createdAt: createdAt ? Number(createdAt) : -1,
      };

      if (month) {
        if (!year) {
          throw new HttpException(
            'Please select year with month as well',
            HttpStatus.CONFLICT,
          );
        }
        const $gte = moment({ month: month - 1, year })
          .startOf('month')
          .toDate();

        const $lt = moment({ month: month - 1, year })
          .endOf('month')
          .toDate();
        filter['invoicedAt'] = {
          $gte,
          $lt,
        };
      }

      let invoice;

      if (invoiceId) {
        filter['_id'] = mongoose.Types.ObjectId(invoiceId);
        invoice = await this.getOneInvoice(invoiceId);
      } else {
        invoice = await this.aggInvoice(filter, { createdAt });
      }

      return {
        message: 'Successful',
        data: invoice,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async createInvoice(body: CreateInvoiceDto, user: any, organisation: string) {
    try {
      // !Check whether there is any invoice with this number

      const existInvoice = await this.InvoiceModel.find({
        invoiceNumber: body.invoiceNumber,
      });

      if (existInvoice?.length) {
        throw new HttpException(
          'Invoice already exist with this number',
          HttpStatus.FOUND,
        );
      }

      // !----------------------------------------------

      // ! get a project and validations based on it

      // !----------------------------------------------
      const project = await this.projectsService.getAppProject(
        {
          _id: body?.projectId,
          organisation,
        },
        { paymentInfo: 1 },
      );

      if (!project) {
        throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
      }

      if (!project?.paymentInfo?.currency) {
        throw new HttpException('Add project currency first.', 412);
      }

      // !----------------------------------------------

      // ! client and validations based on it

      // !----------------------------------------------

      const customer = await this.customerModel.find({
        projects: body?.projectId,
      });

      if (!customer.length) {
        throw new HttpException(
          'Kindly add a client to this project first.',
          413,
        );
      }

      // !----------------------------------------------

      // ! payment schedule and validations based on it

      // !----------------------------------------------

      // ?---- Handler for both create and update

      const {
        PSDecryptAMountOld,
        invoiceAmountOld,
        invoiceNewAmount,
        paymentSchedule,
        invoiceEncryptAmount,
        isRestricted,
      } = await this.handleInvoiceAmount(body);

      // !----------------------------------------------

      // !------------------- Decrypt data---------------------------

      const currency = this.utilsService.decryptData(
        project?.paymentInfo?.currency,
      );

      const newDoc = {
        ...body,
        customer: customer[0]?._id,
        organisation,
        createBy: user?._id,
        currency,
        amount: invoiceEncryptAmount,
        isRestricted,
      };
      const newInvoice = await this.InvoiceModel.create(newDoc);

      // !----- handle status for payment schedule based on invoice
      // ?---- Handler for both create and update

      await this.handlePSStatus(
        paymentSchedule,
        PSDecryptAMountOld,
        invoiceAmountOld,
        invoiceNewAmount,
        null,
      );

      const invoice = await this.aggInvoice({
        projectId: body.projectId,
        _id: newInvoice._id,
      });

      return {
        message: 'successful',
        data: {
          invoice: invoice[0],
          PSDecryptAMountOld,
          paymentSchedule,
        },
      };
    } catch (error) {
      console.error('error in createInvoice', error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async updateInvoice(body: UpdateInvoiceDto, user: any, organisation: string) {
    try {
      const filter = {
        _id: body.invoiceId,
        paymentSchedule: body.paymentSchedule,
      };
      const inv = await this.InvoiceModel.find(filter);

      // for (let index = 0; index < inv.length; index++) {
      //   const element = inv[index];
      //   if (!Array.isArray(element.paymentSchedule)) {
      //     element.paymentSchedule = [element.paymentSchedule];
      //     element.save();
      //   }
      // }

      if (!inv.length) {
        throw new NotFoundException();
      }

      let { amountObj, invoice } = this.updateInv(body, inv[0]);

      if (amountObj) {
        // !----------------------------------------------

        // ! payment schedule and validations based on it

        // !----------------------------------------------
        // ?---- Handler for both create and update

        const {
          PSDecryptAMountOld,
          invoiceAmountOld,
          invoiceNewAmount,
          paymentSchedule,
          invoiceEncryptAmount,
        } = await this.handleInvoiceAmount(body, amountObj.oldAmount);

        invoice.amount = invoiceEncryptAmount;

        invoice = await invoice.save();

        // !----- handle status for payment schedule based on invoice
        // ?---- Handler for both create and update

        await this.handlePSStatus(
          paymentSchedule,
          PSDecryptAMountOld,
          invoiceAmountOld,
          invoiceNewAmount,
          body.status,
        );
      } else {
        invoice = await invoice.save();
        await this.updatePsStatus(body, invoice);
      }

      const invoiceDec = await this.aggInvoice({
        projectId: body.projectId,
        _id: invoice._id,
      });

      return {
        message: 'successful',
        data: { invoice: invoiceDec[0] },
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async updatePsStatus(body, invoice) {
    if (body.status === INVOICE_STATUS.PAID) {
      let { invoiceAmountOld } = await this.getAllInvoiceAmount(body);

      const filter = {
        _id: { $in: body.paymentSchedule },
      };
      const getPsAmount = await this.PaymentScheduleModel.find(filter).select(
        'amount',
      );
      for (let index = 0; index < getPsAmount.length; index++) {
        const element = getPsAmount[index];
        const psD = Number(this.utilsService.decryptData(element.amount));
        if (invoiceAmountOld >= psD) {
          element.status = PAYMENT_SCHEDULE_STATUS.PAID;
          await element.save();
        }
      }
      // await this.updatePSStatus(body);
    }
  }

  updateInv(body: UpdateInvoiceDto, invoice) {
    const removedKeys = ['projectId', 'amount', 'paymentSchedule'];
    let amountObj = null;
    Object.keys(body).forEach((el) => {
      if (body?.[el] && !removedKeys.includes(el)) {
        invoice[el] = body[el];
      } else if (el === 'amount') {
        amountObj = {
          amount: body.amount,
          oldAmount: this.utilsService.decryptData(invoice.amount),
        };
      }
    });

    return { invoice, amountObj };
  }

  async getProjectInvoiceData({
    user,
    projectId,
    organisation,
    year,
    month,
  }: any) {
    try {
      const isAdmin = user.type === 'Admin';
      const psFilter = {
        organisation,
        ...(projectId && { projectId }),
        ...(!isAdmin && { isRestricted: false }),
      };
      const invoiceFilter = {
        organisation,
        ...(projectId && { projectId }),
        status: INVOICE_STATUS.PAID,
        ...(!isAdmin && { isRestricted: false }),
      };
      if (month && !projectId) {
        if (!year) {
          throw new HttpException(
            'Please select year with month as well',
            HttpStatus.CONFLICT,
          );
        }
        const $gte = moment({ month: month - 1, year })
          .startOf('month')
          .toDate();

        const $lt = moment({ month: month - 1, year })
          .endOf('month')
          .toDate();
        psFilter['dueDate'] = {
          $gte,
          $lt,
        };
        invoiceFilter['paidAt'] = {
          $gte,
          $lt,
        };
      }

      const PS = await this.PaymentScheduleModel.distinct('amount', psFilter);
      const INVOICES = await this.InvoiceModel.distinct(
        'amount',
        invoiceFilter,
      );
      let paymentSchedule = 0;
      let invoice = 0;
      PS.forEach((el) => {
        paymentSchedule += Number(this.utilsService.decryptData(el));
      });
      INVOICES.forEach((el) => {
        invoice += Number(this.utilsService.decryptData(el));
      });
      let count = 0;
      if (projectId) {
        count = await this.customerModel.count({
          projects: { $in: projectId },
        });
      }
      return {
        message: 'successful',
        data: {
          numberOfPaymentPhase: PS.length,
          totalAmount: paymentSchedule,
          releaseAmount: invoice,
          count,
        },
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteInvoice(invoiceId: string) {
    try {
      const invoice = await this.InvoiceModel.findOne({ _id: invoiceId });

      const d = await this.InvoiceModel.deleteOne({
        _id: invoiceId,
      });
      if (d.n == 0) {
        throw new HttpException('Could n0t delete it', HttpStatus.FORBIDDEN);
      }
      const paymentSchedule = await this.PaymentScheduleModel.find({
        _id: invoice.paymentSchedule,
      });
      for (let index = 0; index < paymentSchedule.length; index++) {
        const element = paymentSchedule[index];
        if (
          index === 0 &&
          paymentSchedule.length === 1 &&
          invoice.amount !== paymentSchedule[0].amount
        ) {
          element.status = PAYMENT_SCHEDULE_STATUS.PARTIALLY_INVOICED;
        } else {
          element.status = PAYMENT_SCHEDULE_STATUS.PENDING;
        }
        await element.save();
      }
      return {
        message: 'Invoice deleted successfully',
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async getInvoicesNumber(orgId: string, subsiduaryId: string) {
    try {
      let query = {
        organisation: orgId,
        subsiduary: subsiduaryId,
      };
      const ins = await this.InvoiceModel.find(query).select('invoiceNumber');
      const invoices = await this.InvoiceModel.findOne(query)
        .sort({ _id: -1 })
        .select('invoiceNumber');
      return invoices;
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllInvoiceAmount(body) {
    let invoiceAmountOld = 0;

    const filter = {
      _id: { $in: body.paymentSchedule },
      projectId: body.projectId,
    };
    let paymentSchedule = await this.PaymentScheduleModel.find(filter).select(
      'amount isRestricted',
    );

    const psIds = [];

    paymentSchedule.forEach((el) => {
      psIds.push(String(el['_id']));
    });

    const getAllInvoices = await this.InvoiceModel.distinct('amount', {
      paymentSchedule: { $in: psIds },
    });

    getAllInvoices.forEach((el) => {
      const val = Number(this.utilsService.decryptData(el));
      invoiceAmountOld += val;
    });

    return { invoiceAmountOld, paymentSchedule };
  }

  async handleInvoiceAmount(body, oldAmount = 0) {
    let { invoiceAmountOld, paymentSchedule } = await this.getAllInvoiceAmount(
      body,
    );

    if (!paymentSchedule.length) {
      throw new HttpException('Payment phase not found.', HttpStatus.NOT_FOUND);
    }

    // !---- amount

    const psIds = [];

    paymentSchedule.forEach((el) => {
      psIds.push(String(el['_id']));
    });

    let PSDecryptAMountOld = 0;
    const invoiceNewAmount = Number(body.amount);

    let isRestricted = false;

    for (let index = 0; index < paymentSchedule.length; index++) {
      const element = paymentSchedule[index];
      if (index === 0) {
        isRestricted = element.isRestricted;
      } else if (isRestricted !== element.isRestricted) {
        throw new HttpException(
          'Please select either all restricted or non-restricted',
          HttpStatus.NOT_ACCEPTABLE,
        );
      }
      PSDecryptAMountOld += Number(
        this.utilsService.decryptData(element.amount),
      );
    }

    const invoiceEncryptAmount = await this.utilsService.encryptData(
      body.amount,
    );

    invoiceAmountOld -= oldAmount;

    if (invoiceNewAmount > PSDecryptAMountOld - invoiceAmountOld) {
      throw new HttpException(
        'Amount can not be greater than given amount.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      paymentSchedule.length > 1 &&
      PSDecryptAMountOld - invoiceAmountOld !== invoiceNewAmount
    ) {
      throw new HttpException(
        'Invoice amount must be equal to total of payment phases if payment phases are multiple',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      paymentSchedule,
      PSDecryptAMountOld,
      invoiceAmountOld,
      invoiceNewAmount,
      invoiceEncryptAmount,
      isRestricted,
    };
  }

  async updatePSStatus(body) {
    await this.PaymentScheduleModel.updateMany(
      {
        _id: body.paymentSchedule,
        projectId: body.projectId,
      },
      { status: PAYMENT_SCHEDULE_STATUS.PAID },
    );
  }

  async handlePSStatus(
    paymentSchedule,
    PSDecryptAMountOld,
    invoiceAmountOld,
    invoiceNewAmount,
    status,
  ) {
    for (let index = 0; index < paymentSchedule.length; index++) {
      const element = paymentSchedule[index];
      if (
        status === INVOICE_STATUS.PAID &&
        PSDecryptAMountOld - invoiceAmountOld - invoiceNewAmount === 0
      ) {
        element.status = PAYMENT_SCHEDULE_STATUS.PAID;
      } else if (
        paymentSchedule.length === 1 &&
        PSDecryptAMountOld - invoiceAmountOld - invoiceNewAmount > 0
      ) {
        element.status = PAYMENT_SCHEDULE_STATUS.PARTIALLY_INVOICED;
      } else if (
        PSDecryptAMountOld - invoiceAmountOld - invoiceNewAmount ===
        PSDecryptAMountOld
      ) {
        element.status = PAYMENT_SCHEDULE_STATUS.PENDING;
      } else {
        element.status = PAYMENT_SCHEDULE_STATUS.INVOICED;
      }
      await element.save();
    }
  }
}
