import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import { MailConfigKey } from './mail.type';

export interface SendTempPasswordParams {
  to: string;
  displayName: string;
  tempPassword: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress = this.configService.getOrThrow<string>(
      MailConfigKey.SmtpFrom,
    );
    this.frontendUrl = this.configService.getOrThrow<string>(
      MailConfigKey.FrontendUrl,
    );

    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>(MailConfigKey.SmtpHost),
      port: this.configService.get<number>(MailConfigKey.SmtpPort, 587),
      secure:
        this.configService.get<string>(MailConfigKey.SmtpSecure, 'false') ===
        'true',
      auth: {
        user: this.configService.getOrThrow<string>(MailConfigKey.SmtpUser),
        pass: this.configService.getOrThrow<string>(MailConfigKey.SmtpPass),
      },
    });
  }

  async sendTempPasswordEmail(params: SendTempPasswordParams): Promise<void> {
    const { to, displayName, tempPassword } = params;
    const loginUrl = `${this.frontendUrl}/login`;

    try {
      await this.transporter.sendMail({
        from: `"PickUs" <${this.fromAddress}>`,
        to,
        subject: 'סיסמה זמנית לחשבון שלך — PickUs',
        text: this.buildPlainText(displayName, tempPassword, loginUrl),
        html: this.buildHtml(displayName, tempPassword, loginUrl),
      });

      this.logger.log(`Temporary password email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  private buildPlainText(
    displayName: string,
    tempPassword: string,
    loginUrl: string,
  ): string {
    return [
      `שלום ${displayName},`,
      '',
      'הופקה עבורך סיסמה זמנית לחשבון ה-PickUs שלך.',
      '',
      `סיסמה זמנית: ${tempPassword}`,
      '',
      `אנא התחבר/י בכתובת: ${loginUrl}`,
      '',
      'תתבקש/י להחליף את הסיסמה עם התחברותך הראשונה למערכת.',
      '',
      'אם לא ביקשת זאת, אנא פנה/י למנהל/ת המערכת שלך.',
      '',
      '— צוות PickUs',
    ].join('\n');
  }

  private buildHtml(
    displayName: string,
    tempPassword: string,
    loginUrl: string,
  ): string {
    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f9fafb;
    }
  </style>
</head>
<body style="direction: rtl; text-align: right; background-color: #f9fafb; padding: 20px;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; margin: auto;">
    <tr>
      <td style="padding: 30px 0; text-align: center;">
      <img src="https://res.cloudinary.com/djlyxzaj7/image/upload/v1774385274/logo_rxckuq.jpg" alt="PickUs Logo" width="100" height="100" style="display: block; margin: 0 auto; width: 100px; height: 100px; max-width: 100px; border-radius: 12px;" />
    </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 40px 40px;">
        <h2 style="color: #3E3699; margin-top: 0; font-size: 24px; font-weight: 600;">שלום ${displayName},</h2>
        
        <p style="color: #374151; line-height: 1.6; font-size: 16px;">הופקה עבורך סיסמה זמנית לחשבון ה-<strong style="color: #5C52C8;">PickUs</strong> שלך.</p>
        
        <div style="background: #FDE27A; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center; border: 1px solid #F5C842;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #3E3699; font-weight: 600;">זוהי הסיסמה הזמנית שלך:</p>
          <code style="font-family: 'Courier New', Courier, monospace; font-size: 26px; color: #3E3699; font-weight: bold; letter-spacing: 1.5px; word-break: break-all; -webkit-user-select: all; user-select: all;">${tempPassword}</code>
        </div>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${loginUrl}" style="background-color: #5C52C8; color: #ffffff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
            התחבר/י ל-PickUs
          </a>
        </div>
        
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">תתבקש/י להחליף את הסיסמה עם התחברותך הראשונה למערכת.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 35px 0;" />
        
        <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          אם לא ביקשת זאת, אנא פנה/י למנהל/ת המערכת שלך.
          <br><br>
          <strong style="color: #3E3699;">— צוות PickUs</strong>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
