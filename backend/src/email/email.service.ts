import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  private get frontendUrl(): string {
    const url = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL;
    if (!url) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('FRONTEND_URL must be set in production');
      }
      return 'http://localhost:3000';
    }
    return url.replace(/\/$/, '');
  }

  private get fromAddress(): string {
    return process.env.RESEND_FROM || 'Staffer.pl <no-reply@staffer.pl>';
  }

  private get emailLogoUrl(): string {
    return process.env.EMAIL_LOGO_URL || 'https://dummyimage.com/160x48/10B77F/ffffff&text=Staffer.pl';
  }

  /** Reusable email footer with unsubscribe hint */
  private emailFooter(unsubscribeNote = true): string {
    const unsub = unsubscribeNote
      ? `<p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 8px;">
           Aby zmienić preferencje powiadomień email, przejdź do
           <a href="${this.frontendUrl}/settings" style="color: #10B77F;">Ustawień</a>
           w aplikacji.
         </p>`
      : '';
    return `
      ${unsub}
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
        Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
      </p>
    `;
  }

  /** Wrap content in the standard email layout */
  private wrapEmail(content: string, showUnsubscribe = true): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f9fafb; padding: 32px; color: #111;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${this.emailLogoUrl}" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
          ${content}
        </div>
        ${this.emailFooter(showUnsubscribe)}
      </div>
    `;
  }

  private async send(to: string, subject: string, html: string, text: string, logLabel: string) {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY is missing. Skipping email send.');
      return;
    }
    try {
      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html,
        text,
      });
      const emailId = result?.data?.id;
      this.logger.log(`${logLabel} sent to ${to}${emailId ? ` (id=${emailId})` : ''}`);
    } catch (error) {
      this.logger.error(`Błąd wysyłania ${logLabel} do ${to}: ${error?.message ?? error}`);
    }
  }

  // ── Schedule notifications ──────────────────────────────────

  /** Batch email: schedule published — lists all assigned shifts in one email */
  async sendSchedulePublishedEmail(
    email: string,
    name: string,
    shifts: { roleName: string; date: string; time: string }[],
  ) {
    const shiftRows = shifts
      .map(
        (s) =>
          `<tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #333;">${s.roleName}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #555;">${s.date}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #555;">${s.time}</td>
          </tr>`,
      )
      .join('');

    const content = `
      <h1 style="color: #10B77F; font-size: 22px; margin: 0 0 12px;">Nowy grafik opublikowany</h1>
      <p style="margin: 0 0 12px; line-height: 1.6;">
        Cześć ${name}, został opublikowany nowy grafik z <strong>${shifts.length}</strong> zmian${shifts.length === 1 ? 'ą' : shifts.length < 5 ? 'ami' : 'ami'} dla Ciebie:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #555;">Stanowisko</th>
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #555;">Data</th>
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #555;">Godziny</th>
          </tr>
        </thead>
        <tbody>${shiftRows}</tbody>
      </table>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${this.frontendUrl}/grafik"
           style="background-color: #10B77F; color: white; padding: 14px 28px;
                  text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
          Zobacz grafik
        </a>
      </p>
    `;

    const shiftList = shifts.map((s) => `  - ${s.roleName}: ${s.date}, ${s.time}`).join('\n');
    const text = `Cześć ${name},\n\nZostał opublikowany nowy grafik z ${shifts.length} zmianami:\n\n${shiftList}\n\nZobacz grafik: ${this.frontendUrl}/grafik\n\nAby zmienić preferencje powiadomień, przejdź do Ustawień w aplikacji.\n\nStaffer.pl`;

    await this.send(
      email,
      'Nowy grafik opublikowany - Staffer.pl',
      this.wrapEmail(content),
      text,
      'Schedule published email',
    );
  }

  /** Email: you were assigned to a shift */
  async sendShiftAssignedEmail(
    email: string,
    name: string,
    roleName: string,
    date: string,
    time: string,
  ) {
    const content = `
      <h1 style="color: #10B77F; font-size: 22px; margin: 0 0 12px;">Nowa zmiana</h1>
      <p style="margin: 0 0 12px; line-height: 1.6;">
        Cześć ${name}, zostałeś przypisany do nowej zmiany:
      </p>
      <div style="background: #f3f4f6; border-left: 4px solid #10B77F; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #333; font-size: 16px;">${roleName}</p>
        <p style="margin: 0; color: #555; font-size: 14px;">${date} &middot; ${time}</p>
      </div>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${this.frontendUrl}/grafik"
           style="background-color: #10B77F; color: white; padding: 14px 28px;
                  text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
          Zobacz grafik
        </a>
      </p>
    `;

    const text = `Cześć ${name},\n\nZostałeś przypisany do zmiany: ${roleName} (${date}, ${time}).\n\nZobacz grafik: ${this.frontendUrl}/grafik\n\nStaffer.pl`;

    await this.send(
      email,
      `Nowa zmiana: ${roleName} (${date}) - Staffer.pl`,
      this.wrapEmail(content),
      text,
      'Shift assigned email',
    );
  }

  /** Email: urgent announcement */
  async sendUrgentAnnouncementEmail(
    email: string,
    name: string,
    announcementTitle: string,
    announcementContent: string,
    authorName: string,
  ) {
    const content = `
      <h1 style="color: #dc2626; font-size: 22px; margin: 0 0 12px;">🔴 Pilne ogłoszenie</h1>
      <p style="margin: 0 0 12px; line-height: 1.6;">
        Cześć ${name}, menedżer opublikował pilne ogłoszenie:
      </p>
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0 0 8px; font-weight: 700; color: #333; font-size: 16px;">${announcementTitle}</p>
        <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6; white-space: pre-line;">${announcementContent}</p>
        <p style="margin: 8px 0 0; color: #999; font-size: 12px;">— ${authorName}</p>
      </div>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${this.frontendUrl}/announcements"
           style="background-color: #10B77F; color: white; padding: 14px 28px;
                  text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
          Zobacz ogłoszenia
        </a>
      </p>
    `;

    const text = `Cześć ${name},\n\nPilne ogłoszenie od ${authorName}:\n\n${announcementTitle}\n${announcementContent}\n\nZobacz ogłoszenia: ${this.frontendUrl}/announcements\n\nStaffer.pl`;

    await this.send(
      email,
      `🔴 Pilne: ${announcementTitle} - Staffer.pl`,
      this.wrapEmail(content),
      text,
      'Urgent announcement email',
    );
  }

  async sendVerificationEmail(email: string, name: string, token: string) {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY is missing. Skipping email send.');
      return;
    }

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
            <img src="${this.emailLogoUrl}" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
            <h1 style="color: #10B77F; font-size: 22px; margin: 0 0 12px;">Witaj ${name}!</h1>
            <p style="margin: 0 0 12px; line-height: 1.6;">
              Dziękujemy za rejestrację w Staffer.pl. Aby dokończyć proces, potwierdź swój adres e-mail.
            </p>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #10B77F; color: white; padding: 14px 28px;
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
      const emailId = result?.data?.id;
      if (emailId) {
        this.logger.log(`Verification email sent to ${email} (id=${emailId}).`);
      } else {
        this.logger.log(`Verification email sent to ${email}.`);
      }
    } catch (error) {
      this.logger.error(`Błąd wysyłania emaila do ${email}: ${error?.message ?? error}`);
      // Nie rzucamy błędu - użytkownik może użyć resend-verification
    }
  }

  async sendJoinRequestNotification(
    managerEmail: string,
    managerName: string,
    applicantName: string,
    applicantEmail: string,
    teamName: string,
  ) {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY is missing. Skipping email send.');
      return;
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      'http://localhost:3000';
    const dashboardUrl = `${frontendUrl.replace(/\/$/, '')}`;
    const from =
      process.env.RESEND_FROM ||
      'Staffer.pl <no-reply@staffer.pl>';

    const mailOptions = {
      from,
      to: managerEmail,
      subject: `Nowe zgłoszenie do zespołu ${teamName} - Staffer.pl`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f9fafb; padding: 32px; color: #111;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${this.emailLogoUrl}" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
            <h1 style="color: #10B77F; font-size: 22px; margin: 0 0 12px;">Witaj ${managerName}!</h1>
            <p style="margin: 0 0 12px; line-height: 1.6;">
              Otrzymałeś nowe zgłoszenie do dołączenia do zespołu <strong>${teamName}</strong>.
            </p>
            <div style="background: #f3f4f6; border-left: 4px solid #10B77F; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-weight: 600; color: #333;">Zgłoszenie od:</p>
              <p style="margin: 0; color: #555;">
                <strong>${applicantName}</strong><br />
                ${applicantEmail}
              </p>
            </div>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${dashboardUrl}"
                 style="background-color: #10B77F; color: white; padding: 14px 28px;
                        text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Przejdź do panelu zarządzania
              </a>
            </p>
            <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
              W panelu zarządzania możesz zaakceptować lub odrzucić zgłoszenie. Użytkownik zostanie powiadomiony o Twojej decyzji.
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
          </p>
        </div>
      `,
      text: `
        Witaj ${managerName}!
        
        Otrzymałeś nowe zgłoszenie do dołączenia do zespołu ${teamName}.
        
        Zgłoszenie od:
        ${applicantName}
        ${applicantEmail}
        
        Przejdź do panelu zarządzania: ${dashboardUrl}
        
        W panelu zarządzania możesz zaakceptować lub odrzucić zgłoszenie. Użytkownik zostanie powiadomiony o Twojej decyzji.
        
        Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
      `,
    };

    try {
      const result = await this.resend.emails.send(mailOptions);
      const emailId = result?.data?.id;
      if (emailId) {
        this.logger.log(`Join request notification sent to ${managerEmail} (id=${emailId}).`);
      } else {
        this.logger.log(`Join request notification sent to ${managerEmail}.`);
      }
    } catch (error) {
      this.logger.error(`Błąd wysyłania powiadomienia o zgłoszeniu do ${managerEmail}: ${error?.message ?? error}`);
      // Nie rzucamy błędu - powiadomienie nie jest krytyczne
    }
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY is missing. Skipping email send.');
      return;
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      'http://localhost:3000';
    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
    const from =
      process.env.RESEND_FROM ||
      'Staffer.pl <no-reply@staffer.pl>';

    const mailOptions = {
      from,
      to: email,
      subject: 'Reset hasła - Staffer.pl',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f9fafb; padding: 32px; color: #111;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${this.emailLogoUrl}" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
            <h1 style="color: #10B77F; font-size: 22px; margin: 0 0 12px;">Witaj ${name}!</h1>
            <p style="margin: 0 0 12px; line-height: 1.6;">
              Otrzymaliśmy prośbę o reset hasła do Twojego konta w Staffer.pl. Jeśli to Ty, kliknij poniższy przycisk, aby ustawić nowe hasło.
            </p>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${resetUrl}"
                 style="background-color: #10B77F; color: white; padding: 14px 28px;
                        text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Zresetuj hasło
              </a>
            </p>
            <p style="margin: 0 0 12px; line-height: 1.6; font-size: 14px; color: #555; text-align: center;">
              Jeśli przycisk nie działa, skopiuj ten link:
            </p>
            <p style="word-break: break-all; color: #444; font-size: 13px; background: #f3f4f6; padding: 10px 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
              ${resetUrl}
            </p>
            <p style="margin: 16px 0 8px; font-size: 14px; color: #dc2626; font-weight: 600;">
              ⚠️ Ważne informacje:
            </p>
            <ul style="margin: 0 0 16px 18px; padding: 0; color: #555; line-height: 1.6; font-size: 14px;">
              <li>Link jest ważny przez 1 godzinę.</li>
              <li>Po zresetowaniu hasła, link przestanie działać.</li>
              <li>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</li>
            </ul>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="margin: 0; font-size: 12px; color: #777;">
              Jeśli nie prosiłeś o reset hasła, Twoje konto pozostaje bezpieczne. Możesz zignorować tę wiadomość.
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
          </p>
        </div>
      `,
      text: `
        Witaj ${name}!
        
        Otrzymaliśmy prośbę o reset hasła do Twojego konta w Staffer.pl.
        
        Aby zresetować hasło, kliknij poniższy link:
        ${resetUrl}
        
        Link jest ważny przez 1 godzinę.
        
        Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość. Twoje konto pozostaje bezpieczne.
        
        Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
      `,
    };

    try {
      const result = await this.resend.emails.send(mailOptions);
      const emailId = result?.data?.id;
      if (emailId) {
        this.logger.log(`Password reset email sent to ${email} (id=${emailId}).`);
      } else {
        this.logger.log(`Password reset email sent to ${email}.`);
      }
    } catch (error) {
      this.logger.error(`Błąd wysyłania emaila resetu hasła do ${email}: ${error?.message ?? error}`);
      throw error; // Rzucamy błąd, bo to ważna operacja
    }
  }

  async sendMembershipApprovedNotification(
    userEmail: string,
    userName: string,
    teamName: string,
  ) {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY is missing. Skipping email send.');
      return;
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      'http://localhost:3000';
    const dashboardUrl = `${frontendUrl.replace(/\/$/, '')}`;
    const from =
      process.env.RESEND_FROM ||
      'Staffer.pl <no-reply@staffer.pl>';

    const mailOptions = {
      from,
      to: userEmail,
      subject: `Zostałeś zaakceptowany do zespołu ${teamName} - Staffer.pl`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f9fafb; padding: 32px; color: #111;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${this.emailLogoUrl}" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
            <h1 style="color: #10b981; font-size: 22px; margin: 0 0 12px;">Gratulacje, ${userName}!</h1>
            <p style="margin: 0 0 12px; line-height: 1.6;">
              Twoje zgłoszenie do zespołu <strong>${teamName}</strong> zostało zaakceptowane!
            </p>
            <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; color: #065f46; font-weight: 600;">
                Jesteś teraz aktywnym członkiem zespołu i możesz korzystać z wszystkich funkcji Staffer.pl.
              </p>
            </div>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${dashboardUrl}"
                 style="background-color: #10B77F; color: white; padding: 14px 28px;
                        text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Przejdź do panelu
              </a>
            </p>
            <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
              Możesz teraz przeglądać zmiany, zgłaszać się na nie i zarządzać swoim grafikiem pracy.
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
          </p>
        </div>
      `,
      text: `
        Gratulacje, ${userName}!
        
        Twoje zgłoszenie do zespołu ${teamName} zostało zaakceptowane!
        
        Jesteś teraz aktywnym członkiem zespołu i możesz korzystać z wszystkich funkcji Staffer.pl.
        
        Przejdź do panelu: ${dashboardUrl}
        
        Możesz teraz przeglądać zmiany, zgłaszać się na nie i zarządzać swoim grafikiem pracy.
        
        Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
      `,
    };

    try {
      const result = await this.resend.emails.send(mailOptions);
      const emailId = result?.data?.id;
      if (emailId) {
        this.logger.log(`Membership approved notification sent to ${userEmail} (id=${emailId}).`);
      } else {
        this.logger.log(`Membership approved notification sent to ${userEmail}.`);
      }
    } catch (error) {
      this.logger.error(`Błąd wysyłania powiadomienia o akceptacji do ${userEmail}: ${error?.message ?? error}`);
      // Nie rzucamy błędu - powiadomienie nie jest krytyczne
    }
  }

  async sendMembershipRejectedNotification(
    userEmail: string,
    userName: string,
    teamName: string,
  ) {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY is missing. Skipping email send.');
      return;
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      'http://localhost:3000';
    const dashboardUrl = `${frontendUrl.replace(/\/$/, '')}`;
    const from =
      process.env.RESEND_FROM ||
      'Staffer.pl <no-reply@staffer.pl>';

    const mailOptions = {
      from,
      to: userEmail,
      subject: `Informacja o zgłoszeniu do zespołu ${teamName} - Staffer.pl`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f9fafb; padding: 32px; color: #111;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${this.emailLogoUrl}" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
            <h1 style="color: #10B77F; font-size: 22px; margin: 0 0 12px;">Witaj ${userName}!</h1>
            <p style="margin: 0 0 12px; line-height: 1.6;">
              Niestety, Twoje zgłoszenie do zespołu <strong>${teamName}</strong> zostało odrzucone.
            </p>
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; color: #991b1b;">
                Jeśli uważasz, że to pomyłka, skontaktuj się z menedżerem zespołu bezpośrednio.
              </p>
            </div>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${dashboardUrl}"
                 style="background-color: #10B77F; color: white; padding: 14px 28px;
                        text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Przejdź do panelu
              </a>
            </p>
            <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">
              Możesz dołączyć do innego zespołu używając kodu zaproszenia lub utworzyć własny zespół.
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
          </p>
        </div>
      `,
      text: `
        Witaj ${userName}!
        
        Niestety, Twoje zgłoszenie do zespołu ${teamName} zostało odrzucone.
        
        Jeśli uważasz, że to pomyłka, skontaktuj się z menedżerem zespołu bezpośrednio.
        
        Przejdź do panelu: ${dashboardUrl}
        
        Możesz dołączyć do innego zespołu używając kodu zaproszenia lub utworzyć własny zespół.
        
        Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
      `,
    };

    try {
      const result = await this.resend.emails.send(mailOptions);
      const emailId = result?.data?.id;
      if (emailId) {
        this.logger.log(`Membership rejected notification sent to ${userEmail} (id=${emailId}).`);
      } else {
        this.logger.log(`Membership rejected notification sent to ${userEmail}.`);
      }
    } catch (error) {
      this.logger.error(`Błąd wysyłania powiadomienia o odrzuceniu do ${userEmail}: ${error?.message ?? error}`);
      // Nie rzucamy błędu - powiadomienie nie jest krytyczne
    }
  }

  async sendWelcomeEmailOwner(email: string, name: string, teamName: string) {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY is missing. Skipping email send.');
      return;
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      'http://localhost:3000';
    const dashboardUrl = `${frontendUrl.replace(/\/$/, '')}`;
    const from =
      process.env.RESEND_FROM ||
      'Staffer.pl <no-reply@staffer.pl>';

    const mailOptions = {
      from,
      to: email,
      subject: `Witaj w Staffer.pl! Twój zespół ${teamName} jest gotowy - Staffer.pl`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f9fafb; padding: 32px; color: #111;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${this.emailLogoUrl}" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
            <h1 style="color: #10b981; font-size: 22px; margin: 0 0 12px;">Witaj ${name}!</h1>
            <p style="margin: 0 0 12px; line-height: 1.6;">
              Gratulujemy! Twój zespół <strong>${teamName}</strong> został utworzony i jest gotowy do pracy.
            </p>
            <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; color: #065f46; font-weight: 600;">
                Jesteś teraz właścicielem zespołu i możesz zarządzać zmianami, dodawać członków i tworzyć grafik.
              </p>
            </div>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${dashboardUrl}"
                 style="background-color: #10B77F; color: white; padding: 14px 28px;
                        text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Przejdź do panelu zarządzania
              </a>
            </p>
            <p style="margin: 0 0 8px; font-size: 14px; color: #333; font-weight: 600;">Co możesz teraz zrobić?</p>
            <ul style="margin: 0 0 16px 18px; padding: 0; color: #555; line-height: 1.6; font-size: 14px;">
              <li>Dodaj zmiany do grafiku i opublikuj je dla swojego zespołu</li>
              <li>Zaproś członków zespołu używając kodu zaproszenia</li>
              <li>Zarządzaj profilami pracowników i ich umiejętnościami</li>
              <li>Akceptuj lub odrzucaj zgłoszenia do zespołu</li>
            </ul>
            <p style="margin: 0; font-size: 12px; color: #777;">
              Jeśli masz pytania, odpowiadając na tę wiadomość skontaktujesz się z nami.
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
          </p>
        </div>
      `,
      text: `
        Witaj ${name}!
        
        Gratulujemy! Twój zespół ${teamName} został utworzony i jest gotowy do pracy.
        
        Jesteś teraz właścicielem zespołu i możesz zarządzać zmianami, dodawać członków i tworzyć grafik.
        
        Przejdź do panelu zarządzania: ${dashboardUrl}
        
        Co możesz teraz zrobić?
        - Dodaj zmiany do grafiku i opublikuj je dla swojego zespołu
        - Zaproś członków zespołu używając kodu zaproszenia
        - Zarządzaj profilami pracowników i ich umiejętnościami
        - Akceptuj lub odrzucaj zgłoszenia do zespołu
        
        Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
      `,
    };

    try {
      const result = await this.resend.emails.send(mailOptions);
      const emailId = result?.data?.id;
      if (emailId) {
        this.logger.log(`Welcome email (owner) sent to ${email} (id=${emailId}).`);
      } else {
        this.logger.log(`Welcome email (owner) sent to ${email}.`);
      }
    } catch (error) {
      this.logger.error(`Błąd wysyłania maila powitalnego (owner) do ${email}: ${error?.message ?? error}`);
      // Nie rzucamy błędu - mail powitalny nie jest krytyczny
    }
  }

  async sendWelcomeEmailEmployee(email: string, name: string, teamName: string) {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY is missing. Skipping email send.');
      return;
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      'http://localhost:3000';
    const dashboardUrl = `${frontendUrl.replace(/\/$/, '')}`;
    const from =
      process.env.RESEND_FROM ||
      'Staffer.pl <no-reply@staffer.pl>';

    const mailOptions = {
      from,
      to: email,
      subject: `Witaj w zespole ${teamName}! - Staffer.pl`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f9fafb; padding: 32px; color: #111;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${this.emailLogoUrl}" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
            <h1 style="color: #10b981; font-size: 22px; margin: 0 0 12px;">Witaj ${name}!</h1>
            <p style="margin: 0 0 12px; line-height: 1.6;">
              Twoje zgłoszenie do zespołu <strong>${teamName}</strong> zostało zaakceptowane! Witamy w zespole!
            </p>
            <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; color: #065f46; font-weight: 600;">
                Jesteś teraz aktywnym członkiem zespołu i możesz przeglądać zmiany, zgłaszać się na nie i zarządzać swoim grafikiem pracy.
              </p>
            </div>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${dashboardUrl}"
                 style="background-color: #10B77F; color: white; padding: 14px 28px;
                        text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Przejdź do panelu
              </a>
            </p>
            <p style="margin: 0 0 8px; font-size: 14px; color: #333; font-weight: 600;">Co możesz teraz zrobić?</p>
            <ul style="margin: 0 0 16px 18px; padding: 0; color: #555; line-height: 1.6; font-size: 14px;">
              <li>Przeglądaj dostępne zmiany w grafiku</li>
              <li>Zgłaszaj się na zmiany, które Cię interesują</li>
              <li>Zarządzaj swoim profilem i umiejętnościami</li>
              <li>Oddawaj swoje zmiany na giełdę, jeśli nie możesz ich wykonać</li>
            </ul>
            <p style="margin: 0; font-size: 12px; color: #777;">
              Jeśli masz pytania, skontaktuj się z menedżerem zespołu lub odpowiadając na tę wiadomość.
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
          </p>
        </div>
      `,
      text: `
        Witaj ${name}!
        
        Twoje zgłoszenie do zespołu ${teamName} zostało zaakceptowane! Witamy w zespole!
        
        Jesteś teraz aktywnym członkiem zespołu i możesz przeglądać zmiany, zgłaszać się na nie i zarządzać swoim grafikiem pracy.
        
        Przejdź do panelu: ${dashboardUrl}
        
        Co możesz teraz zrobić?
        - Przeglądaj dostępne zmiany w grafiku
        - Zgłaszaj się na zmiany, które Cię interesują
        - Zarządzaj swoim profilem i umiejętnościami
        - Oddawaj swoje zmiany na giełdę, jeśli nie możesz ich wykonać
        
        Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
      `,
    };

    try {
      const result = await this.resend.emails.send(mailOptions);
      const emailId = result?.data?.id;
      if (emailId) {
        this.logger.log(`Welcome email (employee) sent to ${email} (id=${emailId}).`);
      } else {
        this.logger.log(`Welcome email (employee) sent to ${email}.`);
      }
    } catch (error) {
      this.logger.error(`Błąd wysyłania maila powitalnego (employee) do ${email}: ${error?.message ?? error}`);
      // Nie rzucamy błędu - mail powitalny nie jest krytyczny
    }
  }

  async sendWelcomeEmailAfterVerification(email: string, name: string) {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn('RESEND_API_KEY is missing. Skipping email send.');
      return;
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      'http://localhost:3000';
    const dashboardUrl = `${frontendUrl.replace(/\/$/, '')}`;
    const from =
      process.env.RESEND_FROM ||
      'Staffer.pl <no-reply@staffer.pl>';

    const mailOptions = {
      from,
      to: email,
      subject: 'Witaj w Staffer.pl! Twój email został zweryfikowany - Staffer.pl',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f9fafb; padding: 32px; color: #111;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${this.emailLogoUrl}" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
            <h1 style="color: #10b981; font-size: 22px; margin: 0 0 12px;">Witaj ${name}!</h1>
            <p style="margin: 0 0 12px; line-height: 1.6;">
              Twój adres email został pomyślnie zweryfikowany! Twoje konto w Staffer.pl jest teraz w pełni aktywne.
            </p>
            <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; color: #065f46; font-weight: 600;">
                Możesz teraz zalogować się i rozpocząć korzystanie z aplikacji.
              </p>
            </div>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${dashboardUrl}"
                 style="background-color: #10B77F; color: white; padding: 14px 28px;
                        text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Zaloguj się i rozpocznij
              </a>
            </p>
            <p style="margin: 0 0 8px; font-size: 14px; color: #333; font-weight: 600;">Co dalej?</p>
            <ul style="margin: 0 0 16px 18px; padding: 0; color: #555; line-height: 1.6; font-size: 14px;">
              <li>Zaloguj się do aplikacji używając swojego emaila i hasła</li>
              <li>Utwórz swój zespół lub dołącz do istniejącego używając kodu zaproszenia</li>
              <li>Zarządzaj zmianami i grafikiem pracy</li>
            </ul>
            <p style="margin: 0; font-size: 12px; color: #777;">
              Jeśli masz pytania, odpowiadając na tę wiadomość skontaktujesz się z nami.
            </p>
          </div>
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
          </p>
        </div>
      `,
      text: `
        Witaj ${name}!
        
        Twój adres email został pomyślnie zweryfikowany! Twoje konto w Staffer.pl jest teraz w pełni aktywne.
        
        Możesz teraz zalogować się i rozpocząć korzystanie z aplikacji.
        
        Zaloguj się i rozpocznij: ${dashboardUrl}
        
        Co dalej?
        - Zaloguj się do aplikacji używając swojego emaila i hasła
        - Utwórz swój zespół lub dołącz do istniejącego używając kodu zaproszenia
        - Zarządzaj zmianami i grafikiem pracy
        
        Staffer.pl — Bezpieczne zarządzanie zmianami i zespołami.
      `,
    };

    try {
      const result = await this.resend.emails.send(mailOptions);
      const emailId = result?.data?.id;
      if (emailId) {
        this.logger.log(`Welcome email (after verification) sent to ${email} (id=${emailId}).`);
      } else {
        this.logger.log(`Welcome email (after verification) sent to ${email}.`);
      }
    } catch (error) {
      this.logger.error(`Błąd wysyłania maila powitalnego (after verification) do ${email}: ${error?.message ?? error}`);
      // Nie rzucamy błędu - mail powitalny nie jest krytyczny
    }
  }

  /** Email: payment failed — notify team owner */
  async sendPaymentFailedEmail(
    email: string,
    name: string,
    teamName: string,
    invoiceId?: string,
  ) {
    const content = `
      <h1 style="color: #dc2626; font-size: 22px; margin: 0 0 12px;">⚠️ Problem z płatnością</h1>
      <p style="margin: 0 0 12px; line-height: 1.6;">
        Cześć ${name}, nie udało się pobrać płatności za subskrypcję zespołu <strong>${teamName}</strong>.
      </p>
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; color: #991b1b; font-weight: 600;">
          Zaktualizuj metodę płatności, aby uniknąć utraty dostępu do funkcji premium.
        </p>
        ${invoiceId ? `<p style="margin: 8px 0 0; color: #999; font-size: 12px;">ID faktury: ${invoiceId}</p>` : ''}
      </div>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${this.frontendUrl}/app/billing"
           style="background-color: #10B77F; color: white; padding: 14px 28px;
                  text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
          Zarządzaj subskrypcją
        </a>
      </p>
      <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.5;">
        Stripe automatycznie ponowi próbę pobrania płatności. Jeśli problem się powtórzy,
        Twój plan zostanie zmieniony na Darmowy.
      </p>
    `;

    const text = `Cześć ${name},\n\nNie udało się pobrać płatności za subskrypcję zespołu ${teamName}.\n\nZaktualizuj metodę płatności: ${this.frontendUrl}/app/billing\n\nStaffer.pl`;

    await this.send(
      email,
      `⚠️ Problem z płatnością — ${teamName} — Staffer.pl`,
      this.wrapEmail(content, false),
      text,
      'Payment failed email',
    );
  }
}

