import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendVerificationEmail(email: string, name: string, token: string) {
    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      'http://localhost:3000';
    const verificationUrl = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${token}`;
    const from =
      process.env.RESEND_FROM ||
      'Staffer.pl <no-reply@staffer.pl>';

    const mailOptions = {
      from,
      to: email,
      subject: 'Zweryfikuj swój email - Staffer.pl',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f9fafb; padding: 32px; color: #111;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://dummyimage.com/160x48/8FACDB/ffffff&text=Staffer.pl" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
            <h1 style="color: #FF8400; font-size: 22px; margin: 0 0 12px;">Witaj ${name}!</h1>
            <p style="margin: 0 0 12px; line-height: 1.6;">
              Dziękujemy za rejestrację w Staffer.pl. Aby dokończyć proces, potwierdź swój adres e-mail.
            </p>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #FF8400; color: white; padding: 14px 28px;
                        text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Zweryfikuj email
              </a>
            </p>
            <p style="margin: 0 0 12px; line-height: 1.6; font-size: 14px; color: #555; text-align: center;">
              Jeśli przycisk nie działa, skopiuj ten link:
            </p>
            <p style="word-break: break-all; color: #444; font-size: 13px; background: #f3f4f6; padding: 10px 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
              ${verificationUrl}
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="margin: 0 0 8px; font-size: 14px; color: #333; font-weight: 600;">Co dalej?</p>
            <ul style="margin: 0 0 16px 18px; padding: 0; color: #555; line-height: 1.6; font-size: 14px;">
              <li>Po weryfikacji zaloguj się i dokończ onboarding zespołu.</li>
              <li>Jeśli dołączasz do istniejącego zespołu, menedżer zaakceptuje Twoją prośbę.</li>
              <li>W razie problemów skontaktuj się z nami, odpowiadając na tę wiadomość.</li>
            </ul>
            <p style="margin: 0; font-size: 12px; color: #777;">
              Jeśli nie rejestrowałeś się w Staffer.pl, zignoruj tę wiadomość.
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
          </p>
        </div>
      `,
      text: `
        Witaj ${name}!
        
        Dziękujemy za rejestrację w Staffer.pl.
        
        Aby zakończyć rejestrację, kliknij poniższy link aby zweryfikować swój adres email:
        ${verificationUrl}
        
        Jeśli przycisk nie działa, skopiuj ten link: ${verificationUrl}
        
        Jeśli nie rejestrowałeś się w Staffer.pl, zignoruj tę wiadomość.
        
        Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
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

