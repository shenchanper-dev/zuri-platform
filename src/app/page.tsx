export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Sistema ZURI
        </h1>
        <p className="text-center mb-8">
          Plataforma de Transporte Médico No Urgente
        </p>
        <div className="text-center space-y-4">
          <a
            href="/dashboard/conductores"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Gestión de Conductores
          </a>
        </div>
      </div>
    </main>
  )
}
