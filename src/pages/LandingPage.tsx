import { Link } from 'react-router-dom'

const tools = [
  {
    title: 'Tournament Bracket',
    description:
      'Generate single-elimination brackets with automatic bye distribution. Print blank templates for manual tournament management.',
    href: '/bracket',
    available: true,
  },
  {
    title: 'Ref Scoresheet',
    description:
      'Track competitors, assign rankings, and calculate scores based on rankings during tournament divisions.',
    href: '/scoresheet',
    available: true,
  },
  {
    title: 'Division Calculator',
    description:
      'Aggregate judge scores, detect scoring discrepancies, and calculate final placements.',
    href: '/calculator',
    available: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Martial Arts Tools</h1>
      <p className="text-gray-500 mb-12 text-center max-w-md">
        Web applications for karate tournament management
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {tools.map((tool) => (
          <div
            key={tool.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
          >
            <div className="bg-gray-900 text-white px-5 py-4">
              <h2 className="font-bold text-lg">{tool.title}</h2>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <p className="text-gray-600 text-sm flex-1 mb-4">{tool.description}</p>
              {tool.available ? (
                <Link
                  to={tool.href}
                  className="inline-block bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded text-center hover:bg-gray-700 transition-colors"
                >
                  Open Tool
                </Link>
              ) : (
                <span className="inline-block bg-gray-100 text-gray-400 text-sm font-medium px-4 py-2 rounded text-center cursor-not-allowed">
                  Coming Soon
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
