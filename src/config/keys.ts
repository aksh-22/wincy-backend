export class Keys {
  PORT: string = null;
  MONGO_URI: string = null;
  JWT_SECRET: string = null;
  AWS_ID: string = null;
  AWS_SECRET: string = null;
  AWS_BUCKET_NAME: string = null;
  AWS_REGION: string = null;
  ENCRYPTION_SECRET: string = null;
  FOLDER_PROFILE_PIC: string = null;
  FOLDER_ORG_LOGO: string = null;
  FOLDER_PROJECT_LOGO: string = null;
  FOLDER_BUG_ATTACHMENT: string = null;
  FOLDER_TRANSACTION_ATTACHMENT: string = null;
  FOLDER_PROJECT_ATTACHMENT: string = null;
  SENDGRID_API_KEY: string = null;
  SENDGRID_INVITATION_TEMPLATE_ID: string = null;
  DOMAIN: string = null;
  FOLDER_QUERY_ATTACHMENT: string = null;
  FOLDER_REPLY_ATTACHMENT: string = null;
  ONE_SIGNAL_REST_API_KEY: string = null;
  ONE_SIGNAL_APP_ID: string = null;

  constructor() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('dotenv').config();
    } catch (error) {}
    this.prepareKeys();
  }

  prepareKeys() {
    // this.MONGO_URI =
    //   process.env.NODE_ENV === `test`
    //     ? process.env.MONGO_URI_TEST
    //     : process.env.MONGO_URI;
    this.PORT = process.env.PORT;
    this.MONGO_URI = process.env.MONGO_URI;
    this.JWT_SECRET = process.env.JWT_SECRET;
    this.AWS_ID = process.env.AWS_ID;
    this.AWS_SECRET = process.env.AWS_SECRET;
    this.AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
    this.AWS_REGION = process.env.AWS_REGION;
    this.ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
    this.FOLDER_PROFILE_PIC = process.env.FOLDER_PROFILE_PIC;
    this.FOLDER_ORG_LOGO = process.env.FOLDER_ORG_LOGO;
    this.FOLDER_PROJECT_LOGO = process.env.FOLDER_PROJECT_LOGO;
    this.FOLDER_BUG_ATTACHMENT = process.env.FOLDER_BUG_ATTACHMENT;
    this.FOLDER_PROJECT_ATTACHMENT = process.env.FOLDER_PROJECT_ATTACHMENT;
    this.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    this.SENDGRID_INVITATION_TEMPLATE_ID = process.env.SENDGRID_INVITATION_TEMPLATE_ID;
    this.DOMAIN = process.env.DOMAIN;
    this.FOLDER_QUERY_ATTACHMENT = process.env.FOLDER_QUERY_ATTACHMENT;
    this.FOLDER_REPLY_ATTACHMENT = process.env.FOLDER_REPLY_ATTACHMENT;
    this.FOLDER_TRANSACTION_ATTACHMENT = process.env.FOLDER_TRANSACTION_ATTACHMENT;
    this.ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
    this.ONE_SIGNAL_REST_API_KEY = process.env.ONE_SIGNAL_REST_API_KEY;
  }
}
