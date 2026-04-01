'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Subscription {
  tier: string;
  status: string;
  current_period_end: string | null;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out Context One',
    features: [
      '1 project',
      '50 conversations stored',
      'Context injection for 1 AI tool',
      'Local storage only'
    ],
    cta: 'Current Plan',
    popular: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$15',
    period: '/month',
    description: 'For power users who need more',
    features: [
      'Unlimited projects',
      'Unlimited conversations',
      'Context injection for ALL 5 AI tools',
      'Cloud sync across devices',
      'Priority support',
      'Advanced analytics'
    ],
    cta: 'Upgrade to Pro',
    price_id: 'price_1TGk6aLuC3JmG6jsAIy4WS3Q',
    popular: true
  },
  {
    id: 'team',
    name: 'Team',
    price: '$49',
    period: '/month',
    description: 'For teams and agencies',
    features: [
      'Everything in Pro',
      'Up to 10 team members',
      'Shared project libraries',
      'Team analytics',
      'Admin controls',
      'API access'
    ],
    cta: 'Contact Sales',
    price_id: 'price_1TGk6bLuC3JmG6jsR5YU1LKt',
    popular: false
  }
];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription>({
    tier: 'free',
    status: 'active',
    current_period_end: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const upgraded = searchParams.get('upgraded') === 'true';

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    // Default to free tier - Stripe integration coming later
    setSubscription({ tier: 'free', status: 'active', current_period_end: null });
  };

  const handleUpgrade = async (plan: typeof plans[0]) => {
    if (plan.id === 'free' || plan.id === 'team') return;
    
    setError('Stripe billing coming soon! Contact support to upgrade.');
  };

  const handleManageBilling = async () => {
    setError('Stripe billing coming soon!');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Billing & Plans</h1>
        <p className="text-gray-400">Manage your subscription and billing</p>
      </div>

      {upgraded && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-6">
          🎉 Successfully upgraded to Pro! Your subscription is now active.
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Current Plan */}
      {subscription.tier !== 'free' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Current Plan: {subscription.tier.toUpperCase()}</h2>
              <p className="text-gray-400 text-sm">
                {subscription.status === 'active' ? 'Active' : subscription.status}
                {subscription.current_period_end && ` · Renews {new Date(subscription.current_period_end).toLocaleDateString()}`}
              </p>
            </div>
            <button
              onClick={handleManageBilling}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Manage Billing
            </button>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-gray-800/50 border rounded-xl p-6 ${
              plan.popular
                ? 'border-cyan-400 relative'
                : subscription.tier === plan.id
                ? 'border-green-500'
                : 'border-gray-700'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-400 text-gray-900 text-xs font-semibold rounded-full">
                Most Popular
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan)}
              disabled={loading || subscription.tier === plan.id || plan.id === 'team'}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                subscription.tier === plan.id
                  ? 'bg-green-500/20 text-green-400 cursor-default'
                  : plan.popular
                  ? 'bg-cyan-400 hover:bg-cyan-300 text-gray-900'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              } disabled:opacity-50`}
            >
              {subscription.tier === plan.id ? 'Current Plan' : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-400 text-sm">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-400 text-sm">We accept all major credit cards through Stripe. Your payment information is never stored on our servers.</p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Is there a free trial?</h3>
            <p className="text-gray-400 text-sm">The Free plan gives you unlimited time to try out basic features. Upgrade when you're ready for more.</p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">What happens to my data if I cancel?</h3>
            <p className="text-gray-400 text-sm">Your data remains available for 30 days after cancellation. You can export it anytime from your dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}