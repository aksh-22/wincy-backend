import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to Wincy Backend. Looks like you should be visiting the Wincy web app at https://www.wincy.work. :) /n 23-01-2023 || 12:33 PM';
  }
}
