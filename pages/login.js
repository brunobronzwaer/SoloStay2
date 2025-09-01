import Head from "next/head";

export default function Login() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Head>
        <script src="https://cdn.tailwindcss.com" />
        <title>Inloggen — SoloStay</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-extrabold text-xl">
            Solo<span className="text-blue-600">Stay</span>
          </a>
          <nav className="text-sm">
            <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">Registreren</a>
          </nav>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold">Inloggen</h1>
        <p className="text-neutral-600 mt-1">Welkom terug! Log in met je e-mail.</p>

        <form className="mt-6 space-y-4" onSubmit={(e)=>e.preventDefault()}>
          <div>
            <label className="block text-sm mb-1">E-mail</label>
            <input type="email" required className="w-full rounded-xl border border-neutral-300 px-4 py-3 bg-white" placeholder="jij@email.nl" />
          </div>
          <div>
            <label className="block text-sm mb-1">Wachtwoord</label>
            <input type="password" required className="w-full rounded-xl border border-neutral-300 px-4 py-3 bg-white" placeholder="••••••••" />
          </div>
          <button className="w-full rounded-xl px-4 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
            Inloggen
          </button>
        </form>

        <p className="text-sm text-neutral-600 mt-4">
          Nog geen account?{" "}
          <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">Registreer hier</a>.
        </p>
      </main>
    </div>
  );
}
