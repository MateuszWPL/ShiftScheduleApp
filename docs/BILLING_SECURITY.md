# Zabezpieczenia płatności i planów

## Reguły biznesowe

### Trial (14 dni)
- **Raz na zespół** — flaga `trialUsed` w tabeli Subscription
- Pierwsza subskrypcja (Free → Starter/Business) przez Checkout: 14 dni za darmo
- Kolejne subskrypcje (po anulowaniu): brak trialu

### Upgrade (Starter → Business)
- **Bez darmowego upgrade** — jeśli użytkownik jest w trakcie trialu i klika "Ulepsz do Business+":
  - Trial kończy się natychmiast (`trial_end: 'now'`)
  - Płatność jest pobierana od razu (`proration_behavior: 'always_invoice'`)
  - Brak możliwości przedłużenia trialu przez zmianę planu

### Blokady
- **Checkout zablokowany** — użytkownik z aktywną subskrypcją (active/trialing) nie może utworzyć nowej sesji Checkout (unikamy drugiej subskrypcji i ewentualnego trialu)
- **Zmiana planu** — tylko przez endpoint `change-plan` (upgrade i downgrade)

## Konfiguracja Stripe

1. **Produkty/ceny** — NIE ustawiaj domyślnego trialu na Price w Stripe Dashboard. Trial jest kontrolowany wyłącznie przez backend (Checkout `trial_period_days`).
2. **Customer Portal** — jeśli włączysz "Switch plans", użytkownicy mogą zmieniać plany poza aplikacją. Zalecane: wyłączyć przełączanie planów w Portalu i używać tylko naszej strony /billing.
3. **Price ID** — używaj `price_xxx`, nigdy `prod_xxx` (Product ID).
