'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const steps = [
  {
    id: 1,
    title: 'Create Your First Project',
    description: 'Organize your AI conversations into projects',
    icon: '📁'
  },
  {
    id: 2,
    title: 'Install the Extension',
    description: 'Add Context One to your browser',
    icon: '🔌'
  },
  {
    id: 3,
    title: 'Choose Your Storage',
    description: 'Local only or cloud sync',
    icon: '☁️'
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [storagePreference, setStoragePreference] = useState('local');
  const [loading, setLoading] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      setCurrentStep(2);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    // Save storage preference
    localStorage.setItem('storagePreference', storagePreference);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.id 
                  ? 'bg-cyan-400 border-cyan-400 text-gray-900' 
                  : 'border-gray-600 text-gray-600'
              }`}>
                {currentStep > step.id ? '✓' : step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 ${
                  currentStep > step.id ? 'bg-cyan-400' : 'bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Create Project */}
        {currentStep === 1 && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">{steps[0].icon}</div>
              <h1 className="text-2xl font-bold text-white mb-2">{steps[0].title}</h1>
              <p className="text-gray-400">{steps[0].description}</p>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  placeholder="e.g., Real Estate Lead Gen"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 h-24 resize-none"
                  placeholder="What is this project about?"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !projectName}
                className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Install Extension */}
        {currentStep === 2 && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">{steps[1].icon}</div>
              <h1 className="text-2xl font-bold text-white mb-2">{steps[1].title}</h1>
              <p className="text-gray-400">{steps[1].description}</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                <h3 className="text-white font-medium mb-2">Chrome</h3>
                <ol className="text-gray-400 text-sm space-y-2">
                  <li>1. Download the extension from the dashboard</li>
                  <li>2. Open Chrome and go to chrome://extensions</li>
                  <li>3. Enable &quot;Developer mode&quot; in top right</li>
                  <li>4. Click &quot;Load unpacked&quot; and select the extension folder</li>
                </ol>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                <h3 className="text-white font-medium mb-2">Supported AI Tools</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Grok'].map(tool => (
                    <span key={tool} className="px-3 py-1 bg-cyan-400/20 text-cyan-400 rounded-full text-sm">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(3)}
              className="w-full mt-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              I&apos;ve Installed the Extension
            </button>
          </div>
        )}

        {/* Step 3: Choose Storage */}
        {currentStep === 3 && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="text-4xl mb-4">{steps[2].icon}</div>
              <h1 className="text-2xl font-bold text-white mb-2">{steps[2].title}</h1>
              <p className="text-gray-400">{steps[2].description}</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setStoragePreference('local')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  storagePreference === 'local'
                    ? 'border-cyan-400 bg-cyan-400/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💾</div>
                  <div>
                    <h3 className="text-white font-medium">Local Only (Free)</h3>
                    <p className="text-gray-400 text-sm">Data stays on your device</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStoragePreference('cloud')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  storagePreference === 'cloud'
                    ? 'border-cyan-400 bg-cyan-400/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">☁️</div>
                  <div>
                    <h3 className="text-white font-medium">Cloud Sync (Pro)</h3>
                    <p className="text-gray-400 text-sm">Sync across devices - $15/mo</p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={handleComplete}
              className="w-full mt-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-gray-900 font-semibold rounded-lg transition-colors"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
}