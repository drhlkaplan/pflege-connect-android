import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-3xl prose prose-sm dark:prose-invert">
        <h1 className="font-display text-3xl font-bold mb-8">Datenschutzerklärung / Gizlilik Politikası</h1>

        <h2>1. Verantwortlicher</h2>
        <p>
          PflegeConnect GmbH<br />
          Musterstraße 1, 10115 Berlin<br />
          E-Mail: datenschutz@pflegeconnect.eu
        </p>

        <h2>2. Erhobene Daten</h2>
        <p>Wir erheben folgende personenbezogene Daten:</p>
        <ul>
          <li>Name, E-Mail-Adresse, Telefonnummer</li>
          <li>Adresse und Standortdaten (Koordinaten)</li>
          <li>Berufliche Qualifikationen und Erfahrungen (bei Pflegekräften)</li>
          <li>Unternehmensinformationen (bei Firmen)</li>
          <li>Pflegebedürfnisse (bei Angehörigen)</li>
          <li>Nutzungsdaten und Cookie-Präferenzen</li>
        </ul>

        <h2>3. Zweck der Datenverarbeitung</h2>
        <ul>
          <li>Bereitstellung der Plattformfunktionen</li>
          <li>Nutzerauthentifizierung und Kontoverwaltung</li>
          <li>Vermittlung zwischen Pflegekräften, Unternehmen und Angehörigen</li>
          <li>Standortbasierte Suche und CareScore-Berechnung</li>
          <li>Zahlungsabwicklung über Stripe</li>
          <li>Kommunikation und Benachrichtigungen</li>
        </ul>

        <h2>4. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a (Einwilligung),
          lit. b (Vertragserfüllung) und lit. f (berechtigtes Interesse) DSGVO.
        </p>

        <h2>5. Datenweitergabe</h2>
        <p>
          Ihre Daten werden nicht an Dritte verkauft. Eine Weitergabe erfolgt nur an:
        </p>
        <ul>
          <li>Stripe (Zahlungsabwicklung)</li>
          <li>Lovable Cloud / Supabase (Hosting und Datenbank)</li>
          <li>OpenStreetMap (Kartendarstellung, ohne personenbezogene Daten)</li>
        </ul>

        <h2>6. Cookies</h2>
        <p>
          Wir verwenden essenzielle Cookies für den Betrieb der Plattform.
          Analyse- und Marketing-Cookies werden nur mit Ihrer ausdrücklichen Einwilligung gesetzt.
          Sie können Ihre Cookie-Einstellungen jederzeit in Ihrem Profil ändern.
        </p>

        <h2>7. Ihre Rechte (DSGVO Art. 15-22)</h2>
        <ul>
          <li><strong>Auskunft:</strong> Sie haben das Recht zu erfahren, welche Daten wir über Sie speichern.</li>
          <li><strong>Berichtigung:</strong> Sie können die Korrektur unrichtiger Daten verlangen.</li>
          <li><strong>Löschung:</strong> Sie können die Löschung Ihrer Daten verlangen.</li>
          <li><strong>Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem maschinenlesbaren Format exportieren.</li>
          <li><strong>Widerspruch:</strong> Sie können der Verarbeitung Ihrer Daten widersprechen.</li>
          <li><strong>Einschränkung:</strong> Sie können die Einschränkung der Verarbeitung verlangen.</li>
        </ul>
        <p>
          Diese Rechte können Sie über die <a href="/privacy" className="text-primary hover:underline">GDPR-Einstellungen</a> in
          Ihrem Profil oder per E-Mail an datenschutz@pflegeconnect.eu ausüben.
        </p>

        <h2>8. Datenspeicherung</h2>
        <p>
          Ihre Daten werden so lange gespeichert, wie Ihr Konto aktiv ist oder wie es für die
          Erfüllung unserer vertraglichen und gesetzlichen Pflichten erforderlich ist.
        </p>

        <h2>9. Datensicherheit</h2>
        <p>
          Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten zu schützen,
          einschließlich Verschlüsselung, Zugriffskontrolle und regelmäßiger Sicherheitsprüfungen
          (Row Level Security).
        </p>

        <h2>10. Beschwerderecht</h2>
        <p>
          Sie haben das Recht, sich bei der zuständigen Aufsichtsbehörde zu beschweren.
          Die zuständige Aufsichtsbehörde ist der Berliner Beauftragte für Datenschutz und Informationsfreiheit.
        </p>

        <p className="text-sm text-muted-foreground mt-8">Stand: Februar 2026</p>
      </main>
      <Footer />
    </div>
  );
}
