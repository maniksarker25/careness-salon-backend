# Carenes – Geschäftsbedingungen für Salons (Client/Salon App)

> **Ziel-Feld im Backend:** `TermsConditions.descriptionForClientApp`
> Dieser Text wird **nur Salons (Unternehmern)** angezeigt. Für Kunden gilt das separate Dokument `terms-and-conditions-customer.md`.

## CAUTION

Backend-verifizierter Entwurf, Stand 2026-11-16 — **keine Rechtsberatung**. Vor Veröffentlichung von einem deutschen Anwalt prüfen lassen, insbesondere ⚠️ PRÜFEN-Stellen (Provisionshöhe/USt, Haftungsgrenze, Mediatoren).

### Notizen für das Team (nicht veröffentlichen)

| Punkt | Status |
|---|---|
| Zahlungsarten | **Nur Stripe / Stripe Connect** — PayPal existiert nicht im Backend, wurde aus dem Originalentwurf entfernt |
| Provision „Zahlung im Geschäft" | **Pauschalgebühr, keine 20 %** — im Code als fester Wert `5` je Buchung hinterlegt (`payonShopChargePerBooking`). Originalentwurf hatte fälschlich „20 %" angegeben. Exakten Betrag/Währung mit Geschäftsführung bestätigen |
| Provision „Online-Zahlung" | **5 %** — im Code bestätigt (`PLATFORM_FEE_PERCENT`) |
| Salonbilder max. 4 | ⚠️ aktuell **nicht** durch Validierung im Backend erzwungen — Dev-Ticket anlegen, falls diese Grenze technisch durchgesetzt werden soll |
| Selbstbuchung / Laufkundschaft (§ C3 Abs. 2) | 🚫 **Feature noch nicht gebaut** — als offenes Dev-Ticket vermerkt. Absatz ist auskommentiert, bis die Funktion produktiv ist |
| Platzhalter | `[FIRMA]`, `[ANSCHRIFT]`, `[VERTRETER]`, `[REGISTERGERICHT/HRB]`, `[USt-IdNr.]`, `[E-MAIL-SUPPORT]`, `[ZAHLUNGSZIEL]`, `[MEDIATOREN]`, `[DATUM]`, `[PAUSCHALGEBÜHR-WÄHRUNG]` |

---

## 🇩🇪 Geschäftsbedingungen für Salons

**Stand:** [DATUM]

### Teil A – Allgemeine Bestimmungen

**§ 1 Anbieter und Geltungsbereich**

(1) Die Plattform „Carenes" (mobile App für iOS und Android) wird betrieben von [FIRMA], [ANSCHRIFT], vertreten durch [VERTRETER], eingetragen im Handelsregister [REGISTERGERICHT / HRB], USt-IdNr. [USt-IdNr.], E-Mail: [E-MAIL-SUPPORT] (nachfolgend „Carenes", „wir").

(2) Diese Bedingungen gelten für Salons: Unternehmer im Sinne von § 14 BGB, die Friseur-, Kosmetik- oder vergleichbare Dienstleistungen über Carenes anbieten. Sie setzen die Verordnung (EU) 2019/1150 („P2B-Verordnung") für das Verhältnis zwischen Carenes und Salons um.

(3) Abweichende Bedingungen werden nicht Vertragsbestandteil, es sei denn, wir stimmen ihrer Geltung ausdrücklich in Textform zu.

**§ 2 Rolle von Carenes – Vermittlungsplattform**

(1) Carenes stellt eine technische Plattform bereit, über die Kunden Ihren Salon finden, Termine buchen, bezahlen, mit Ihnen kommunizieren und Bewertungen abgeben können.

(2) Carenes ist nicht Erbringer der Friseur- oder Beauty-Dienstleistung. Der Behandlungsvertrag kommt ausschließlich zwischen dem Kunden und Ihnen zustande. Für die Durchführung, Qualität, Preise und Gewährleistung der Dienstleistung sind Sie allein verantwortlich.

(3) Zwischen Carenes und Ihnen kommt ein Nutzungsvertrag über die Plattform zustande. Die Einstellung Ihres Salons ist kostenlos (vorbehaltlich der Provision nach § C4).

**§ 3 Registrierung und Nutzerkonto**

(1) Ein Salonkonto dürfen nur volljährige, unbeschränkt geschäftsfähige Personen anlegen, die zur Vertretung des Salons berechtigt sind.

(2) Die bei der Registrierung abgefragten Angaben müssen wahrheitsgemäß und vollständig sein und aktuell gehalten werden.

(3) Zugangsdaten sind geheim zu halten. Bei Verdacht auf Missbrauch ist Carenes unverzüglich zu informieren. Konten sind nicht übertragbar.

(4) Mit Abschluss der Registrierung akzeptieren Sie diese Bedingungen. Die Datenschutzerklärung wird zur Kenntnis genommen.

**§ 4 Verfügbarkeit der Plattform**

Wir bemühen uns um eine möglichst unterbrechungsfreie Verfügbarkeit, schulden diese jedoch nicht. Wartungsarbeiten, Sicherheitsupdates sowie Störungen außerhalb unseres Einflussbereichs können zu vorübergehenden Einschränkungen führen.

**§ 5 Ihre Pflichten**

Sie dürfen die Plattform nicht missbräuchlich verwenden. Insbesondere ist es untersagt:
- falsche Angaben zu machen
- im Chat, in Bewertungen oder Bildern rechtswidrige, beleidigende, diskriminierende, pornografische oder urheberrechtsverletzende Inhalte zu verbreiten
- Werbung, Spam oder Kontaktdaten zum Zweck der Umgehung der Plattform zu verbreiten
- die Plattform durch automatisierte Zugriffe (Bots, Scraping) zu belasten oder Sicherheitsmechanismen zu umgehen

**§ 6 Bewertungen**

(1) Kunden können Ihren Salon (Sterne und Text) und Ihre Mitarbeitenden (Sterne) nur nach einem über Carenes gebuchten und abgeschlossenen Termin bewerten (§ 5b Abs. 3 UWG). *(⚠️ Hinweis Team: Backend prüft dies aktuell nicht — Entwicklungsticket nötig.)*

(2) Die Gesamtbewertung ist der Durchschnitt aller veröffentlichten Bewertungen. Bewertungen werden nicht gegen Bezahlung hervorgehoben oder unterdrückt. Wir entfernen Bewertungen, die gegen Gesetze oder diese Bedingungen verstoßen.

**§ 7 Chat**

Der Chat dient ausschließlich der Kommunikation im Zusammenhang mit Terminen. Sie sind für die von Ihnen versandten Inhalte selbst verantwortlich.

**§ 8 Meldung rechtswidriger Inhalte (Digital Services Act)**

(1) Rechtswidrige Inhalte können jederzeit an [E-MAIL-SUPPORT] gemeldet werden (Art. 16 DSA).

(2) Wir prüfen Meldungen zeitnah, sorgfältig und objektiv und informieren Sie über unsere Entscheidung und die Gründe (Art. 17 DSA).

(3) Zentrale Kontaktstelle für Behörden und Nutzer (Art. 11, 12 DSA): [E-MAIL-SUPPORT], Sprachen: Deutsch, Englisch.

**§ 9 Haftung von Carenes**

(1) Carenes haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz sowie im Umfang einer übernommenen Garantie.

(2) Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht haftet Carenes nur für den vertragstypischen, vorhersehbaren Schaden.

(3) Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.

(4) Carenes haftet nicht für Inhalte, die Nutzer einstellen. § 9 Abs. 1 bleibt unberührt. Für die Haftung gegenüber Salons gilt zusätzlich § C12.

**§ 10 Laufzeit und Kündigung**

Für Salons gelten die besonderen Kündigungsregeln in § C8 und § C9.

**§ 11 Änderungen dieser Bedingungen**

Änderungen für Salons richten sich nach § C9 (Art. 3 P2B-VO).

**§ 12 Streitbeilegung**

Für außergerichtliche Streitbeilegung mit Salons siehe § C10 (internes Beschwerdemanagement und Mediation nach Art. 11, 12 P2B-VO).

**§ 13 Schlussbestimmungen**

(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.

(2) Sind Sie Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist Gerichtsstand der Sitz von Carenes.

(3) Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt (§ 306 BGB).

(4) Vertragssprachen sind Deutsch und Englisch. Bei Abweichungen ist die deutsche Fassung maßgeblich.

---

### Teil C – Besondere Bestimmungen für Salons (B2B / P2B-Verordnung)

**§ C1 Zulassung und Freischaltung**

(1) Ein Salonkonto dürfen nur Unternehmer (§ 14 BGB) anlegen. Sie bestätigen bei der Registrierung, dass Sie gewerblich bzw. selbstständig handeln und alle erforderlichen Genehmigungen besitzen (insbesondere Eintragung in die Handwerksrolle für das zulassungspflichtige Friseurhandwerk, Gewerbeanmeldung).

(2) Nach Eingabe der Salondaten prüft Carenes Ihr Profil. Ihr Salon ist erst nach Freischaltung für Kunden sichtbar. Carenes kann Nachweise anfordern und die Freischaltung aus sachlichem Grund ablehnen (z. B. unvollständige oder falsche Angaben, fehlende Unternehmereigenschaft, Verstoß gegen diese Bedingungen). Die Gründe teilen wir Ihnen mit.

(3) Für die Auszahlung von Online-Zahlungen müssen Sie ein **Stripe-Connect-Konto** verbinden und die Identitätsprüfung des Zahlungsdienstleisters durchlaufen.

**§ C2 Ihre Pflichten als Salon**

Sie sind verpflichtet:
- vollständige und wahre Angaben zu Salonname, Anschrift, Kategorie, Leistungen, Dauer, Preisen (als Endpreise gemäß Preisangabenverordnung), Öffnungs- und Sperrzeiten zu machen und aktuell zu halten
- nur Bilder hochzuladen (max. 4 Salonbilder) *(⚠️ Hinweis Team: aktuell nicht durch Validierung im Backend erzwungen)*, an denen Sie die erforderlichen Rechte besitzen
- bestätigte Termine einzuhalten und Absagen unverzüglich über die App vorzunehmen
- „Nicht erschienen" nur zu markieren, wenn der Kunde tatsächlich nicht erschienen ist
- die Dienstleistung fachgerecht und unter Einhaltung aller gesetzlichen Vorschriften (insbesondere Hygiene, Arbeitsschutz, Steuern) zu erbringen
- über die Plattform vermittelte Kunden nicht zur Umgehung der Plattform bei bereits gebuchten Terminen aufzufordern
- Kundendaten, die Sie über Carenes erhalten, nur zur Durchführung des Termins und nach Maßgabe der DSGVO zu verarbeiten

**§ C3 Mitarbeitende und Selbstbuchungen**

(1) Sie können Mitarbeitende mit Name, Foto, Spezialisierung, Kontaktdaten, Arbeitszeiten und Leistungen anlegen. Sie sind für die Rechtmäßigkeit dieser Verarbeitung verantwortlich, insbesondere für die Information der Mitarbeitenden und, wo nötig, deren Einwilligung (z. B. zur Veröffentlichung des Fotos).

(2) 🚫 **NOCH NICHT AKTIV — Feature in Entwicklung.** *Dieser Absatz beschreibt eine geplante „Selbstbuchung"-Funktion (Laufkundschaft ohne Kundenkonto), die im Backend noch nicht existiert. Nicht veröffentlichen, bevor die Funktion produktiv ist. Entwurfstext für später:*

> *Über die Funktion „Selbstbuchung" können Sie Termine für Laufkundschaft selbst erfassen, einschließlich Name, Telefonnummer und Notizen. Sie sind hierfür datenschutzrechtlich Verantwortlicher und stellen sicher, dass Sie die Kundin/den Kunden informiert haben. Die Selbstbuchung ist für Sie zahlungspflichtig im Sinne von § C4. ⚠️ PRÜFEN*

(3) Soweit Carenes personenbezogene Daten in Ihrem Auftrag verarbeitet (Mitarbeitende, künftig ggf. Laufkundschaft), gilt der Auftragsverarbeitungsvertrag nach Art. 28 DSGVO in Anlage 1 ⚠️ (separat zu erstellen).

**§ C4 Provision und Entgelte**

(1) Die Einstellung Ihres Salons ist kostenlos. Carenes erhält für jede über die Plattform vermittelte und durchgeführte Buchung eine Provision.

(2) **Zahlung im Geschäft:** Für Termine, die der Kunde im Salon bezahlt, schulden Sie Carenes eine **Pauschalgebühr von [PAUSCHALGEBÜHR-WÄHRUNG] je Buchung** (zzgl. gesetzlicher USt ⚠️ PRÜFEN). *(⚠️ Hinweis Team: im Code als fester Wert `5` hinterlegt — exakte Währung/Betrag mit der Geschäftsführung bestätigen; ersetzt die im Originalentwurf fälschlich angegebenen „20 %".)* Der offene Betrag wird in der App unter Konto → Details zur Zahlung im Geschäft mit allen zugrunde liegenden Terminen ausgewiesen. Er ist innerhalb von [ZAHLUNGSZIEL] Tagen per Stripe zu begleichen.

(3) **Online-Zahlung:** Bei Online-Zahlungen behält Carenes eine Provision von **5 %** ein und zahlt den Restbetrag über Stripe Connect an Sie aus. Gebühren des Zahlungsdienstleisters trägt [Carenes / der Salon] ⚠️ PRÜFEN.

(4) Für Termine, die storniert, von Ihnen abgesagt oder als „Nicht erschienen" markiert wurden, fällt keine Provision an. Ausnahme: Sie haben eine Entschädigung nach § B4 Abs. 3 der Kundenbedingungen erhalten. ⚠️ PRÜFEN

(5) Carenes stellt über die Provision eine Rechnung bzw. Gutschrift aus. Bei Zahlungsverzug kann Carenes nach vorheriger Mahnung mit angemessener Fristsetzung die Sichtbarkeit Ihres Salons vorübergehend einschränken (siehe § C7).

**§ C5 Ranking (Art. 5 P2B-VO)**

Die Reihenfolge der Salons in der App wird durch folgende Hauptparameter bestimmt:
1. Entfernung zum Standort des Kunden bzw. zur gesuchten Adresse (wichtigster Parameter)
2. Übereinstimmung mit dem Suchbegriff (Salonname) und den gewählten Filtern (Kategorie, Zielgruppe)
3. [Bewertungen und Anzahl der Bewertungen] ⚠️ PRÜFEN – nur angeben, wenn das Backend dies tatsächlich im Ranking nutzt

Eine Beeinflussung des Rankings gegen Entgelt findet nicht statt.

**§ C6 Zugang zu Daten (Art. 9 P2B-VO)**

Sie haben in der App Zugriff auf die Daten Ihrer Buchungen, Ihrer Kunden (soweit für den Termin erforderlich), Ihrer Umsätze und Bewertungen. Carenes nutzt aggregierte, nicht personenbezogene Daten zur Verbesserung der Plattform. Eine Weitergabe Ihrer Daten an andere Salons erfolgt nicht.

**§ C7 Einschränkung, Aussetzung und Sperrung (Art. 4 P2B-VO)**

(1) Carenes kann die Sichtbarkeit Ihres Salons einschränken oder das Konto vorübergehend aussetzen, insbesondere bei:
- falschen Angaben
- erheblichen oder wiederholten berechtigten Kundenbeschwerden
- Missbrauch der No-Show-Funktion
- Zahlungsverzug nach § C4 Abs. 5
- Verstößen gegen Gesetze oder diese Bedingungen

(2) Carenes teilt Ihnen die Gründe vor oder spätestens mit Wirksamwerden der Maßnahme auf einem dauerhaften Datenträger (z. B. E-Mail) mit. Sie können dazu über das Beschwerdemanagement (§ C10) Stellung nehmen.

**§ C8 Laufzeit und Kündigung**

(1) Sie können den Vertrag jederzeit mit einer Frist von 14 Tagen kündigen oder das Konto löschen. Bereits bestätigte Termine sind zu erfüllen oder ordnungsgemäß abzusagen. Offene Provisionen bleiben fällig.

(2) Carenes kann den Vertrag mit einer Frist von 30 Tagen kündigen (Art. 4 Abs. 1 P2B-VO). Die Begründung erfolgt auf einem dauerhaften Datenträger.

(3) Das Recht zur fristlosen Kündigung aus wichtigem Grund bleibt unberührt. Dazu gehören insbesondere schwerwiegende Rechtsverstöße, Betrug oder Gefährdung von Kunden.

**§ C9 Änderungen der Bedingungen für Salons (Art. 3 P2B-VO)**

Änderungen werden Ihnen mindestens 15 Tage vor Inkrafttreten auf einem dauerhaften Datenträger mitgeteilt. Bei umfangreichen technischen Anpassungen gilt eine längere, angemessene Frist. Sie können den Vertrag bis zum Inkrafttreten fristlos kündigen.

**§ C10 Internes Beschwerdemanagement und Mediation (Art. 11, 12 P2B-VO)**

(1) Beschwerden (z. B. zu Freischaltung, Ranking, Sperrung, Provisionen oder technischen Problemen) können kostenlos an [E-MAIL-SUPPORT] gerichtet werden. Wir bearbeiten sie zügig und teilen das Ergebnis mit.

(2) Zur außergerichtlichen Beilegung von Streitigkeiten benennen wir folgende Mediatoren: [MEDIATOREN] ⚠️ PRÜFEN – nach Art. 12 P2B-VO müssen zwei Mediatoren benannt werden. Ausgenommen sind Kleinunternehmen nach Art. 11 Abs. 5 P2B-VO.

**§ C11 Freistellung**

Sie stellen Carenes von Ansprüchen Dritter frei, die auf einer schuldhaften Verletzung Ihrer Pflichten aus diesen Bedingungen beruhen. Dazu gehören insbesondere Ansprüche aus Bild- oder Urheberrechten, Datenschutzverstößen gegenüber Mitarbeitenden oder Laufkunden und mangelhaften Dienstleistungen. Die Freistellung umfasst auch die angemessenen Kosten der Rechtsverteidigung.

**§ C12 Haftung gegenüber Salons**

§ 9 gilt entsprechend. Die Haftung für leicht fahrlässig verursachte Schäden bei Verletzung wesentlicher Vertragspflichten ist zusätzlich der Höhe nach auf die in den letzten 12 Monaten vor dem Schadensereignis von Ihnen gezahlten Provisionen begrenzt. ⚠️ PRÜFEN

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

## 🇬🇧 Terms and Conditions for Salons (English translation)

*The German version is legally binding. This English text is provided for convenience.*

**Last updated:** [DATE]

### Part A – General Provisions

**§ 1 Provider and scope.** The Carenes app is operated by [COMPANY], [ADDRESS], represented by [REPRESENTATIVE], [COMMERCIAL REGISTER], VAT ID [VAT-ID], email [SUPPORT-EMAIL]. These terms apply to salons — businesses within the meaning of § 14 BGB — and implement Regulation (EU) 2019/1150 (the "P2B Regulation") for the relationship between Carenes and salons.

**§ 2 Carenes is an intermediary.** Carenes provides a platform to let customers find your salon, book, pay, chat and leave reviews. Carenes does not provide the hair or beauty service. The service contract is concluded solely between the customer and you. You alone are responsible for performing the service, its quality, prices and warranty. Listing your salon is free, subject to the commission under § C4.

**§ 3 Account.** Salon accounts may only be created by adults authorised to represent the salon. Your details must be true and kept up to date. Keep your login credentials secret. Accounts are not transferable.

**§ 4 Availability.** We aim for high availability but do not guarantee uninterrupted service.

**§ 5 Your obligations.** You must not give false information, post unlawful, offensive, discriminatory, pornographic or infringing content, send spam or advertising, try to bypass the platform, or use bots or scrapers.

**§ 6 Reviews.** Customers can rate your salon (stars and text) and your staff (stars) only after a completed booking made through Carenes (§ 5b(3) UWG) *(backend enforcement pending — dev ticket needed before publishing)*. Reviews are never boosted or suppressed for payment.

**§ 7 Chat.** The chat is only for communication about appointments. You are responsible for what you send.

**§ 8 Reporting unlawful content (DSA).** Reports can be sent to [SUPPORT-EMAIL] at any time (Art. 16 DSA). We review reports diligently and inform you of our decision and the reasons (Art. 17 DSA).

**§ 9 Liability.** We are fully liable for intent, gross negligence, injury to life, body or health, under the Product Liability Act and under guarantees. For slight negligence, we are liable only for breach of essential contractual obligations, limited to typical foreseeable damage. See § C12 for the additional liability cap applicable to salons.

**§ 10 Term and termination.** See § C8 and § C9 for salon-specific termination rules.

**§ 11 Changes.** See § C9 (Art. 3 P2B Regulation).

**§ 12 Dispute resolution.** See § C10 for internal complaint handling and mediation (Art. 11, 12 P2B Regulation).

**§ 13 Final provisions.** German law applies, excluding the CISG. For merchants, the place of jurisdiction is Carenes' registered seat. If a clause is invalid, the rest remains valid. The German version prevails.

### Part C – Special Provisions for Salons (B2B, P2B Regulation (EU) 2019/1150)

**§ C1 Admission.** Only businesses may register. You confirm you hold all required permits (e.g. entry in the craft register for hairdressing, trade registration). Your profile goes live only after approval by Carenes. Approval may be refused for objective reasons, which we will explain. To receive online payouts, you must connect **Stripe Connect**.

**§ C2 Your obligations as a salon.** You must:
- provide accurate and current information, with prices as final prices (Price Indication Ordinance)
- upload max. 4 photos *(⚠️ not yet enforced by backend validation — dev ticket needed)* and only photos you hold rights to
- honour confirmed bookings and cancel promptly through the app
- mark "No-Show" only when it is true
- perform services lawfully, including hygiene and tax rules
- not try to bypass the platform for bookings already made
- process customer data only for the appointment and in line with the GDPR

**§ C3 Staff and walk-in bookings.** You are the controller for staff data. *Walk-in / self-booking support is not yet available — this feature is still in development and this sub-section will be activated once it ships.* A data processing agreement (Art. 28 GDPR) is attached as Annex 1 ⚠️.

**§ C4 Commission.**
- Listing your salon is free.
- **Pay at salon:** a flat fee of [FLAT-FEE-CURRENCY] per booking (plus VAT ⚠️) — *not a percentage; corrected from the original draft's incorrect "20%"*. The amount due, with all underlying appointments, is shown under Account → Pay-on-shop details and is payable via Stripe within [PAYMENT TERM] days.
- **Online payments:** Carenes keeps **5%** and pays out the rest via Stripe Connect.
- No commission is due for cancelled or no-show appointments, unless you received compensation ⚠️.
- Late payment may lead to restricted visibility after a reminder with a reasonable deadline.

**§ C5 Ranking.** Main parameters:
- distance to the customer's location or searched address
- match with the search term and filters
- [ratings ⚠️]

Ranking is never influenced by payment.

**§ C6 Data access.** You can see your bookings, the customer data needed for each appointment, sales and reviews. Carenes uses only aggregated, non-personal data to improve the platform.

**§ C7 Restriction and suspension.** Possible in case of false information, serious or repeated justified complaints, misuse of the no-show function, late payment or legal violations. We give reasons on a durable medium (e.g. email) before or at the latest when the measure takes effect.

**§ C8 Termination.**
- You: 14 days' notice. Confirmed bookings must be honoured or properly cancelled, and open commissions remain due.
- Carenes: 30 days' notice with reasons (Art. 4 P2B).
- Either party may terminate immediately for good cause.

**§ C9 Changes.** At least 15 days' notice on a durable medium. You may terminate immediately before the changes take effect.

**§ C10 Complaints and mediation.** Free internal complaint handling at [SUPPORT-EMAIL]. Mediators: [MEDIATORS] ⚠️.

**§ C11 Indemnity.** You indemnify Carenes against third-party claims resulting from your own culpable breaches, including reasonable legal defence costs.

**§ C12 Liability.** § 9 applies. For slight negligence, liability is additionally capped at the commissions you paid in the 12 months before the damage ⚠️.
