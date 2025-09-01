import Head from "next/head";

export default function Contact() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Head>
        <script src="https://cdn.tailwindcss.com" />
        <title>Contact — SoloStay</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Neem contact op met SoloStay. We helpen je graag met vragen over solo-reizen en eerlijke 1-persoons hotelprijzen." />
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
        <h1 className="text-3xl font-bold mb-2">Contact</h1>
        <p className="text-neutral-600">
          Vragen of een samenwerking? Stuur ons gerust een bericht.
        </p>

        {/* Direct e-mail blok */}
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <p className="text-sm text-neutral-600">E-mail</p>
          <p className="text-lg font-semibold">
            <a href="mailto:info@solostay.nl" className="text-blue-600 hover:text-blue-700">
              info@solostay.nl
            </a>
          </p>
        </div>

        {/* Simpel formulier (opent e-mailclient met voorgevulde inhoud) */}
        <form
          className="mt-6 grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = form.name?.value || "";
            const email = form.email?.value || "";
            const msg = form.message?.value || "";
            const subject = encodeURIComponent(`Bericht via SoloStay van ${name}`);
            const body = encodeURIComponent(`Naam: ${name}\nE-mail: ${email}\n\nBericht:\n${msg}`);
            window.location.href = `mailto:info@solostay.nl?subject=${subject}&body=${body}`;
          }}
        >
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">Naam</label>
            <input name="name" className="w-full rounded-xl border border-neutral-300 px-4 py-3 bg-white" placeholder="Je naam" required />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">E-mail</label>
            <input name="email" type="email" className="w-full rounded-xl border border-neutral-300 px-4 py-3 bg-white" placeholder="jij@email.nl" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Bericht</label>
            <textarea name="message" rows={5} className="w-full rounded-xl border border-neutral-300 px-4 py-3 bg-white" placeholder="Waarmee kunnen we helpen?" required />
          </div>
          <div className="md:col-span-2">
            <button className="w-full md:w-auto rounded-xl px-6 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
              Versturen
            </button>
          </div>
        </form>

        <div className="mt-8 text-sm text-neutral-600">
          <p><strong>E-mail:</strong> <a href="mailto:info@solostay.nl" className="text-blue-600 hover:text-blue-700">info@solostay.nl</a></p>
          <p><strong>Adres:</strong> Online-only 🇳🇱</p>
        </div>
      </main>
    </div>
  );
}
