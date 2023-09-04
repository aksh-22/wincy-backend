import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to Wincy Backend. Looks like you should be visiting the Wincy web app at https://www.wincy.work. :) /n    28-08-2023 ||  04:27 PM';
  }
}
