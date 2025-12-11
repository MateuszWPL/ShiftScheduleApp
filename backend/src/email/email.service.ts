import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
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
            <img src="https://dummyimage.com/160x48/8FACDB/ffffff&text=Staffer.pl" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
            <h1 style="color: #FF8400; font-size: 22px; margin: 0 0 12px;">Witaj ${managerName}!</h1>
            <p style="margin: 0 0 12px; line-height: 1.6;">
              Otrzymałeś nowe zgłoszenie do dołączenia do zespołu <strong>${teamName}</strong>.
            </p>
            <div style="background: #f3f4f6; border-left: 4px solid #FF8400; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-weight: 600; color: #333;">Zgłoszenie od:</p>
              <p style="margin: 0; color: #555;">
                <strong>${applicantName}</strong><br />
                ${applicantEmail}
              </p>
            </div>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${dashboardUrl}"
                 style="background-color: #FF8400; color: white; padding: 14px 28px;
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
            <img src="https://dummyimage.com/160x48/8FACDB/ffffff&text=Staffer.pl" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
            <h1 style="color: #FF8400; font-size: 22px; margin: 0 0 12px;">Witaj ${name}!</h1>
            <p style="margin: 0 0 12px; line-height: 1.6;">
              Otrzymaliśmy prośbę o reset hasła do Twojego konta w Staffer.pl. Jeśli to Ty, kliknij poniższy przycisk, aby ustawić nowe hasło.
            </p>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${resetUrl}"
                 style="background-color: #FF8400; color: white; padding: 14px 28px;
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
            <img src="https://dummyimage.com/160x48/8FACDB/ffffff&text=Staffer.pl" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
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
                 style="background-color: #FF8400; color: white; padding: 14px 28px;
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
            <img src="https://dummyimage.com/160x48/8FACDB/ffffff&text=Staffer.pl" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
          </div>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
            <h1 style="color: #FF8400; font-size: 22px; margin: 0 0 12px;">Witaj ${userName}!</h1>
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
                 style="background-color: #FF8400; color: white; padding: 14px 28px;
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
            <img src="https://dummyimage.com/160x48/8FACDB/ffffff&text=Staffer.pl" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
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
                 style="background-color: #FF8400; color: white; padding: 14px 28px;
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
            <img src="https://dummyimage.com/160x48/8FACDB/ffffff&text=Staffer.pl" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
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
                 style="background-color: #FF8400; color: white; padding: 14px 28px;
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
            <img src="https://dummyimage.com/160x48/8FACDB/ffffff&text=Staffer.pl" alt="Staffer.pl" style="max-width: 160px; height: auto;" />
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
                 style="background-color: #FF8400; color: white; padding: 14px 28px;
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
}

