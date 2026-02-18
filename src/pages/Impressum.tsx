import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Impressum() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-3xl prose prose-sm dark:prose-invert">
        <h1 className="font-display text-3xl font-bold mb-8">Impressum</h1>

        <h2>Angaben gemäß § 5 TMG</h2>
        <p>
          PflegeConnect GmbH<br />
          Musterstraße 1<br />
          10115 Berlin<br />
          Deutschland
        </p>

        <h2>Kontakt</h2>
        <p>
          Telefon: +49 (0) 30 123456789<br />
          E-Mail: info@pflegeconnect.eu<br />
          Website: www.pflegeconnect.eu
        </p>

        <h2>Vertreten durch</h2>
        <p>Geschäftsführer: [Name des Geschäftsführers]</p>

        <h2>Registereintrag</h2>
        <p>
          Eintragung im Handelsregister.<br />
          Registergericht: Amtsgericht Berlin-Charlottenburg<br />
          Registernummer: HRB [Nummer]
        </p>

        <h2>Umsatzsteuer-ID</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
          DE [Nummer]
        </p>

        <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>
          [Name]<br />
          Musterstraße 1<br />
          10115 Berlin
        </p>

        <h2>Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            https://ec.europa.eu/consumers/odr/
          </a>
        </p>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <h2>Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
          allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
          verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
          zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
        </p>
      </main>
      <Footer />
    </div>
  );
}
