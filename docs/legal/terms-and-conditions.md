> ⛔ **SUPERSEDED (2026-11-17):** contains outdated facts. Use `terms-customer.html` / `terms-salon.html`. See `REVIEW-terms-2026-11-17.md`.

# Carenes – AGB / Terms and Conditions (Backend-Verified Draft)

## CAUTION

This is a draft based on the app's actual features, **cross-checked against the live backend code** on 2026-11-16. It is still **not legal advice**. A German lawyer must review it before publishing, especially the passages marked ⚠️ PRÜFEN.

This version fixes factual errors found when comparing the original app-developer draft against the backend (`carenes_salon_backend`). Every change from the original draft is listed in section 0.3 below so your lawyer/team can see exactly what moved.

---

## 0. Notes for the team (do not publish)

### 0.1 Placeholders still needed from the business

`[FIRMA]`, `[ANSCHRIFT]`, `[VERTRETER]`, `[REGISTERGERICHT / HRB]`, `[USt-IdNr.]`, `[E-MAIL-SUPPORT]`, `[TELEFON]`, `[ZAHLUNGSZIEL]`, `[ERSTATTUNGSFRIST]`, `[MEDIATOREN]`, `[DATUM]`, `[PAUSCHALGEBÜHR-WÄHRUNG]`

### 0.2 Values confirmed against app code (2026-11-16)

| Rule | Value in app | Source |
|---|---|---|
| Free cancellation | up to 2 hours before the appointment | `booking.service.ts` — confirmed in code |
| Reschedule cutoff | ⚠️ PRÜFEN — a separate reschedule module exists but no explicit 2‑hour cutoff was found in it; **confirm with dev team whether reschedule uses the same 2h rule as cancellation before publishing** | `booking_reschedule.service.ts` |
| Automatic completion | 3 hours after the end time, unless marked "No‑Show" | confirmed in code (`AUTO_COMPLETE_GRACE_PERIOD_MS`) |
| **Commission on pay‑at‑salon appointments** | **Flat fee of 5 [confirm currency unit] per booking — NOT a percentage** | confirmed in code (`payonShopChargePerBooking = 5`) — ⚠️ the original app-developer draft said "20%", this was wrong and has been corrected below |
| **Commission on online payments** | **5%** of the charged amount | confirmed in code (`PLATFORM_FEE_PERCENT = 5`) — fills the blank left in the original draft |
| Shop photos | max. 4 (stated as business policy; **not yet enforced by backend validation** — dev ticket needed) | not enforced in code today |
| Salon activation | only after review/approval by Carenes | confirmed in code |
| Final booking button | "Zahlungspflichtig buchen" (§ 312j(3) BGB) | **not yet implemented in app/Stripe Checkout — dev ticket needed before this clause is accurate** |
| Reviews | only after a completed booking | **not yet enforced by backend — `createRating` currently has no booking check — dev ticket needed before publishing this clause as a guarantee** |
| Payment methods | **Stripe only** | confirmed — no PayPal integration exists anywhere in the backend |
| Self-booking / walk-in bookings (§C3‑2) | **Feature not yet built** — tracked as an open development ticket | marked inactive below, re-enable the clause once shipped |
| No-show dispute (14 days) | handled manually via support email, no in-app dispute flow needed | fine as written, no backend gap |
| VAT / tax on commission | **no VAT/tax calculation exists in the backend at all** | all VAT clauses below remain ⚠️ PRÜFEN — needs tax advisor input regardless of code |
| Age restriction (16+ / 18+) | **not enforced by the backend today** — only a client-side/contractual promise until a server-side check is added | dev ticket recommended |

### 0.3 Changes made to the original app-developer draft

1. ❌ Removed **every mention of PayPal** (§B3, §C1, §C4, and the English mirror) — PayPal does not exist in the backend; only Stripe is integrated. Telling customers/salons PayPal is available would be misleading.
2. ✏️ Fixed §C4(2): pay‑at‑salon commission changed from **"20 %"** to a **flat fee** (matches the actual code constant). Confirm the exact currency/amount with the business before publishing.
3. ✏️ Filled §C4(3): online commission placeholder `[ONLINE-PROVISION %]` → **5 %** (matches `PLATFORM_FEE_PERCENT` in code).
4. 🚫 Marked §C3(2) (self-booking/walk-in) as **"not yet active"** — the feature doesn't exist in the backend yet (confirmed: it's an open dev ticket). Do not publish this clause live until the feature ships; a placeholder note is left so the clause doesn't need to be rewritten later.
5. ⚠️ Added a dev-team flag on §6 (reviews) and §B1 final button — both describe legal requirements the backend does not yet enforce. Legally the text can stay (it states the intended/required behavior), but it should not go live without the backend actually enforcing it, or the policy becomes a false promise to users.
6. ℹ️ No changes to the Impressum template, withdrawal-right section, liability caps, VAT placeholders, or mediator placeholders — these remain genuine open legal questions (⚠️ PRÜFEN), not backend facts, and still need your lawyer's input.

**Legally required in addition:** an Impressum under § 5 DDG (template at the end) that is reachable in the app with at most 2 taps. The terms must be accepted with a checkbox at registration.

---

## 🇩🇪 Allgemeine Geschäftsbedingungen (AGB) und Nutzungsbedingungen der Plattform Carenes

**Stand:** [DATUM]

### Teil A – Allgemeine Bestimmungen

**§ 1 Anbieter und Geltungsbereich**

(1) Die Plattform „Carenes" (mobile App für iOS und Android) wird betrieben von [FIRMA], [ANSCHRIFT], vertreten durch [VERTRETER], eingetragen im Handelsregister [REGISTERGERICHT / HRB], USt-IdNr. [USt-IdNr.], E-Mail: [E-MAIL-SUPPORT] (nachfolgend „Carenes", „wir").

(2) Diese AGB gelten für alle Nutzerinnen und Nutzer der Plattform. Dazu gehören:
- **Kunden:** Personen, die über Carenes Termine bei Salons suchen und buchen. Teil B gilt ergänzend.
- **Salons:** Unternehmer im Sinne von § 14 BGB, die Friseur-, Kosmetik- oder vergleichbare Dienstleistungen über Carenes anbieten. Teil C gilt ergänzend.

(3) Abweichende Bedingungen von Nutzern werden nicht Vertragsbestandteil, es sei denn, wir stimmen ihrer Geltung ausdrücklich in Textform zu.

**§ 2 Rolle von Carenes – Vermittlungsplattform**

(1) Carenes stellt eine technische Plattform bereit, über die Kunden Salons finden, Termine buchen, bezahlen, mit Salons kommunizieren und Bewertungen abgeben können.

(2) Carenes ist nicht Erbringer der Friseur- oder Beauty-Dienstleistung. Der Vertrag über die gebuchte Dienstleistung (Behandlungsvertrag) kommt ausschließlich zwischen dem Kunden und dem jeweiligen Salon zustande. Für die Durchführung, Qualität, Preise und Gewährleistung der Dienstleistung ist allein der Salon verantwortlich.

(3) Hinweis nach § 312l BGB / Art. 246d EGBGB: Alle auf Carenes angebotenen Salons sind nach eigener Erklärung Unternehmer. Die Verbraucherschutzvorschriften gelten daher für den Vertrag mit dem Salon. Carenes ist an diesem Vertrag nicht als Partei beteiligt und haftet nicht für dessen Erfüllung. Carenes ist jedoch für die ordnungsgemäße Abwicklung der Buchung und, bei Online-Zahlung, der Zahlung über die Plattform verantwortlich.

(4) Zwischen Carenes und jedem Nutzer kommt ein Nutzungsvertrag über die Plattform zustande. Die Nutzung ist für Kunden kostenlos.

**§ 3 Registrierung und Nutzerkonto**

(1) Die Nutzung der Buchungsfunktionen setzt ein Nutzerkonto voraus. Die Registrierung ist ab 16 Jahren möglich. Minderjährige benötigen für kostenpflichtige Buchungen die Zustimmung ihrer gesetzlichen Vertreter. Salonkonten dürfen nur von volljährigen, unbeschränkt geschäftsfähigen Personen angelegt werden, die zur Vertretung des Salons berechtigt sind. *(⚠️ Hinweis Team: derzeit technisch nicht durch das Backend erzwungen — bis zur Umsetzung nur vertragliches Versprechen.)*

(2) Die bei der Registrierung abgefragten Angaben müssen wahrheitsgemäß und vollständig sein und aktuell gehalten werden. Die E-Mail-Adresse wird durch einen Bestätigungscode verifiziert.

(3) Zugangsdaten sind geheim zu halten. Bei Verdacht auf Missbrauch ist Carenes unverzüglich zu informieren. Jede Person darf nur ein Konto je Rolle führen. Konten sind nicht übertragbar.

(4) Mit Abschluss der Registrierung akzeptiert der Nutzer diese AGB. Die Datenschutzerklärung wird zur Kenntnis genommen.

**§ 4 Verfügbarkeit der Plattform**

Wir bemühen uns um eine möglichst unterbrechungsfreie Verfügbarkeit, schulden diese jedoch nicht. Wartungsarbeiten, Sicherheitsupdates sowie Störungen außerhalb unseres Einflussbereichs (z. B. bei Mobilfunk- oder Zahlungsdiensten) können zu vorübergehenden Einschränkungen führen. Ein Anspruch auf bestimmte Funktionen besteht nur, soweit diese Teil des jeweiligen Vertrags sind.

**§ 5 Pflichten aller Nutzer**

Nutzer dürfen die Plattform nicht missbräuchlich verwenden. Insbesondere ist es untersagt:
- falsche Angaben zu machen oder Konten für Dritte ohne deren Einwilligung anzulegen
- Scheinbuchungen vorzunehmen oder Termine wiederholt ohne Absage nicht wahrzunehmen
- im Chat, in Bewertungen oder Bildern rechtswidrige, beleidigende, diskriminierende, pornografische oder urheberrechtsverletzende Inhalte zu verbreiten
- Werbung, Spam oder Kontaktdaten zum Zweck der Umgehung der Plattform zu verbreiten
- die Plattform durch automatisierte Zugriffe (Bots, Scraping) zu belasten oder Sicherheitsmechanismen zu umgehen

**§ 6 Bewertungen**

(1) Kunden können einen Salon (Sterne und Text) und die behandelnde Person (Sterne) nur nach einem über Carenes gebuchten und abgeschlossenen Termin bewerten. Damit stellen wir sicher, dass Bewertungen von Personen stammen, die die Leistung tatsächlich in Anspruch genommen haben (§ 5b Abs. 3 UWG). *(⚠️ Hinweis Team: Backend prüft dies aktuell nicht — Entwicklungsticket nötig, bevor diese Klausel live geht, sonst ist die Aussage falsch.)*

(2) Bewertungen müssen auf eigenen Erfahrungen beruhen und sachlich sein. Für Bewertungen dürfen keine Gegenleistungen angeboten oder angenommen werden.

(3) Die Gesamtbewertung ist der Durchschnitt aller veröffentlichten Bewertungen. Bewertungen werden nicht gegen Bezahlung hervorgehoben oder unterdrückt. Wir entfernen Bewertungen, die gegen Gesetze oder diese AGB verstoßen, insbesondere nach entsprechender Meldung.

**§ 7 Chat**

Der Chat dient ausschließlich der Kommunikation im Zusammenhang mit Terminen. Nutzer sind für die von ihnen versandten Inhalte selbst verantwortlich.

**§ 8 Meldung rechtswidriger Inhalte (Digital Services Act)**

(1) Rechtswidrige Inhalte (z. B. in Bewertungen, Chats, Salonprofilen oder Bildern) können jederzeit an [E-MAIL-SUPPORT] gemeldet werden. Die Meldung sollte die Fundstelle, eine Begründung sowie Name und E-Mail-Adresse der meldenden Person enthalten (Art. 16 DSA).

(2) Wir prüfen Meldungen zeitnah, sorgfältig und objektiv und informieren die meldende sowie die betroffene Person über unsere Entscheidung und die Gründe (Art. 17 DSA). Gegen Entscheidungen kann über dieselbe Adresse Beschwerde eingelegt werden.

(3) Zentrale Kontaktstelle für Behörden und Nutzer (Art. 11, 12 DSA): [E-MAIL-SUPPORT], Sprachen: Deutsch, Englisch.

**§ 9 Haftung von Carenes**

(1) Carenes haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit, nach dem Produkthaftungsgesetz sowie im Umfang einer übernommenen Garantie.

(2) Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht haftet Carenes nur für den vertragstypischen, vorhersehbaren Schaden. Wesentliche Vertragspflichten sind solche, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der Nutzer regelmäßig vertrauen darf.

(3) Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.

(4) Carenes haftet nicht für die Erbringung, Qualität oder Mängel der Dienstleistungen der Salons, für Angaben der Salons (Preise, Öffnungszeiten, Leistungsbeschreibungen) oder für Inhalte, die Nutzer einstellen. § 9 Abs. 1 bleibt unberührt.

**§ 10 Laufzeit, Kündigung und Kontolöschung**

(1) Der Nutzungsvertrag läuft auf unbestimmte Zeit.

(2) Kunden können ihn jederzeit ohne Frist kündigen, indem sie ihr Konto in der App löschen (Konto → Kontoeinstellungen → Konto löschen). Die Rechte und Pflichten aus bereits geschlossenen Buchungsverträgen bleiben hiervon unberührt.

(3) Kündigungsfristen für Salons regelt § C8.

(4) Carenes kann den Vertrag mit Kunden mit einer Frist von zwei Wochen kündigen. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger Grund liegt insbesondere bei schwerwiegenden oder wiederholten Verstößen gegen § 5 vor.

**§ 11 Änderungen dieser AGB**

(1) Wir können diese AGB mit Wirkung für die Zukunft ändern, wenn dies aus triftigem Grund erforderlich ist, insbesondere wegen Gesetzesänderungen, Rechtsprechung, neuer Funktionen oder Sicherheitsanforderungen. Wesentliche Vertragsinhalte (Hauptleistungspflichten, Preise) werden nicht einseitig geändert.

(2) Kunden werden über Änderungen mindestens sechs Wochen vor Inkrafttreten in der App oder per E-Mail informiert. Widersprechen sie nicht innerhalb dieser Frist, gelten die Änderungen als angenommen. Auf diese Folge und das Widerspruchsrecht weisen wir in der Mitteilung gesondert hin. Im Fall des Widerspruchs kann jede Partei den Nutzungsvertrag kündigen.

(3) Für Salons gilt § C9.

**§ 12 Streitbeilegung**

Carenes ist weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG). ⚠️ PRÜFEN

**§ 13 Schlussbestimmungen**

(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Gegenüber Verbrauchern gilt diese Rechtswahl nur, soweit dadurch nicht der Schutz durch zwingende Vorschriften des Staates ihres gewöhnlichen Aufenthalts entzogen wird.

(2) Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist Gerichtsstand der Sitz von Carenes.

(3) Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt (§ 306 BGB).

(4) Vertragssprachen sind Deutsch und Englisch. Bei Abweichungen ist die deutsche Fassung maßgeblich.

---

### Teil B – Bestimmungen für Kunden

**§ B1 Buchungsablauf und Vertragsschluss**

(1) Die Darstellung von Salons, Leistungen, Preisen und freien Terminen in der App ist kein verbindliches Angebot, sondern eine Aufforderung zur Abgabe einer Buchungsanfrage.

(2) Der Buchungsablauf:
1. Auswahl des Salons und einer oder mehrerer Leistungen
2. Auswahl der Mitarbeiterin/des Mitarbeiters, des Datums und der Uhrzeit
3. Zusammenfassung mit allen Angaben (Salon, Leistungen, Termin, Gesamtpreis)
4. Auswahl der Zahlungsart (online oder im Geschäft)
5. Bestätigung dieser AGB per Checkbox
6. Klick auf den Button **„Zahlungspflichtig buchen"** *(⚠️ Hinweis Team: dieser exakte Button-Text ist aktuell weder im Stripe-Checkout noch im Pay-on-shop-Flow implementiert — muss vor Go-Live umgesetzt werden, § 312j Abs. 3 BGB)*

(3) Vor dem Absenden können Sie alle Eingaben jederzeit über die Zurück-Funktion prüfen und korrigieren (§ 312i Abs. 1 Nr. 1 BGB).

(4) Mit Klick auf „Zahlungspflichtig buchen" geben Sie ein verbindliches Angebot zum Abschluss eines Dienstleistungsvertrags mit dem Salon ab. Carenes nimmt dieses Angebot als Empfangsvertreter des Salons an. Die Annahme erfolgt durch die Buchungsbestätigung in der App. Mit der Bestätigung kommt der Vertrag mit dem Salon zustande.

(5) Die Buchungsdaten sind jederzeit in Ihrem Konto unter „Buchungen" einsehbar. Diese AGB können Sie in der App aufrufen und speichern.

**§ B2 Preise**

(1) Es gelten die zum Zeitpunkt der Buchung in der App angezeigten Preise des Salons. Diese sind Endpreise einschließlich gesetzlicher Umsatzsteuer, soweit der Salon umsatzsteuerpflichtig ist.

(2) Angezeigte Rabatte gelten im angegebenen Zeitraum für die angegebenen Leistungen.

(3) Zusätzliche Leistungen, die vor Ort vereinbart werden, sind direkt mit dem Salon abzurechnen.

**§ B3 Zahlung**

(1) **Online-Zahlung:** Die Zahlung erfolgt über den Zahlungsdienstleister **Stripe** (Kredit- oder Debitkarte). Es gelten ergänzend dessen Bedingungen. Carenes nimmt die Zahlung als Inkassobevollmächtigter des Salons entgegen. Mit Zahlungseingang bei Carenes ist Ihre Zahlungspflicht gegenüber dem Salon erfüllt.

(2) **Zahlung im Geschäft:** Sie bezahlen den Preis direkt im Salon (bar oder per Karte, je nach Angebot des Salons). Auch bei dieser Zahlungsart ist die Buchung zahlungspflichtig.

(3) Rechnungen bzw. Quittungen über die Dienstleistung stellt der Salon aus.

**§ B4 Stornierung und Umbuchung**

(1) Sie können gebuchte Termine bis spätestens 2 Stunden vor Terminbeginn kostenfrei über die App stornieren oder eine Umbuchung anfragen. Umbuchungen werden wirksam, sobald der Salon sie bestätigt. *(⚠️ Hinweis Team: Umbuchungsfrist im Code separat bestätigen — siehe 0.2.)*

(2) Bei rechtzeitiger Stornierung wird eine bereits geleistete Online-Zahlung vollständig über das ursprüngliche Zahlungsmittel erstattet, in der Regel innerhalb von [ERSTATTUNGSFRIST] Tagen.

(3) Bei späterer Stornierung oder wenn Sie zum Termin nicht erscheinen („No-Show"), kann der Salon eine Entschädigung von [X] % des Preises verlangen. ⚠️ PRÜFEN Ihnen bleibt ausdrücklich der Nachweis gestattet, dass dem Salon kein oder ein wesentlich geringerer Schaden entstanden ist (§ 309 Nr. 5 BGB). Ihre Rechte nach § 615 Satz 2 BGB (Anrechnung ersparter Aufwendungen) bleiben unberührt.

(4) Sagt der Salon einen Termin ab, wird eine geleistete Online-Zahlung vollständig erstattet.

(5) Ein Termin gilt 3 Stunden nach dem geplanten Ende als durchgeführt, sofern der Salon ihn nicht als „Nicht erschienen" markiert hat. Einwände gegen eine solche Markierung können Sie innerhalb von 14 Tagen an [E-MAIL-SUPPORT] richten.

**§ B5 Widerrufsrecht für Verbraucher**

⚠️ PRÜFEN: Ob für Friseurtermine die Ausnahme des § 312g Abs. 2 Nr. 9 BGB (terminbezogene Freizeitdienstleistungen) greift, ist rechtlich nicht abschließend geklärt. Die folgende Belehrung ist die vorsichtige Variante.

**Widerrufsbelehrung**

*Widerrufsrecht:* Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.

Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ([FIRMA], [ANSCHRIFT], E-Mail: [E-MAIL-SUPPORT]), handelnd für den Salon, mittels einer eindeutigen Erklärung (z. B. per E-Mail oder durch Stornierung in der App) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.

*Folgen des Widerrufs:* Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart. In keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.

Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.

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

### Teil C – Bestimmungen für Salons (B2B)

*Teil C regelt das Verhältnis zwischen Carenes und Salons. Er setzt die Verordnung (EU) 2019/1150 („P2B-Verordnung") um.*

**§ C1 Zulassung und Freischaltung**

(1) Ein Salonkonto dürfen nur Unternehmer (§ 14 BGB) anlegen. Der Salon bestätigt bei der Registrierung, dass er gewerblich bzw. selbstständig handelt und alle erforderlichen Genehmigungen besitzt (insbesondere Eintragung in die Handwerksrolle für das zulassungspflichtige Friseurhandwerk, Gewerbeanmeldung).

(2) Nach Eingabe der Salondaten prüft Carenes das Profil. Der Salon ist erst nach Freischaltung für Kunden sichtbar. Carenes kann Nachweise anfordern und die Freischaltung aus sachlichem Grund ablehnen (z. B. unvollständige oder falsche Angaben, fehlende Unternehmereigenschaft, Verstoß gegen diese AGB). Die Gründe teilen wir mit.

(3) Für die Auszahlung von Online-Zahlungen muss der Salon ein **Stripe-Connect-Konto** verbinden und die Identitätsprüfung des Zahlungsdienstleisters durchlaufen.

**§ C2 Pflichten des Salons**

Der Salon ist verpflichtet:
- vollständige und wahre Angaben zu Salonname, Anschrift, Kategorie, Leistungen, Dauer, Preisen (als Endpreise gemäß Preisangabenverordnung), Öffnungs- und Sperrzeiten zu machen und aktuell zu halten
- nur Bilder hochzuladen (max. 4 Salonbilder) *(⚠️ Hinweis Team: aktuell nicht durch Validierung im Backend erzwungen — Ticket anlegen)*, an denen er die erforderlichen Rechte besitzt
- bestätigte Termine einzuhalten und Absagen unverzüglich über die App vorzunehmen
- „Nicht erschienen" nur zu markieren, wenn der Kunde tatsächlich nicht erschienen ist
- die Dienstleistung fachgerecht und unter Einhaltung aller gesetzlichen Vorschriften (insbesondere Hygiene, Arbeitsschutz, Steuern) zu erbringen
- über die Plattform vermittelte Kunden nicht zur Umgehung der Plattform bei bereits gebuchten Terminen aufzufordern
- Kundendaten, die er über Carenes erhält, nur zur Durchführung des Termins und nach Maßgabe der DSGVO zu verarbeiten

**§ C3 Mitarbeitende und Selbstbuchungen**

(1) Der Salon kann Mitarbeitende mit Name, Foto, Spezialisierung, Kontaktdaten, Arbeitszeiten und Leistungen anlegen. Er ist für die Rechtmäßigkeit dieser Verarbeitung verantwortlich, insbesondere für die Information der Mitarbeitenden und, wo nötig, deren Einwilligung (z. B. zur Veröffentlichung des Fotos).

(2) 🚫 **NOCH NICHT AKTIV — Feature in Entwicklung.** *Dieser Absatz beschreibt eine geplante „Selbstbuchung"-Funktion (Laufkundschaft ohne Kundenkonto), die im Backend noch nicht existiert. Nicht veröffentlichen, bevor die Funktion produktiv ist. Entwurfstext für später:*

> *Über die Funktion „Selbstbuchung" kann der Salon Termine für Laufkundschaft selbst erfassen, einschließlich Name, Telefonnummer und Notizen. Der Salon ist hierfür datenschutzrechtlich Verantwortlicher. Er stellt sicher, dass er die Kundin/den Kunden informiert hat. Die Selbstbuchung ist für den Salon zahlungspflichtig im Sinne von § C4. ⚠️ PRÜFEN*

(3) Soweit Carenes personenbezogene Daten im Auftrag des Salons verarbeitet (Mitarbeitende, und künftig ggf. Laufkundschaft), gilt der Auftragsverarbeitungsvertrag nach Art. 28 DSGVO in Anlage 1 ⚠️ (separat zu erstellen).

**§ C4 Provision und Entgelte**

(1) Die Einstellung des Salons ist kostenlos. Carenes erhält für jede über die Plattform vermittelte und durchgeführte Buchung eine Provision.

(2) **Zahlung im Geschäft:** Für Termine, die der Kunde im Salon bezahlt, schuldet der Salon Carenes eine **Pauschalgebühr von [PAUSCHALGEBÜHR-WÄHRUNG] je Buchung** (zzgl. gesetzlicher USt ⚠️ PRÜFEN). *(⚠️ Hinweis Team: im Code als fester Wert `5` hinterlegt — exakte Währung/Betrag mit der Geschäftsführung bestätigen; dies ersetzt die im Originalentwurf fälschlich angegebenen „20 %".)* Der offene Betrag wird in der App unter Konto → Details zur Zahlung im Geschäft mit allen zugrunde liegenden Terminen ausgewiesen. Er ist innerhalb von [ZAHLUNGSZIEL] Tagen per Stripe zu begleichen.

(3) **Online-Zahlung:** Bei Online-Zahlungen behält Carenes eine Provision von **5 %** ein und zahlt den Restbetrag über Stripe Connect an den Salon aus. Gebühren des Zahlungsdienstleisters trägt [Carenes / der Salon] ⚠️ PRÜFEN.

(4) Für Termine, die storniert, vom Salon abgesagt oder als „Nicht erschienen" markiert wurden, fällt keine Provision an. Ausnahme: Der Salon hat eine Entschädigung nach § B4 Abs. 3 erhalten. ⚠️ PRÜFEN

(5) Carenes stellt über die Provision eine Rechnung bzw. Gutschrift aus. Bei Zahlungsverzug kann Carenes nach vorheriger Mahnung mit angemessener Fristsetzung die Sichtbarkeit des Salons vorübergehend einschränken (siehe § C7).

**§ C5 Ranking (Art. 5 P2B-VO)**

Die Reihenfolge der Salons in der App wird durch folgende Hauptparameter bestimmt:
1. Entfernung zum Standort des Kunden bzw. zur gesuchten Adresse (wichtigster Parameter)
2. Übereinstimmung mit dem Suchbegriff (Salonname) und den gewählten Filtern (Kategorie, Zielgruppe)
3. [Bewertungen und Anzahl der Bewertungen] ⚠️ PRÜFEN – nur angeben, wenn das Backend dies tatsächlich im Ranking nutzt

Eine Beeinflussung des Rankings gegen Entgelt findet nicht statt.

**§ C6 Zugang zu Daten (Art. 9 P2B-VO)**

Der Salon hat in der App Zugriff auf die Daten seiner Buchungen, seiner Kunden (soweit für den Termin erforderlich), seiner Umsätze und Bewertungen. Carenes nutzt aggregierte, nicht personenbezogene Daten zur Verbesserung der Plattform. Eine Weitergabe von Salondaten an andere Salons erfolgt nicht.

**§ C7 Einschränkung, Aussetzung und Sperrung (Art. 4 P2B-VO)**

(1) Carenes kann die Sichtbarkeit eines Salons einschränken oder das Konto vorübergehend aussetzen, insbesondere bei:
- falschen Angaben
- erheblichen oder wiederholten berechtigten Kundenbeschwerden
- Missbrauch der No-Show-Funktion
- Zahlungsverzug nach § C4 Abs. 5
- Verstößen gegen Gesetze oder diese AGB

(2) Carenes teilt dem Salon die Gründe vor oder spätestens mit Wirksamwerden der Maßnahme auf einem dauerhaften Datenträger (z. B. E-Mail) mit. Der Salon kann dazu über das Beschwerdemanagement (§ C10) Stellung nehmen.

**§ C8 Laufzeit und Kündigung**

(1) Der Salon kann den Vertrag jederzeit mit einer Frist von 14 Tagen kündigen oder das Konto löschen. Bereits bestätigte Termine sind zu erfüllen oder ordnungsgemäß abzusagen. Offene Provisionen bleiben fällig.

(2) Carenes kann den Vertrag mit einer Frist von 30 Tagen kündigen (Art. 4 Abs. 1 P2B-VO). Die Begründung erfolgt auf einem dauerhaften Datenträger.

(3) Das Recht zur fristlosen Kündigung aus wichtigem Grund bleibt unberührt. Dazu gehören insbesondere schwerwiegende Rechtsverstöße, Betrug oder Gefährdung von Kunden.

**§ C9 Änderungen der AGB für Salons (Art. 3 P2B-VO)**

Änderungen werden Salons mindestens 15 Tage vor Inkrafttreten auf einem dauerhaften Datenträger mitgeteilt. Bei umfangreichen technischen Anpassungen gilt eine längere, angemessene Frist. Der Salon kann den Vertrag bis zum Inkrafttreten fristlos kündigen.

**§ C10 Internes Beschwerdemanagement und Mediation (Art. 11, 12 P2B-VO)**

(1) Beschwerden von Salons (z. B. zu Freischaltung, Ranking, Sperrung, Provisionen oder technischen Problemen) können kostenlos an [E-MAIL-SUPPORT] gerichtet werden. Wir bearbeiten sie zügig und teilen das Ergebnis mit.

(2) Zur außergerichtlichen Beilegung von Streitigkeiten benennen wir folgende Mediatoren: [MEDIATOREN] ⚠️ PRÜFEN – nach Art. 12 P2B-VO müssen zwei Mediatoren benannt werden. Ausgenommen sind Kleinunternehmen nach Art. 11 Abs. 5 P2B-VO.

**§ C11 Freistellung**

Der Salon stellt Carenes von Ansprüchen Dritter frei, die auf einer schuldhaften Verletzung seiner Pflichten aus diesen AGB beruhen. Dazu gehören insbesondere Ansprüche aus Bild- oder Urheberrechten, Datenschutzverstößen gegenüber Mitarbeitenden oder Laufkunden und mangelhaften Dienstleistungen. Die Freistellung umfasst auch die angemessenen Kosten der Rechtsverteidigung.

**§ C12 Haftung gegenüber Salons**

§ 9 gilt entsprechend. Die Haftung für leicht fahrlässig verursachte Schäden bei Verletzung wesentlicher Vertragspflichten ist zusätzlich der Höhe nach auf die in den letzten 12 Monaten vor dem Schadensereignis vom Salon gezahlten Provisionen begrenzt. ⚠️ PRÜFEN

---

## Anhang – Impressum (Vorlage, § 5 DDG)

**Impressum**
[FIRMA]
[ANSCHRIFT]
Vertreten durch: [VERTRETER]
Telefon: [TELEFON] · E-Mail: [E-MAIL-SUPPORT]
Registergericht: [REGISTERGERICHT], Registernummer: [HRB]
Umsatzsteuer-ID gemäß § 27a UStG: [USt-IdNr.]
Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: [NAME, ANSCHRIFT]

---

## 🇬🇧 Terms and Conditions (English translation)

*The German version is legally binding. This English text is provided for convenience.*

**Last updated:** [DATE]

### Part A – General Provisions

**§ 1 Provider and scope.** The Carenes app is operated by [COMPANY], [ADDRESS], represented by [REPRESENTATIVE], [COMMERCIAL REGISTER], VAT ID [VAT-ID], email [SUPPORT-EMAIL]. These terms apply to all users:
- **Customers** – Part B applies in addition.
- **Salons** – businesses within the meaning of § 14 BGB; Part C applies in addition.

**§ 2 Carenes is an intermediary.** Carenes provides a platform to find salons, book, pay, chat and leave reviews. Carenes does not provide the hair or beauty service. The service contract is concluded solely between the customer and the salon. The salon alone is responsible for performing the service, its quality, prices and warranty. All salons on Carenes have declared that they are businesses, so consumer protection law applies to the contract with the salon (§ 312l BGB). Using the platform is free for customers.

**§ 3 Account.** You can register from age 16; users under 18 need parental consent for paid bookings *(not yet technically enforced — contractual promise only until implemented)*. Salon accounts may only be created by adults authorised to represent the salon. Your details must be true and kept up to date. Keep your login credentials secret. One account per person and role; accounts are not transferable.

**§ 4 Availability.** We aim for high availability but do not guarantee uninterrupted service.

**§ 5 User obligations.** You must not give false information, make fake bookings, repeatedly miss appointments without cancelling, post unlawful, offensive, discriminatory, pornographic or infringing content, send spam or advertising, try to bypass the platform, or use bots or scrapers.

**§ 6 Reviews.** Customers can rate a salon (stars and text) and the staff member (stars) only after a completed booking made through Carenes (§ 5b(3) UWG) *(backend enforcement pending — dev ticket needed before publishing)*. Reviews must reflect your own experience. No rewards may be offered or accepted for reviews. The overall rating is the average of all published reviews. Reviews are never boosted or suppressed for payment. Unlawful reviews are removed.

**§ 7 Chat.** The chat is only for communication about appointments. Users are responsible for what they send.

**§ 8 Reporting unlawful content (DSA).** Send reports to [SUPPORT-EMAIL] with the location of the content, your reasons, and your name and email. We review reports diligently and inform both parties of our decision and the reasons; you can appeal through the same address. Single point of contact (Art. 11/12 DSA): [SUPPORT-EMAIL] – German, English.

**§ 9 Liability.** We are fully liable for intent, gross negligence, injury to life, body or health, under the Product Liability Act and under guarantees. For slight negligence, we are liable only for breach of essential contractual obligations, limited to typical foreseeable damage. Otherwise, liability for slight negligence is excluded. Carenes is not liable for salons' services or information, or for content posted by users.

**§ 10 Term and termination.** The contract runs for an indefinite period. Customers can terminate at any time by deleting their account (Account → Account Settings → Delete Account); existing bookings remain valid. Carenes may terminate with 2 weeks' notice, or immediately for good cause.

**§ 11 Changes.** Customers are notified at least 6 weeks in advance. If you do not object within this period, the changes are deemed accepted; we will point this out explicitly in the notice. If you object, either party may terminate. For salons, § C9 applies.

**§ 12 Dispute resolution.** We are neither willing nor obliged to take part in consumer arbitration proceedings (§ 36 VSBG). ⚠️ PRÜFEN

**§ 13 Final provisions.** German law applies, excluding the UN Convention on the International Sale of Goods (CISG); consumers keep the protection of mandatory laws of their country of residence. For merchants, the place of jurisdiction is Carenes' registered seat. If a clause is invalid, the rest remains valid. The German version prevails.

### Part B – Customers

**§ B1 Booking and contract.** Listings are not binding offers. Booking steps:
1. Choose the salon and services.
2. Choose the staff member, date and time.
3. Review the summary.
4. Choose the payment method (online or at the salon).
5. Accept these terms with the checkbox.
6. Tap **"Book with obligation to pay"** ("Zahlungspflichtig buchen") *(⚠️ button text not yet implemented — dev ticket needed before go-live)*.

You can go back and correct your entries at any time before submitting. Tapping the button is a binding offer to the salon. Carenes accepts it on the salon's behalf by confirming the booking in the app, and the contract with the salon is then concluded.

**§ B2 Prices.** The salon's prices shown at the time of booking apply. They are final prices including VAT where applicable. Discounts apply as shown.

**§ B3 Payment.** **Online:** via **Stripe** (credit or debit card). Carenes collects the payment on the salon's behalf, and your debt to the salon is settled once Carenes receives it. **At the salon:** you pay directly at the salon; this booking is also binding and payable. The salon issues the invoice.

**§ B4 Cancellation and rescheduling.**
- You can cancel free of charge or request a reschedule up to 2 hours before the appointment. A reschedule takes effect once the salon confirms it. *(⚠️ confirm reschedule uses the same 2h cutoff as cancellation before publishing.)*
- If you cancel in time, online payments are refunded in full within [REFUND PERIOD] days.
- If you cancel later or do not show up, the salon may charge [X] % ⚠️; you may always prove that the salon suffered lower or no damage.
- If the salon cancels, you get a full refund.
- An appointment counts as completed 3 hours after its scheduled end unless the salon marks it "No-Show". You can dispute that mark within 14 days by emailing support.

**§ B5 Right of withdrawal.** ⚠️ See the German version for the full statutory withdrawal notice and model form. In short: you may withdraw within 14 days of booking. The right expires once the service has been fully performed, if you expressly requested that it start during the withdrawal period. If you withdraw after the service has started, you pay a proportionate amount.

**§ B6 Defects.** Claims about a defective service must be made against the salon.

### Part C – Salons (B2B, P2B Regulation (EU) 2019/1150)

**§ C1 Admission.** Only businesses may register. The salon confirms it holds all required permits (e.g. entry in the craft register for hairdressing, trade registration). Profiles go live only after approval by Carenes. Approval may be refused for objective reasons, which we will explain. To receive online payouts, the salon must connect **Stripe Connect**.

**§ C2 Salon obligations.** The salon must:
- provide accurate and current information, with prices as final prices (Price Indication Ordinance)
- upload max. 4 photos *(⚠️ not yet enforced by backend validation — dev ticket needed)* and only photos it holds rights to
- honour confirmed bookings and cancel promptly through the app
- mark "No-Show" only when it is true
- perform services lawfully, including hygiene and tax rules
- not try to bypass the platform for bookings already made
- process customer data only for the appointment and in line with the GDPR

**§ C3 Staff and walk-in bookings.** The salon is the controller for staff data. *Walk-in / self-booking support is not yet available — this feature is still in development and this sub-section will be activated once it ships.* A data processing agreement (Art. 28 GDPR) is attached as Annex 1 ⚠️.

**§ C4 Commission.**
- Listing the salon is free.
- **Pay at salon:** a flat fee of [FLAT-FEE-CURRENCY] per booking (plus VAT ⚠️) — *not a percentage; corrected from the original draft's incorrect "20%"*. The amount due, with all underlying appointments, is shown under Account → Pay-on-shop details and is payable via Stripe within [PAYMENT TERM] days.
- **Online payments:** Carenes keeps **5%** and pays out the rest via Stripe Connect.
- No commission is due for cancelled or no-show appointments, unless the salon received compensation ⚠️.
- Late payment may lead to restricted visibility after a reminder with a reasonable deadline.

**§ C5 Ranking.** Main parameters:
- distance to the customer's location or searched address
- match with the search term and filters
- [ratings ⚠️]

Ranking is never influenced by payment.

**§ C6 Data access.** Salons can see their bookings, the customer data needed for each appointment, sales and reviews. Carenes uses only aggregated, non-personal data to improve the platform.

**§ C7 Restriction and suspension.** Possible in case of false information, serious or repeated justified complaints, misuse of the no-show function, late payment or legal violations. We give reasons on a durable medium (e.g. email) before or at the latest when the measure takes effect.

**§ C8 Termination.**
- Salon: 14 days' notice. Confirmed bookings must be honoured or properly cancelled, and open commissions remain due.
- Carenes: 30 days' notice with reasons (Art. 4 P2B).
- Either party may terminate immediately for good cause.

**§ C9 Changes.** At least 15 days' notice on a durable medium. The salon may terminate immediately before the changes take effect.

**§ C10 Complaints and mediation.** Free internal complaint handling at [SUPPORT-EMAIL]. Mediators: [MEDIATORS] ⚠️.

**§ C11 Indemnity.** The salon indemnifies Carenes against third-party claims resulting from its own culpable breaches, including reasonable legal defence costs.

**§ C12 Liability.** § 9 applies. For slight negligence, liability is additionally capped at the commissions the salon paid in the 12 months before the damage ⚠️.
