import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendVerificationEmail(email: string, name: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    const from =
      process.env.RESEND_FROM ||
      'Staffer.pl <no-reply@staffer.pl>';

    const mailOptions = {
      from,
      to: email,
      subject: 'Zweryfikuj swój email - Staffer.pl',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #FF8400;">Witaj ${name}!</h1>
          <p>Dziękujemy za rejestrację w Staffer.pl.</p>
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
            Jeśli nie rejestrowałeś się w Staffer.pl, zignoruj tę wiadomość.
          </p>
        </div>
      `,
      text: `
        Witaj ${name}!
        
        Dziękujemy za rejestrację w Staffer.pl.
        
        Aby zakończyć rejestrację, kliknij poniższy link aby zweryfikować swój adres email:
        ${verificationUrl}
        
        Jeśli nie rejestrowałeś się w Staffer.pl, zignoruj tę wiadomość.
      `,
    };

    try {
      const result = await this.resend.emails.send(mailOptions);
      console.log(
        `[EMAIL] Weryfikacja wysłana do: ${email}`,
        result?.data?.id ? `id=${result.data.id}` : '',
      );
    } catch (error) {
      console.error(`[EMAIL] Błąd wysyłania emaila do ${email}:`, error);
      // Nie rzucamy błędu - użytkownik może użyć resend-verification
    }
  }
}

