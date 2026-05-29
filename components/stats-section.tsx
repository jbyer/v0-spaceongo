export default function StatsSection() {
  const stats = [
    { number: "10,000+", label: "Active Spaces" },
    { number: "50,000+", label: "Happy Users" },
    { number: "100+", label: "Cities Worldwide" },
    { number: "99.9%", label: "Uptime" },
  ]

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Growing Together</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Our platform continues to grow, connecting more spaces and people every day.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-green-400 mb-2">{stat.number}</div>
              <div className="text-gray-300 text-lg">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
