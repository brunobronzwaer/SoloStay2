import Head from "next/head";

export default function About() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Head>
        <script src="https://cdn.tailwindcss.com" />
        <title>Over ons — SoloStay</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-extrabold text-xl">
            Solo<span className="text-blue-600">Stay</span>
          </a>
          <nav className="text-sm">
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Login</a>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Over SoloStay</h1>
        <p className="mb-4">
          Mijn naam is Bruno, ik ben 32 jaar oud en al jaren loop ik tegen hetzelfde probleem aan:
          overal waar ik een hotel wil boeken, zijn de prijzen gericht op twee personen. Als je alleen reist,
          moet je vaak extra betalen of zelfs een hele georganiseerde singlereis boeken, terwijl je soms gewoon
          lekker zelf een hotelkamer wilt.
        </p>
        <p className="mb-4">
          Daarom ben ik <strong>SoloStay</strong> begonnen. Met deze website wil ik het makkelijker maken om
          als soloreiziger een <strong>hotel (en eventueel vlucht)</strong> te boeken zonder verborgen toeslagen of verplichtingen.
        </p>
        <p className="mb-4">
          Of je nu bewust alleen reist, voor werk onderweg bent, of simpelweg graag je eigen plan trekt —
          hier vind je eerlijke prijzen en heldere opties.
        </p>
        <p>
          Mijn hoop is dat SoloStay anderen helpt die hetzelfde ervaren: dat je gewoon kunt boeken zoals <em>jij</em> dat wilt.
        </p>
      </main>
    </div>
  );
}
