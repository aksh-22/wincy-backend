import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as AWS from 'aws-sdk';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';
import { ActivitiesService } from 'src/activities/activities.service';
import { ConfigService } from 'src/config/config.service';
import { v1 as uuidv1 } from 'uuid';

const secret = ConfigService.keys.ENCRYPTION_SECRET;

@Injectable()
export class UtilsService {
  constructor(private readonly actsService: ActivitiesService) {}

  getMetaData({ page, limit, total }) {
    return {
      page,
      limit,
      isLast: total < limit,
    };
  }

  async uploadFileS3(file, folder) {
    try {
      const s3 = new AWS.S3({
        accessKeyId: ConfigService.keys.AWS_ID,
        secretAccessKey: ConfigService.keys.AWS_SECRET,
      });
      let name = file.originalname.split('.');
      const ext = name[name.length - 1];
      name = uuidv1().concat('.', ext);
      const params = {
        Bucket: ConfigService.keys.AWS_BUCKET_NAME,
        Key: `${folder}/${name}`,
        Body: file.buffer,
        CreateBucketConfiguration: {
          // Set your region here
          LocationConstraint: ConfigService.keys.AWS_REGION,
        },
        ACL: 'public-read',
      };
      const { Location } = await s3.upload(params).promise();
      return Location;
    } catch (error) {
      console.error('Error in uploadFileS3', error);

      throw new InternalServerErrorException(error);
    }
  }

  async deleteFileS3(url, folder) {
    const s3 = new AWS.S3({
      accessKeyId: ConfigService.keys.AWS_ID,
      secretAccessKey: ConfigService.keys.AWS_SECRET,
    });
    let name = url.split('/');
    name = name[name.length - 1];
    await s3
      .deleteObject({
        Bucket: ConfigService.keys.AWS_BUCKET_NAME,
        Key: `${folder}/${name}`,
      })
      .promise();
  }

  encryptData(data) {
    const iv = randomBytes(16);
    const key = scryptSync(secret, 'salt', 32) as Buffer;
    const cipher = createCipheriv('aes-256-ctr', key, iv);

    const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
    return JSON.stringify({
      iv: iv.toString('hex'),
      encryptedData: encryptedData.toString('hex'),
    });
  }

  decryptData(encryptedData) {
    try {
      if (encryptedData === 'NaN' || encryptedData === null) {
        return null;
      }
      const parsed = JSON.parse(encryptedData);
      const iv = Buffer.from(parsed.iv, 'hex');
      encryptedData = Buffer.from(parsed.encryptedData, 'hex');
      const key = scryptSync(secret, 'salt', 32) as Buffer;
      const decipher = createDecipheriv('aes-256-ctr', key, iv);

      const decryptedData = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);
      const str = decryptedData.toString();
      return str;
    } catch (error) {
      console.error('error in decryptData', error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  decryptAmount(amount) {
    if (Number(amount) === 0) {
      return '0';
    }
    const amountToSend = amount ?? null;
    return this.decryptData(amountToSend);
  }

  projectAssociation(project, userId) {
    if (typeof userId != 'string') {
      userId = String(userId);
    }
    const team = [];
    project.team?.forEach((element) => {
      team.push(String(element));
    });
    if (project.projectManagers.length) {
      team.push(...project.projectManagers.map((el) => String(el)));
    }

    return team.includes(userId) ? true : false;
  }

  dateToday() {
    const day = new Date().getUTCDate();
    const month = new Date().getUTCMonth() + 1;
    const year = new Date().getUTCFullYear();
    const date = new Date(`${month}-${day}-${year}`);

    return date;
  }

  decryptCustomer(customer: any) {
    if (customer?.fullName && customer?.fullName.includes('encryptedData')) {
      customer.fullName = this.decryptData(customer.fullName);
    }
    if (customer?.email && customer?.email.includes('encryptedData')) {
      customer.email = this.decryptData(customer.email);
    }
    if (customer?.address && customer?.address.includes('encryptedData')) {
      customer.address = this.decryptData(customer.address);
    }
    return customer;
  }

  decryptPaymentScheduleData(paymentSchedule: any) {
    const decrypted = { ...paymentSchedule };
    if (paymentSchedule?.amount) {
      decrypted.amount = this.decryptData(paymentSchedule.amount);
    }

    return decrypted;
  }

  decryptPaymentScheduleDataArray(paymentSchedule: any[]) {
    paymentSchedule.forEach((el) => {
      el.amount = this.decryptData(el.amount);
    });

    return paymentSchedule;
  }

  async decryptNewInvoiceData(invoices: any) {
    invoices.forEach((element, index) => {
      const decryptedPaymentSchedule = this.decryptPaymentScheduleData(
        element.paymentSchedule,
      );
      const decryptedCustomer = this.decryptCustomer(element?.customer);
      const decryptedAmount = this.decryptData(element?.amount);
      element['customer'] = decryptedCustomer;
      element['paymentSchedule'] = decryptedPaymentSchedule;
      element['amount'] = decryptedAmount;
    });
    return invoices;
  }

  async decryptOneNewInvoiceData(invoices: any) {
    invoices.forEach((element, index) => {
      element?.['paymentSchedule']?.forEach((el) => {
        el.amount = this.decryptData(el.amount);
      });

      const decryptedCustomer = this.decryptCustomer(element?.customer);
      const decryptedAmount = this.decryptData(element?.amount);
      element['customer'] = decryptedCustomer;
      // element['paymentSchedule'] = decryptedPaymentSchedule;
      element['amount'] = decryptedAmount;
    });
    return invoices;
  }

  async createAssigneeActs(
    userId,
    entityId,
    type,
    oldAssignees,
    newAssignees,
    projectId,
  ) {
    try {
      oldAssignees = oldAssignees.filter(Boolean);
      newAssignees = newAssignees.filter(Boolean);
      const oldAssigneesObj = {};
      const newAssigneesObj = {};
      const add = [];
      const remove = [];
      const activities = [];

      oldAssignees.forEach((ele) => {
        oldAssigneesObj[String(ele)] = true;
      });

      newAssignees.forEach((ele) => {
        newAssigneesObj[ele] = true;
        if (!oldAssigneesObj[ele]) {
          add.push(ele);
        }
      });

      oldAssignees.forEach((ele) => {
        if (!newAssigneesObj[String(ele)]) {
          remove.push(ele);
        }
      });

      if (add.length > 0) {
        add.forEach((ele) => {
          const actsObj = {
            project: projectId,
            operation: 'Update',
            type,
            createdBy: userId,
            field: 'Assignees',
            from: undefined,
            to: ele,
            description: `New assignee added to the ${type.toLowerCase()}.`,
            assignee: ele,
          };
          actsObj[type.toLowerCase()] = entityId;
          activities.push(actsObj);
        });
      }

      if (remove.length > 0) {
        remove.forEach((ele) => {
          const actsObj = {
            project: projectId,
            operation: 'Update',
            type,
            createdBy: userId,
            field: 'Assignees',
            from: ele,
            to: undefined,
            description: `Assignee has been removed from the ${type.toLowerCase()}.`,
            assignee: ele,
          };
          actsObj[type.toLowerCase()] = entityId;
          activities.push(actsObj);
        });
      }

      this.actsService.createActivity(activities);
    } catch (err) {
      throw err;
    }
  }

  //========================================================//

  async createBasicInfoActs(
    userId,
    operation: string,
    type: string,
    dto,
    meta,
    oldEntity,
    newEntity,
    projectId,
  ) {
    try {
      if (operation === 'Create') {
        const actsObj = {
          project: projectId,
          operation,
          type,
          createdBy: userId,
          description: `A new ${
            type != 'Query-Response' ? type.toLowerCase() : 'QueryResponse'
          } got created.`,
          meta,
        };

        actsObj[
          type != 'Query-Response' ? type.toLowerCase() : 'QueryResponse'
        ] = newEntity._id;
        this.actsService.createActivity([actsObj]);
        return;
      }

      if (operation === 'Delete') {
        const actsObj = {
          project: projectId,
          operation,
          type,
          createdBy: userId,
          description: `A ${
            type != 'Query-Response' ? type.toLowerCase() : 'QueryResponse'
          } got deleted.`,
          meta,
        };

        actsObj[
          type != 'Query-Response' ? type.toLowerCase() : 'QueryResponse'
        ] = oldEntity._id;
        this.actsService.createActivity([actsObj]);
        return;
      }

      if (operation === 'Update' && dto.mystatus !== undefined) {
        this.actsService.createActivity([
          {
            project: projectId,
            meta,
            operation,
            type,
            createdBy: userId,
            field: 'assignneeStatus',
            from: oldEntity.assigneeStatus,
            to: newEntity.assigneeStatus,
            description: `${type} updated for assignee-status changed from ${oldEntity.assigneeStatus} to ${newEntity.assigneeStatus}.`,
          },
        ]);
        return;
      }
      let oldDto = {};
      let paymentInfo;

      for (const [key, value] of Object.entries(dto)) {
        if (type == 'Milestone') {
          if (
            value !== undefined &&
            ![
              'amount',
              'currency',
              'settledOn',
              'paymentMode',
              'isSettled',
            ].includes(key)
          ) {
            oldDto[key] = oldEntity[key];
          } else if (
            [
              'amount',
              'currency',
              'settledOn',
              'paymentMode',
              'isSettled',
            ].includes(key) &&
            !paymentInfo
          ) {
            paymentInfo = oldEntity.paymentInfo;
            0;
          }
        } else if (value !== undefined) {
          oldDto[key] = oldEntity[key];
        }
      }

      if (type == 'Milestone' && paymentInfo) {
        oldDto['paymentInfo'] = oldEntity.paymentInfo;
        dto.paymentInfo = true;
      }

      const activities: Array<Object> = [];

      for (const [key, value] of Object.entries(dto)) {
        if (
          value !== undefined &&
          String(oldDto[key]) != String(newEntity[key])
        ) {
          const actsObj = {
            project: projectId,
            meta,
            operation,
            type,
            createdBy: userId,
            field: key,
            from: String(oldDto[key]),
            to: String(newEntity[key]),
            // description: `${type} updated for ${key} changed from ${String(oldDto[key])} to ${String(newEntity[key])}.`,
          };
          if (type == 'Milestone' && key == 'paymentInfo') {
            actsObj.from = undefined;
            actsObj.to = undefined;
            actsObj['description'] = 'Milestone updated for Payment-Info.';
          }

          actsObj[
            type != 'Query-Response' ? type.toLowerCase() : 'QueryResponse'
          ] = oldEntity._id;
          (actsObj['description'] = `${
            type != 'Query-Response' ? type : 'QueryResponse'
          } got updated; for ${key}; from ${String(oldDto[key])} to ${String(
            newEntity[key],
          )}.`),
            activities.push(actsObj);
        }
      }

      this.actsService.createActivity(activities);
      return;
    } catch (err) {
      throw err;
    }
  }

  async createAttachmentActivities(
    userId,
    type,
    addAttachments,
    deleteAttachments,
    meta,
    entity,
    projectId,
  ) {
    try {
      const activity = {
        operation: 'Update',
        type,
        createdBy: userId,
        field: 'Attachments',
        meta,
        project: projectId,
      };

      if (addAttachments.length > 0) {
        if (type == 'Bug') {
          activity['bug'] = entity._id;
          activity[
            'description'
          ] = `${addAttachments.length} attachments added to bug with S.No.- ${entity.sNo}.`;
        } else if (type == 'Query-Response') {
          activity['queryResponse'] = entity._id;
          activity[
            'descrition'
          ] = `${addAttachments.length} attachments added to query-response.`;
        } else {
          activity[type.toLowerCase()] = entity._id;
          activity[
            'descrition'
          ] = `${addAttachments.length} attachments added to ${type}.`;
        }

        this.actsService.createActivity([activity]);
      }

      if (deleteAttachments.length > 0) {
        if (type == 'Bug') {
          activity['bug'] = entity._id;
          activity[
            'description'
          ] = `${deleteAttachments.length} attachments deleted from bug with S.No.- ${entity.sNo}.`;
        } else if (type == 'Query-Response') {
          activity['queryResponse'] = entity._id;
          activity[
            'description'
          ] = `${deleteAttachments.length} attachments deleted from query-response.`;
        } else {
          activity[type.toLowerCase()] = entity._id;
          activity[
            'description'
          ] = `${deleteAttachments.length} attachments deleted from ${type}.`;
        }

        this.actsService.createActivity([activity]);
      }

      return;
    } catch (err) {
      throw err;
    }
  }

  async decryptAccountData(account) {
    if (!account) return null;
    account.accountName = account.accountName
      ? this.decryptData(account.accountName)
      : undefined;
    account.accountNumber = account.accountNumber
      ? this.decryptData(account.accountNumber)
      : undefined;
    account.ifscCode = account.ifscCode
      ? this.decryptData(account.ifscCode)
      : undefined;
    account.swiftCode = account.swiftCode
      ? this.decryptData(account.swiftCode)
      : undefined;
    account.micrCode = account.micrCode
      ? this.decryptData(account.micrCode)
      : undefined;

    return account;
  }

  async decryptCustomerData(customer) {
    customer.fullName = customer.fullName
      ? this.decryptData(customer.fullName)
      : undefined;
    customer.email = customer.email
      ? this.decryptData(customer.email)
      : undefined;
    customer.address = customer.address
      ? this.decryptData(customer.address)
      : undefined;

    return customer;
  }

  async decryptPaymentPhase(paymentPhase) {
    if (!paymentPhase || paymentPhase === 'NaN' || Number.isNaN(paymentPhase))
      return;
    paymentPhase.currency = paymentPhase?.currency
      ? this.decryptData(paymentPhase.currency)
      : undefined;
    paymentPhase.amount = paymentPhase?.amount
      ? this.decryptData(paymentPhase.amount)
      : undefined;
    paymentPhase.dueAmount = paymentPhase?.dueAmount
      ? this.decryptData(paymentPhase.dueAmount)
      : undefined;

    return paymentPhase;
  }

  async decryptInvoiceData(invoice) {
    invoice.paidAmount = invoice.paidAmount
      ? parseFloat(this.decryptData(invoice.paidAmount))
      : invoice.paidAmount;
    invoice.finalAmount = invoice.finalAmount
      ? parseFloat(this.decryptData(invoice.finalAmount))
      : invoice.finalAmount;
    invoice.basicAmount = invoice.basicAmount
      ? parseFloat(this.decryptData(invoice.basicAmount))
      : invoice.basicAmount;
    invoice.totalTaxes = invoice?.totalTaxes
      ? parseFloat(this.decryptData(invoice.totalTaxes))
      : invoice.totalTaxes;
    invoice.currency = invoice.currency
      ? this.decryptData(invoice.currency)
      : invoice.currency;
    invoice.billTo = invoice.billTo
      ? this.decryptData(invoice.billTo)
      : invoice.billTo;
    invoice.noteForClient = invoice.noteForClient
      ? this.decryptData(invoice.noteForClient)
      : invoice.noteForClient;
    invoice.paymentTerms = invoice.paymentTerms
      ? this.decryptData(invoice.paymentTerms)
      : invoice.paymentTerms;
    if (invoice.services && invoice.services.length > 0) {
      for (const ele of invoice.services) {
        if (ele === 'Nan' || Number.isNaN(ele)) {
          return;
        }
        ele.description = ele.description
          ? this.decryptData(ele.description)
          : undefined;
        ele.amount = ele.amount
          ? parseFloat(this.decryptData(ele.amount))
          : undefined;
        ele.rate = ele.rate
          ? parseFloat(this.decryptData(ele.rate))
          : undefined;
        ele.quantity = ele.quantity
          ? parseFloat(this.decryptData(ele.quantity))
          : undefined;
      }
    }

    if (invoice.discount) {
      invoice.discount.discountName = this.decryptData(
        invoice.discount.discountName,
      );
      invoice.discount.discountedAmount = parseFloat(
        this.decryptData(invoice.discount.discountedAmount),
      );
    }

    if (invoice.taxes) {
      for (const ele of invoice.taxes) {
        ele.taxName = this.decryptData(ele.taxName);
        ele.taxedAmount = this.decryptData(ele.taxedAmount);
      }
    }

    return invoice;
  }

  compareTwoArrays(array1: any[], array2: any[]) {
    const arr1 = array1.map((el) => String(el));
    const arr2 = array2.map((el) => String(el));
    let found = false;
    const foundElements = [];
    const notFoundElements = [];
    arr1.forEach((el, index) => {
      const isFound = arr2.includes(el);
      if (isFound) {
        if (!found) {
          found = true;
        }
        foundElements.push(el);
      } else {
        notFoundElements.push(el);
      }
    });

    return { found, foundElements, notFoundElements };
  }

  isUserProjectManager(managers: any[], user: any) {
    if (!managers || managers === null) {
      return false;
    }
    const projectManagers = managers?.map((el) => String(el));
    return projectManagers.includes(String(user));
  }

  isUserPermitted(user: any, orgId: any) {
    let permitted = false;
    user.userType.forEach((element) => {
      if (String(element.organisation) == orgId) {
        if (['Member+', 'Member++', 'Admin'].includes(element.userType)) {
          permitted = true;
        }
      }
    });
    return permitted;
  }
  // x = this.sendNotification({'en': 'Ye aaya kya'}, ['3c7e0894-8260-11ec-b156-fe8c4ace83d9', 'c427a530-825f-11ec-bd71-d20fae2a3316'])
}
