import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-3xl prose prose-sm dark:prose-invert">
        <h1 className="font-display text-3xl font-bold mb-8">Nutzungsbedingungen / Kullanım Koşulları</h1>

        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Nutzungsbedingungen gelten für die Nutzung der Plattform PflegeConnect (pflegeconnect.eu),
          betrieben von PflegeConnect GmbH. Mit der Registrierung und Nutzung der Plattform erklären Sie sich
          mit diesen Bedingungen einverstanden.
        </p>

        <h2>2. Leistungsbeschreibung</h2>
        <p>
          PflegeConnect ist eine Vermittlungsplattform, die Pflegekräfte, Pflegeunternehmen und
          Patientenangehörige miteinander verbindet. Die Plattform bietet Profilseiten, Stellenanzeigen,
          Suchfunktionen und ein Bewertungssystem (CareScore).
        </p>

        <h2>3. Registrierung und Nutzerkonto</h2>
        <ul>
          <li>Nutzer müssen mindestens 18 Jahre alt sein.</li>
          <li>Die bei der Registrierung angegebenen Daten müssen wahrheitsgemäß sein.</li>
          <li>Jeder Nutzer darf nur ein Konto besitzen.</li>
          <li>Die Zugangsdaten sind vertraulich zu behandeln.</li>
        </ul>

        <h2>4. Nutzertypen</h2>
        <p>Die Plattform unterscheidet drei Nutzertypen:</p>
        <ul>
          <li><strong>Pflegekräfte (Hemşire):</strong> Erstellen ein Profil und bewerben sich auf Stellenanzeigen.</li>
          <li><strong>Unternehmen (Şirket):</strong> Veröffentlichen Stellenanzeigen und suchen nach Pflegekräften.</li>
          <li><strong>Angehörige (Hasta Yakını):</strong> Suchen nach Pflegekräften und Unternehmen in ihrer Region.</li>
        </ul>

        <h2>5. Abonnements und Zahlungen</h2>
        <p>
          Unternehmen können kostenpflichtige Abonnements (Ücretsiz, Pro, Elite) erwerben.
          Die Preise und Leistungen sind auf der Preisseite einsehbar. Zahlungen werden über
          unseren Zahlungsdienstleister Stripe abgewickelt.
        </p>

        <h2>6. Pflichten der Nutzer</h2>
        <ul>
          <li>Keine falschen oder irreführenden Informationen bereitstellen.</li>
          <li>Die Plattform nicht für rechtswidrige Zwecke nutzen.</li>
          <li>Keine automatisierten Zugriffe auf die Plattform durchführen.</li>
          <li>Inhalte anderer Nutzer respektieren und nicht missbrauchen.</li>
        </ul>

        <h2>7. Haftung</h2>
        <p>
          PflegeConnect haftet nicht für die Richtigkeit der von Nutzern bereitgestellten Informationen.
          Die Plattform dient lediglich als Vermittler und übernimmt keine Verantwortung für die
          Qualität der angebotenen Pflegeleistungen.
        </p>

        <h2>8. Kündigung</h2>
        <p>
          Nutzer können ihr Konto jederzeit löschen lassen. Bei Verstößen gegen diese
          Nutzungsbedingungen behält sich PflegeConnect das Recht vor, Konten zu sperren oder zu löschen.
        </p>

        <h2>9. Anwendbares Recht</h2>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Berlin.
        </p>

        <p className="text-sm text-muted-foreground mt-8">Stand: Februar 2026</p>
      </main>
      <Footer />
    </div>
  );
}
