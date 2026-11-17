> ⛔ **SUPERSEDED (2026-11-17):** contains outdated facts. Use `terms-customer.html` / `terms-salon.html`. See `REVIEW-terms-2026-11-17.md`.

# Carenes – Nutzungsbedingungen für Kunden (Customer App)

> **Ziel-Feld im Backend:** `TermsConditions.descriptionForCustomerApp`
> Dieser Text wird **nur Kunden** angezeigt. Für Salons gilt das separate Dokument `terms-and-conditions-client.md`.

## CAUTION

Backend-verifizierter Entwurf, Stand 2026-11-16 — **keine Rechtsberatung**. Vor Veröffentlichung von einem deutschen Anwalt prüfen lassen, insbesondere ⚠️ PRÜFEN-Stellen (Widerrufsrecht, Stornogebühr).

### Notizen für das Team (nicht veröffentlichen)

| Punkt | Status |
|---|---|
| Zahlungsarten | **Nur Stripe** — PayPal existiert nicht im Backend, wurde aus dem Originalentwurf entfernt |
| Button „Zahlungspflichtig buchen" | ⚠️ noch nicht als exakter Text im Buchungsablauf/Stripe-Checkout implementiert — Dev-Ticket vor Go-Live nötig (§ 312j Abs. 3 BGB) |
| Kostenlose Stornierung/Umbuchung | bis 2 Stunden vor Termin — im Code bestätigt (Stornierung); Umbuchungsfrist im Reschedule-Modul separat bestätigen |
| Automatische Fertigstellung | 3 Stunden nach Terminende, sofern kein „No-Show" — im Code bestätigt |
| Bewertungen nur nach abgeschlossener Buchung | ⚠️ im Backend aktuell **nicht** erzwungen — Dev-Ticket nötig, bevor § 6 live geht |
| Altersgrenze (16/18 Jahre) | ⚠️ im Backend aktuell nicht technisch erzwungen — nur vertragliches Versprechen |
| Platzhalter | `[FIRMA]`, `[ANSCHRIFT]`, `[VERTRETER]`, `[REGISTERGERICHT/HRB]`, `[USt-IdNr.]`, `[E-MAIL-SUPPORT]`, `[TELEFON]`, `[ERSTATTUNGSFRIST]`, `[DATUM]` |

---

## 🇩🇪 Nutzungsbedingungen für Kunden

**Stand:** [DATUM]

### Teil A – Allgemeine Bestimmungen

**§ 1 Anbieter und Geltungsbereich**

(1) Die Plattform „Carenes" (mobile App für iOS und Android) wird betrieben von [FIRMA], [ANSCHRIFT], vertreten durch [VERTRETER], eingetragen im Handelsregister [REGISTERGERICHT / HRB], USt-IdNr. [USt-IdNr.], E-Mail: [E-MAIL-SUPPORT] (nachfolgend „Carenes", „wir").

(2) Diese Bedingungen gelten für Kunden: Personen, die über Carenes Termine bei Salons suchen und buchen.

(3) Abweichende Bedingungen von Nutzern werden nicht Vertragsbestandteil, es sei denn, wir stimmen ihrer Geltung ausdrücklich in Textform zu.

**§ 2 Rolle von Carenes – Vermittlungsplattform**

(1) Carenes stellt eine technische Plattform bereit, über die Sie Salons finden, Termine buchen, bezahlen, mit Salons kommunizieren und Bewertungen abgeben können.

(2) Carenes ist nicht Erbringer der Friseur- oder Beauty-Dienstleistung. Der Vertrag über die gebuchte Dienstleistung (Behandlungsvertrag) kommt ausschließlich zwischen Ihnen und dem jeweiligen Salon zustande. Für die Durchführung, Qualität, Preise und Gewährleistung der Dienstleistung ist allein der Salon verantwortlich.

(3) Hinweis nach § 312l BGB / Art. 246d EGBGB: Alle auf Carenes angebotenen Salons sind nach eigener Erklärung Unternehmer. Die Verbraucherschutzvorschriften gelten daher für den Vertrag mit dem Salon. Carenes ist an diesem Vertrag nicht als Partei beteiligt und haftet nicht für dessen Erfüllung. Carenes ist jedoch für die ordnungsgemäße Abwicklung der Buchung und, bei Online-Zahlung, der Zahlung über die Plattform verantwortlich.

(4) Zwischen Carenes und Ihnen kommt ein Nutzungsvertrag über die Plattform zustande. Die Nutzung ist für Kunden kostenlos.

**§ 3 Registrierung und Nutzerkonto**

(1) Die Nutzung der Buchungsfunktionen setzt ein Nutzerkonto voraus. Die Registrierung ist ab 16 Jahren möglich. Minderjährige benötigen für kostenpflichtige Buchungen die Zustimmung ihrer gesetzlichen Vertreter. *(⚠️ Hinweis Team: derzeit technisch nicht durch das Backend erzwungen.)*

(2) Die bei der Registrierung abgefragten Angaben müssen wahrheitsgemäß und vollständig sein und aktuell gehalten werden. Die E-Mail-Adresse wird durch einen Bestätigungscode verifiziert.

(3) Zugangsdaten sind geheim zu halten. Bei Verdacht auf Missbrauch ist Carenes unverzüglich zu informieren. Jede Person darf nur ein Konto führen. Konten sind nicht übertragbar.

(4) Mit Abschluss der Registrierung akzeptieren Sie diese Bedingungen. Die Datenschutzerklärung wird zur Kenntnis genommen.

**§ 4 Verfügbarkeit der Plattform**

Wir bemühen uns um eine möglichst unterbrechungsfreie Verfügbarkeit, schulden diese jedoch nicht. Wartungsarbeiten, Sicherheitsupdates sowie Störungen außerhalb unseres Einflussbereichs (z. B. bei Mobilfunk- oder Zahlungsdiensten) können zu vorübergehenden Einschränkungen führen.

**§ 5 Ihre Pflichten**

Sie dürfen die Plattform nicht missbräuchlich verwenden. Insbesondere ist es untersagt:
- falsche Angaben zu machen oder ein Konto für Dritte ohne deren Einwilligung anzulegen
- Scheinbuchungen vorzunehmen oder Termine wiederholt ohne Absage nicht wahrzunehmen
- im Chat, in Bewertungen oder Bildern rechtswidrige, beleidigende, diskriminierende, pornografische oder urheberrechtsverletzende Inhalte zu verbreiten
- Werbung, Spam oder Kontaktdaten zum Zweck der Umgehung der Plattform zu verbreiten
- die Plattform durch automatisierte Zugriffe (Bots, Scraping) zu belasten oder Sicherheitsmechanismen zu umgehen

**§ 6 Bewertungen**

(1) Sie können einen Salon (Sterne und Text) und die behandelnde Person (Sterne) nur nach einem über Carenes gebuchten und abgeschlossenen Termin bewerten. Damit stellen wir sicher, dass Bewertungen von Personen stammen, die die Leistung tatsächlich in Anspruch genommen haben (§ 5b Abs. 3 UWG). *(⚠️ Hinweis Team: Backend prüft dies aktuell nicht — Entwicklungsticket nötig, bevor diese Klausel live geht.)*

(2) Bewertungen müssen auf eigenen Erfahrungen beruhen und sachlich sein. Für Bewertungen dürfen keine Gegenleistungen angeboten oder angenommen werden.

(3) Die Gesamtbewertung ist der Durchschnitt aller veröffentlichten Bewertungen. Bewertungen werden nicht gegen Bezahlung hervorgehoben oder unterdrückt. Wir entfernen Bewertungen, die gegen Gesetze oder diese Bedingungen verstoßen, insbesondere nach entsprechender Meldung.

**§ 7 Chat**

Der Chat dient ausschließlich der Kommunikation im Zusammenhang mit Terminen. Sie sind für die von Ihnen versandten Inhalte selbst verantwortlich.

**§ 8 Meldung rechtswidriger Inhalte (Digital Services Act)**

(1) Rechtswidrige Inhalte (z. B. in Bewertungen, Chats, Salonprofilen oder Bildern) können jederzeit an [E-MAIL-SUPPORT] gemeldet werden. Die Meldung sollte die Fundstelle, eine Begründung sowie Ihren Namen und Ihre E-Mail-Adresse enthalten (Art. 16 DSA).

(2) Wir prüfen Meldungen zeitnah, sorgfältig und objektiv und informieren Sie über unsere Entscheidung und die Gründe (Art. 17 DSA). Gegen Entscheidungen kann über dieselbe Adresse Beschwerde eingelegt werden.

(3) Zentrale Kontaktstelle für Behörden und Nutzer (Art. 11, 12 DSA): [E-MAIL-SUPPORT], Sprachen: Deutsch, Englisch.

**§ 9 Haftung von Carenes**

(1) Carenes haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz sowie im Umfang einer übernommenen Garantie.

(2) Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht haftet Carenes nur für den vertragstypischen, vorhersehbaren Schaden.

(3) Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.

(4) Carenes haftet nicht für die Erbringung, Qualität oder Mängel der Dienstleistungen der Salons, für Angaben der Salons (Preise, Öffnungszeiten, Leistungsbeschreibungen) oder für Inhalte, die Nutzer einstellen. § 9 Abs. 1 bleibt unberührt.

**§ 10 Laufzeit, Kündigung und Kontolöschung**

(1) Der Nutzungsvertrag läuft auf unbestimmte Zeit.

(2) Sie können ihn jederzeit ohne Frist kündigen, indem Sie Ihr Konto in der App löschen (Konto → Kontoeinstellungen → Konto löschen). Die Rechte und Pflichten aus bereits geschlossenen Buchungsverträgen bleiben hiervon unberührt.

(3) Carenes kann den Vertrag mit Ihnen mit einer Frist von zwei Wochen kündigen. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund liegt insbesondere bei schwerwiegenden oder wiederholten Verstößen gegen § 5 vor.

**§ 11 Änderungen dieser Bedingungen**

(1) Wir können diese Bedingungen mit Wirkung für die Zukunft ändern, wenn dies aus triftigem Grund erforderlich ist, insbesondere wegen Gesetzesänderungen, Rechtsprechung, neuer Funktionen oder Sicherheitsanforderungen.

(2) Sie werden über Änderungen mindestens sechs Wochen vor Inkrafttreten in der App oder per E-Mail informiert. Widersprechen Sie nicht innerhalb dieser Frist, gelten die Änderungen als angenommen. Auf diese Folge und Ihr Widerspruchsrecht weisen wir in der Mitteilung gesondert hin. Im Fall des Widerspruchs können Sie den Nutzungsvertrag kündigen.

**§ 12 Streitbeilegung**

Carenes ist weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG). ⚠️ PRÜFEN

**§ 13 Schlussbestimmungen**

(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Als Verbraucher behalten Sie den Schutz zwingender Vorschriften des Staates Ihres gewöhnlichen Aufenthalts.

(2) Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt (§ 306 BGB).

(3) Vertragssprachen sind Deutsch und Englisch. Bei Abweichungen ist die deutsche Fassung maßgeblich.

---

### Teil B – Buchung, Zahlung, Stornierung, Widerruf

**§ B1 Buchungsablauf und Vertragsschluss**

(1) Die Darstellung von Salons, Leistungen, Preisen und freien Terminen in der App ist kein verbindliches Angebot, sondern eine Aufforderung zur Abgabe einer Buchungsanfrage.

(2) Der Buchungsablauf:
1. Auswahl des Salons und einer oder mehrerer Leistungen
2. Auswahl der Mitarbeiterin/des Mitarbeiters, des Datums und der Uhrzeit
3. Zusammenfassung mit allen Angaben (Salon, Leistungen, Termin, Gesamtpreis)
4. Auswahl der Zahlungsart (online oder im Geschäft)
5. Bestätigung dieser Bedingungen per Checkbox
6. Klick auf den Button **„Zahlungspflichtig buchen"** *(⚠️ Hinweis Team: Button-Text noch nicht implementiert — Dev-Ticket vor Go-Live, § 312j Abs. 3 BGB)*

(3) Vor dem Absenden können Sie alle Eingaben jederzeit über die Zurück-Funktion prüfen und korrigieren (§ 312i Abs. 1 Nr. 1 BGB).

(4) Mit Klick auf „Zahlungspflichtig buchen" geben Sie ein verbindliches Angebot zum Abschluss eines Dienstleistungsvertrags mit dem Salon ab. Carenes nimmt dieses Angebot als Empfangsvertreter des Salons an. Die Annahme erfolgt durch die Buchungsbestätigung in der App. Mit der Bestätigung kommt der Vertrag mit dem Salon zustande.

(5) Die Buchungsdaten sind jederzeit in Ihrem Konto unter „Buchungen" einsehbar. Diese Bedingungen können Sie in der App aufrufen und speichern.

**§ B2 Preise**

(1) Es gelten die zum Zeitpunkt der Buchung in der App angezeigten Preise des Salons. Diese sind Endpreise einschließlich gesetzlicher Umsatzsteuer, soweit der Salon umsatzsteuerpflichtig ist.

(2) Angezeigte Rabatte gelten im angegebenen Zeitraum für die angegebenen Leistungen.

(3) Zusätzliche Leistungen, die vor Ort vereinbart werden, sind direkt mit dem Salon abzurechnen.

**§ B3 Zahlung**

(1) **Online-Zahlung:** Die Zahlung erfolgt über den Zahlungsdienstleister **Stripe** (Kredit- oder Debitkarte). Es gelten ergänzend dessen Bedingungen. Carenes nimmt die Zahlung als Inkassobevollmächtigter des Salons entgegen. Mit Zahlungseingang bei Carenes ist Ihre Zahlungspflicht gegenüber dem Salon erfüllt.

(2) **Zahlung im Geschäft:** Sie bezahlen den Preis direkt im Salon (bar oder per Karte, je nach Angebot des Salons). Auch bei dieser Zahlungsart ist die Buchung zahlungspflichtig.

(3) Rechnungen bzw. Quittungen über die Dienstleistung stellt der Salon aus.

**§ B4 Stornierung und Umbuchung**

(1) Sie können gebuchte Termine bis spätestens 2 Stunden vor Terminbeginn kostenfrei über die App stornieren oder eine Umbuchung anfragen. Umbuchungen werden wirksam, sobald der Salon sie bestätigt.

(2) Bei rechtzeitiger Stornierung wird eine bereits geleistete Online-Zahlung vollständig über das ursprüngliche Zahlungsmittel erstattet, in der Regel innerhalb von [ERSTATTUNGSFRIST] Tagen.

(3) Bei späterer Stornierung oder wenn Sie zum Termin nicht erscheinen („No-Show"), kann der Salon eine Entschädigung von [X] % des Preises verlangen. ⚠️ PRÜFEN Ihnen bleibt ausdrücklich der Nachweis gestattet, dass dem Salon kein oder ein wesentlich geringerer Schaden entstanden ist (§ 309 Nr. 5 BGB). Ihre Rechte nach § 615 Satz 2 BGB bleiben unberührt.

(4) Sagt der Salon einen Termin ab, wird eine geleistete Online-Zahlung vollständig erstattet.

(5) Ein Termin gilt 3 Stunden nach dem geplanten Ende als durchgeführt, sofern der Salon ihn nicht als „Nicht erschienen" markiert hat. Einwände gegen eine solche Markierung können Sie innerhalb von 14 Tagen an [E-MAIL-SUPPORT] richten.

**§ B5 Widerrufsrecht für Verbraucher**

⚠️ PRÜFEN: Ob für Friseurtermine die Ausnahme des § 312g Abs. 2 Nr. 9 BGB (terminbezogene Freizeitdienstleistungen) greift, ist rechtlich nicht abschließend geklärt. Die folgende Belehrung ist die vorsichtige Variante.

**Widerrufsbelehrung**

*Widerrufsrecht:* Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.

Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ([FIRMA], [ANSCHRIFT], E-Mail: [E-MAIL-SUPPORT]), handelnd für den Salon, mittels einer eindeutigen Erklärung (z. B. per E-Mail oder durch Stornierung in der App) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung vor Ablauf der Widerrufsfrist absenden.

*Folgen des Widerrufs:* Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen zurückzuzahlen. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart. In keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.

Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang entspricht.

*Vorzeitiges Erlöschen:* Das Widerrufsrecht erlischt, wenn die Dienstleistung vollständig erbracht wurde und mit der Ausführung erst begonnen wurde, nachdem Sie dazu Ihre ausdrückliche Zustimmung gegeben und gleichzeitig Ihre Kenntnis davon bestätigt haben, dass Sie Ihr Widerrufsrecht bei vollständiger Vertragserfüllung verlieren.

*Ende der Widerrufsbelehrung*

**Muster-Widerrufsformular**

*(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)*

An [FIRMA], [ANSCHRIFT], E-Mail: [E-MAIL-SUPPORT]:

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung (*)
– Bestellt am (*) / erhalten am (*)
– Name des/der Verbraucher(s)
– Anschrift des/der Verbraucher(s)
– Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)
– Datum

(*) Unzutreffendes streichen.

**Technischer Hinweis an das Team:** Liegt der Termin innerhalb der 14-tägigen Widerrufsfrist, muss im Buchungsablauf eine zusätzliche Checkbox angezeigt werden: „Ich verlange ausdrücklich, dass der Salon vor Ablauf der Widerrufsfrist mit der Leistung beginnt, und weiß, dass mein Widerrufsrecht mit vollständiger Erbringung erlischt."

**§ B6 Mängel der Dienstleistung**

Ansprüche wegen mangelhafter Dienstleistung richten sich nach den gesetzlichen Vorschriften und sind gegenüber dem Salon geltend zu machen. Carenes unterstützt bei der Kommunikation über den Chat und den Support.

---

## Anhang – Impressum (§ 5 DDG)

**Impressum**
[FIRMA]
[ANSCHRIFT]
Vertreten durch: [VERTRETER]
Telefon: [TELEFON] · E-Mail: [E-MAIL-SUPPORT]
Registergericht: [REGISTERGERICHT], Registernummer: [HRB]
Umsatzsteuer-ID gemäß § 27a UStG: [USt-IdNr.]
Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: [NAME, ANSCHRIFT]

---

## 🇬🇧 Terms and Conditions for Customers (English translation)

*The German version is legally binding. This English text is provided for convenience.*

**Last updated:** [DATE]

### Part A – General Provisions

**§ 1 Provider and scope.** The Carenes app is operated by [COMPANY], [ADDRESS], represented by [REPRESENTATIVE], [COMMERCIAL REGISTER], VAT ID [VAT-ID], email [SUPPORT-EMAIL]. These terms apply to customers who search for and book salon appointments through Carenes.

**§ 2 Carenes is an intermediary.** Carenes provides a platform to find salons, book, pay, chat and leave reviews. Carenes does not provide the hair or beauty service itself. The service contract is concluded solely between you and the salon. The salon alone is responsible for performing the service, its quality, prices and warranty. All salons on Carenes have declared that they are businesses, so consumer protection law applies to the contract with the salon (§ 312l BGB). Using the platform is free for customers.

**§ 3 Account.** You can register from age 16; users under 18 need parental consent for paid bookings *(not yet technically enforced — contractual promise only until implemented)*. Your details must be true and kept up to date. Keep your login credentials secret. One account per person; accounts are not transferable.

**§ 4 Availability.** We aim for high availability but do not guarantee uninterrupted service.

**§ 5 Your obligations.** You must not give false information, make fake bookings, repeatedly miss appointments without cancelling, post unlawful, offensive, discriminatory, pornographic or infringing content, send spam or advertising, try to bypass the platform, or use bots or scrapers.

**§ 6 Reviews.** You can rate a salon (stars and text) and the staff member (stars) only after a completed booking made through Carenes (§ 5b(3) UWG) *(backend enforcement pending — dev ticket needed before publishing)*. Reviews must reflect your own experience. No rewards may be offered or accepted for reviews. Reviews are never boosted or suppressed for payment.

**§ 7 Chat.** The chat is only for communication about appointments. You are responsible for what you send.

**§ 8 Reporting unlawful content (DSA).** Send reports to [SUPPORT-EMAIL] with the location of the content, your reasons, and your name and email. We review reports diligently and inform you of our decision and the reasons; you can appeal through the same address.

**§ 9 Liability.** We are fully liable for intent, gross negligence, injury to life, body or health, under the Product Liability Act and under guarantees. For slight negligence, we are liable only for breach of essential contractual obligations, limited to typical foreseeable damage. Carenes is not liable for salons' services or information, or for content posted by users.

**§ 10 Term and termination.** The contract runs for an indefinite period. You can terminate at any time by deleting your account (Account → Account Settings → Delete Account); existing bookings remain valid. Carenes may terminate with 2 weeks' notice, or immediately for good cause.

**§ 11 Changes.** You are notified at least 6 weeks in advance. If you do not object within this period, the changes are deemed accepted. If you object, either party may terminate.

**§ 12 Dispute resolution.** We are neither willing nor obliged to take part in consumer arbitration proceedings (§ 36 VSBG). ⚠️ PRÜFEN

**§ 13 Final provisions.** German law applies, excluding the CISG; you keep the protection of mandatory laws of your country of residence. If a clause is invalid, the rest remains valid. The German version prevails.

### Part B – Booking, Payment, Cancellation, Withdrawal

**§ B1 Booking and contract.** Listings are not binding offers. Booking steps:
1. Choose the salon and services.
2. Choose the staff member, date and time.
3. Review the summary.
4. Choose the payment method (online or at the salon).
5. Accept these terms with the checkbox.
6. Tap **"Book with obligation to pay"** ("Zahlungspflichtig buchen") *(⚠️ not yet implemented — dev ticket needed before go-live)*.

You can go back and correct your entries at any time before submitting. Tapping the button is a binding offer to the salon. Carenes accepts it on the salon's behalf by confirming the booking in the app, and the contract with the salon is then concluded.

**§ B2 Prices.** The salon's prices shown at the time of booking apply. They are final prices including VAT where applicable. Discounts apply as shown.

**§ B3 Payment.** **Online:** via **Stripe** (credit or debit card). Carenes collects the payment on the salon's behalf, and your debt to the salon is settled once Carenes receives it. **At the salon:** you pay directly at the salon; this booking is also binding and payable. The salon issues the invoice.

**§ B4 Cancellation and rescheduling.**
- You can cancel free of charge or request a reschedule up to 2 hours before the appointment. A reschedule takes effect once the salon confirms it.
- If you cancel in time, online payments are refunded in full within [REFUND PERIOD] days.
- If you cancel later or do not show up, the salon may charge [X] % ⚠️; you may always prove that the salon suffered lower or no damage.
- If the salon cancels, you get a full refund.
- An appointment counts as completed 3 hours after its scheduled end unless the salon marks it "No-Show". You can dispute that mark within 14 days by emailing support.

**§ B5 Right of withdrawal.** ⚠️ See the German version for the full statutory withdrawal notice and model form. In short: you may withdraw within 14 days of booking. The right expires once the service has been fully performed, if you expressly requested that it start during the withdrawal period. If you withdraw after the service has started, you pay a proportionate amount.

**§ B6 Defects.** Claims about a defective service must be made against the salon.
