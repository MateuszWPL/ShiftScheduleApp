import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Konfiguracja SMTP (dla developmentu można użyć Ethereal Email lub Gmail)
    // W produkcji użyj SendGrid, Resend, lub innego serwisu
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true dla 465, false dla innych portów
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, name: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"Shift Marketplace" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Zweryfikuj swój email - Shift Marketplace',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #FF8400;">Witaj ${name}!</h1>
          <p>Dziękujemy za rejestrację w Shift Marketplace.</p>
          <p>Aby zakończyć rejestrację, kliknij poniższy link aby zweryfikować swój adres email:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #FF8400; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Zweryfikuj Email
            </a>
          </p>
          <p>Lub skopiuj i wklej ten link do przeglądarki:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Jeśli nie rejestrowałeś się w Shift Marketplace, zignoruj tę wiadomość.
          </p>
        </div>
      `,
      text: `
        Witaj ${name}!
        
        Dziękujemy za rejestrację w Shift Marketplace.
        
        Aby zakończyć rejestrację, kliknij poniższy link aby zweryfikować swój adres email:
        ${verificationUrl}
        
        Jeśli nie rejestrowałeś się w Shift Marketplace, zignoruj tę wiadomość.
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Weryfikacja wysłana do: ${email}`);
    } catch (error) {
      console.error(`[EMAIL] Błąd wysyłania emaila do ${email}:`, error);
      throw error;
    }
  }
}

