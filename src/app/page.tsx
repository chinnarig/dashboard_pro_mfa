export const metadata = {
  title: 'Home | Zlavox AI',
  description: 'Discover amazing stories and insights from our community',
};

export default async function HomePage() {

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Welcome to <span className="text-primary">Zlavox AI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enterprise-Ready AI Voice Agents for Automated Phone Calls
          </p>
        </div>
      </section>
    </div>
  );
}