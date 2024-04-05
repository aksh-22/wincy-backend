import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { INVOICE_STATUS } from 'src/invoice/enum/status.enum';
import { InvoiceService } from 'src/invoice/invoice.service';
import { UtilsService } from 'src/utils/utils.service';
import { CreatePaymentScheduleDto } from './dto/create-payment-schedule.dto';
import { UpdatePaymentScheduleDto } from './dto/update-payment-schedule.dto';
import { PAYMENT_SCHEDULE_STATUS } from './paymentSchedule.enum';
import {
  PaymentScheduleDocument,
  PaymentScheduleModel,
} from './schema/paymentSchedule.schema';

@Injectable()
export class PaymentScheduleService {
  constructor(
    @InjectModel(PaymentScheduleModel.name)
    private PaymentScheduleMOdel: Model<PaymentScheduleDocument>,
    private readonly utilsService: UtilsService,
    private readonly invoiceService: InvoiceService,
  ) {}

  // getPsAgg = async (type: any, filter?: any, date?: any) => {
  getPsAgg = async ({
    type,
    filter,
    match,
    sort = { createdAt: -1 },
  }: {
    type: string;
    filter: any;
    date?: any;
    match?: any;
    sort?: any;
  }) => {
    const isAdmin = type === 'Admin';

    const $match = {
      ...(!isAdmin && { isRestricted: false }),
      ...(filter && { ...filter }),
    };
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
          from: 'invoicemodels',
          localField: '_id',
          foreignField: 'paymentSchedule',
          as: 'invoice',
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
    ];
    const $project = {
      _id: 1,
      amount: 1,
      name: 1,
      status: 1,
      dueDate: 1,
      initialAMount: 1,
      isRestricted: 1,
      month: { $month: '$dueDate' },
      year: { $year: '$dueDate' },
      'projectId._id': 1,
      'projectId.title': 1,
      'projectId.isRestricted': 1,
      'invoice._id': 1,
      'invoice.amount': 1,
      'invoice.invoiceNumber': 1,
      'createdBy.name': 1,
      'createdBy.profilePicture': 1,
    };

    const $unwind = '$projectId';

    const ags = [
      { $match },
      ...$lookup,
      { $unwind },
      { $sort: sort },
      { $project },
    ];

    if (match) {
      ags.push({ $match: match });
    }

    const paymentSchedules = await this.PaymentScheduleMOdel.aggregate(ags);

    const paymentSchedulesDecrypted = paymentSchedules.map((el) => {
      const temp = el;
      temp.amount = this.utilsService.decryptAmount(el?.amount);
      temp.invoice.forEach((el2) => {
        const am = this.utilsService.decryptData(String(el2.amount));
        el2.amount = am;
      });
      return temp;
    });

    return paymentSchedulesDecrypted;
  };

  async getPaymentSchedules(user: any, filter: any) {
    try {
      const { projectId, status, month, year, createdAt } = filter;
      let filterData = {
        isDeleted: false,
        ...(projectId && { projectId: mongoose.Types.ObjectId(projectId) }),
      };
      if (status) {
        if (Array.isArray(status)) {
          filterData['status'] = { $in: status };
        } else {
          filterData['status'] = status;
        }
      }

      let match = {};
      if (month) {
        if (!year) {
          throw new HttpException(
            'Please select year with month as well',
            HttpStatus.CONFLICT,
          );
        }

        match = { month: Number(month), year: Number(year) };
      }
      const paymentSchedule = await this.getPsAgg({
        type: user.type,
        filter: filterData,
        match,
        sort: { createdAt: createdAt ? Number(createdAt) : -1 },
      });

      return {
        message: 'successful',
        status: 200,
        data: paymentSchedule,
      };
    } catch (error) {
      console.error('error in getPaymentSchedules', error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async createPaymentSchedule(
    body: CreatePaymentScheduleDto,
    user: any,
    organisation: string,
  ) {
    try {
      const amount = await this.utilsService.encryptData(String(body?.amount));
      const newDoc = {
        ...body,
        initialAmount: amount,
        amount,
        organisation,
        createBy: user?._id,
      };
      const paymentSchedule = await this.PaymentScheduleMOdel.create(newDoc);
      const paymentSchedules = await this.getPsAgg({
        type: user.type,
        filter: {
          _id: paymentSchedule._id,
        },
      });
      return {
        message: 'successful',
        data: { paymentSchedule: paymentSchedules[0] },
      };
    } catch (error) {
      console.error('error in createPaymentSchedule', error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async updatePaymentSchedule(body: UpdatePaymentScheduleDto, user: any) {
    try {
      const filter = {
        _id: body.paymentScheduleId,
        projectId: body.projectId,
      };
      const PS = await this.PaymentScheduleMOdel.find(filter);

      let { paymentSchedule, amountObj } = this.updatePS(PS[0], body);

      if (amountObj) {
        let { amount, oldAmount } = amountObj;
        amount = await this.utilsService.encryptData(String(amount));
        paymentSchedule.amount = amount;
      }

      await paymentSchedule.save();

      if (body?.status === PAYMENT_SCHEDULE_STATUS.PAID) {
        const invoice = await this.invoiceService.getOne({
          paymentSchedule: paymentSchedule._id,
        });
        // ! only for those in which it has only one PS
        if (invoice?.paymentSchedule?.length === 1) {
          invoice.status = INVOICE_STATUS.PAID;
          await invoice.save();
        }
      }

      const paymentSchedules = await this.getPsAgg({
        type: user.type,
        filter: {
          _id: paymentSchedule._id,
        },
      });

      return {
        message: 'successful',
        data: { paymentSchedule: paymentSchedules[0] },
      };
    } catch (error) {
      console.error('Error in updatePaymentSchedule', error);

      throw new InternalServerErrorException(error);
    }
  }

  async deletePaymentSchedule(paymentScheduleId: string) {
    const invoice = await this.invoiceService.getInvoices(
      null,
      paymentScheduleId,
      {},
    );
    if (invoice.data.length) {
      throw new HttpException(
        'Please delete invoices linked with this payment phase first',
        HttpStatus.CONFLICT,
      );
    }
    const d = await this.PaymentScheduleMOdel.deleteOne({
      _id: paymentScheduleId,
    });
    if (d.n == 0) {
      throw new HttpException('Could n0t delete it', HttpStatus.FORBIDDEN);
    }
    return {
      message: 'Payment schedule deleted successfully',
      data: { invoice },
    };
  }

  updatePS(paymentSchedule: any, body: UpdatePaymentScheduleDto) {
    const removedKeys = ['projectId', 'amount'];
    let amountObj = null;
    Object.keys(body).forEach((el) => {
      if (body?.[el] && !removedKeys.includes(el)) {
        paymentSchedule[el] = body[el];
      } else if (el === 'amount') {
        amountObj = {
          amount: body.amount,
          oldAmount: paymentSchedule.amount,
        };
      }
    });

    return { paymentSchedule, amountObj };
  }
}
