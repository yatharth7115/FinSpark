import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ExternalLink, CheckCircle, Clock, X, Code, BookOpen, Zap } from 'lucide-react'

const apiDetails: Record<string, any> = {
  'Stripe': {
    name: 'Stripe',
    category: 'Payments',
    version: 'v3',
    status: 'active',
    endpoints: 87,
    description: 'Payment processing and billing API',
    fullDescription: 'Accept payments from customers anywhere in the world. Stripe handles billions of dollars in transactions for websites, apps, and more.',
    features: ['Payment processing', 'Subscription billing', 'Connect marketplace', 'Fraud prevention', 'Payment Links', 'Terminal'],
    authentication: 'API Key Authentication',
    rateLimit: '100 requests/second',
    endpoints_list: ['POST /v1/charges', 'GET /v1/charges/:id', 'POST /v1/customers', 'POST /v1/payment_intents', 'POST /v1/refunds']
  },
  'Plaid': {
    name: 'Plaid',
    category: 'Banking',
    version: 'v2',
    status: 'active',
    endpoints: 34,
    description: 'Financial data and bank connectivity',
    fullDescription: 'Connect with millions of financial institutions across 20+ countries to access account and transaction data.',
    features: ['Account verification', 'Transaction data', 'Income verification', 'Bank connectivity', 'Identity verification', 'Cateting intelligence'],
    authentication: 'OAuth 2.0',
    rateLimit: '10 requests/second',
    endpoints_list: ['POST /link/token/create', 'POST /item/public_token/exchange', 'GET /accounts', 'GET /transactions', 'POST /institutions/search']
  },
  'Salesforce': {
    name: 'Salesforce',
    category: 'CRM',
    version: 'v56',
    status: 'active',
    endpoints: 120,
    description: 'CRM and customer data platform',
    fullDescription: 'Build customer success with the #1 CRM. Connect to customers, data, and systems faster.',
    features: ['Sales Cloud', 'Service Cloud', 'Commerce Cloud', 'Marketing Cloud', 'Analytics Cloud', 'Experience Cloud'],
    authentication: 'OAuth 2.0 + JWT',
    rateLimit: '15 requests/second',
    endpoints_list: ['GET /services/data/v56.0/sobjects', 'POST /services/data/v56.0/sobjects/Account', 'GET /services/data/v56.0/query', 'PATCH /services/data/v56.0/sobjects/Account/:id']
  },
  'QuickBooks': {
    name: 'QuickBooks',
    category: 'Accounting',
    version: 'v3',
    status: 'active',
    endpoints: 56,
    description: 'Accounting and financial management',
    fullDescription: 'The easiest way to access QuickBooks data. Build powerful solutions for small business financial management.',
    features: ['Invoice management', 'Expense tracking', 'Bank reconciliation', 'Financial reporting', 'Tax compliance', 'Multi-entity support'],
    authentication: 'OAuth 2.0',
    rateLimit: '200 requests/minute',
    endpoints_list: ['POST /quickbooks/company/:realmId/invoice', 'GET /quickbooks/company/:realmId/invoice/:invoiceId', 'POST /quickbooks/company/:realmId/payment']
  },
  'Twilio': {
    name: 'Twilio',
    category: 'Communications',
    version: 'v2',
    status: 'active',
    endpoints: 45,
    description: 'SMS, voice, and messaging API',
    fullDescription: 'Add messaging, voice, and video to your applications with Twilio APIs.',
    features: ['SMS messaging', 'Voice calls', 'Video conferencing', 'WhatsApp integration', 'Email', 'Fax'],
    authentication: 'HTTP Basic Auth',
    rateLimit: '1000 concurrent connections',
    endpoints_list: ['POST /2010-04-01/Accounts/:AccountSid/Messages.json', 'POST /2010-04-01/Accounts/:AccountSid/Calls.json', 'POST /Conversations/Conversations']
  },
  'HubSpot': {
    name: 'HubSpot',
    category: 'CRM',
    version: 'v3',
    status: 'pending',
    endpoints: 78,
    description: 'Inbound marketing and sales platform',
    fullDescription: 'HubSpot CRM platform includes marketing, sales, service, and operations software to grow your business.',
    features: ['Contact management', 'Deal tracking', 'Email integration', 'Workflow automation', 'Reporting', 'Ticket management'],
    authentication: 'API Key',
    rateLimit: '100 requests/10 seconds',
    endpoints_list: ['GET /crm/v3/objects/contacts', 'POST /crm/v3/objects/contacts', 'GET /crm/v3/objects/deals', 'POST /crm/v3/objects/deals']
  },
  'PayPal': {
    name: 'PayPal',
    category: 'Payments',
    version: 'v2',
    status: 'active',
    endpoints: 62,
    description: 'Online payment processing',
    fullDescription: 'Payments made simple & secure. Accept payments anywhere, anytime with PayPal Commerce Platform.',
    features: ['Payment processing', 'Subscriptions', 'Invoicing', 'Dispute resolution', 'Seller protection', 'International payments'],
    authentication: 'OAuth 2.0',
    rateLimit: '50 requests/second',
    endpoints_list: ['POST /v2/checkout/orders', 'POST /v2/checkout/orders/:id/capture', 'POST /v2/payments/capture-authorized-payment-id']
  },
  'NetSuite': {
    name: 'NetSuite',
    category: 'ERP',
    version: 'v1',
    status: 'pending',
    endpoints: 90,
    description: 'Enterprise resource planning system',
    fullDescription: '#1 cloud ERP system for growing businesses. Manage finances, supply chain, and operations.',
    features: ['Financial management', 'Supply chain', 'Order management', 'Inventory', 'Revenue recognition', 'Multi-subsidiary'],
    authentication: 'OAuth 2.0 + Token Auth',
    rateLimit: '10 requests/second',
    endpoints_list: ['GET /services/rest/record/v1/customer', 'POST /services/rest/record/v1/customer', 'GET /services/rest/record/v1/salesorder']
  },
  'Xero': {
    name: 'Xero',
    category: 'Accounting',
    version: 'v2',
    status: 'active',
    endpoints: 48,
    description: 'Cloud accounting software',
    fullDescription: 'Beautiful, easy-to-use online accounting software designed for small businesses.',
    features: ['Invoicing', 'Expense management', 'Reconciliation', 'Financial reporting', 'Tax compliance', 'Time tracking'],
    authentication: 'OAuth 2.0',
    rateLimit: '60 requests/minute',
    endpoints_list: ['GET /api.xro/2.0/Invoices', 'POST /api.xro/2.0/Invoices', 'GET /api.xro/2.0/Contacts']
  },
  'KYC Pro': {
    name: 'KYC Pro',
    category: 'Compliance',
    version: 'v2',
    status: 'active',
    endpoints: 52,
    description: 'Identity verification and KYC compliance API',
    fullDescription: 'Complete identity verification and KYC/AML compliance for your business. Know Your Customer simplified.',
    features: ['Document verification', 'Liveness detection', 'Face matching', 'AML screening', 'Sanction lists', 'Report generation'],
    authentication: 'API Key + OAuth 2.0',
    rateLimit: '100 requests/minute',
    endpoints_list: ['POST /verify/document', 'POST /verify/liveness', 'GET /verify/status/:verificationId', 'POST /screening/aml']
  }
}

const apis = [
  { name: 'Stripe', category: 'Payments', version: 'v3', status: 'active', endpoints: 87, description: 'Payment processing and billing API' },
  { name: 'Plaid', category: 'Banking', version: 'v2', status: 'active', endpoints: 34, description: 'Financial data and bank connectivity' },
  { name: 'Salesforce', category: 'CRM', version: 'v56', status: 'active', endpoints: 120, description: 'CRM and customer data platform' },
  { name: 'QuickBooks', category: 'Accounting', version: 'v3', status: 'active', endpoints: 56, description: 'Accounting and financial management' },
  { name: 'Twilio', category: 'Communications', version: 'v2', status: 'active', endpoints: 45, description: 'SMS, voice, and messaging API' },
  { name: 'HubSpot', category: 'CRM', version: 'v3', status: 'pending', endpoints: 78, description: 'Inbound marketing and sales platform' },
  { name: 'PayPal', category: 'Payments', version: 'v2', status: 'active', endpoints: 62, description: 'Online payment processing' },
  { name: 'NetSuite', category: 'ERP', version: 'v1', status: 'pending', endpoints: 90, description: 'Enterprise resource planning system' },
  { name: 'Xero', category: 'Accounting', version: 'v2', status: 'active', endpoints: 48, description: 'Cloud accounting software' },
  { name: 'KYC Pro', category: 'Compliance', version: 'v2', status: 'active', endpoints: 52, description: 'Identity verification and KYC compliance API' },
]

const categories = ['All', ...Array.from(new Set(apis.map(a => a.category)))]

const categoryColors: Record<string, string> = {
  'Payments': 'bg-emerald-400/10 text-emerald-400',
  'Banking': 'bg-blue-400/10 text-blue-400',
  'CRM': 'bg-violet-400/10 text-violet-400',
  'Accounting': 'bg-amber-400/10 text-amber-400',
  'Communications': 'bg-pink-400/10 text-pink-400',
  'ERP': 'bg-cyan-400/10 text-cyan-400',
  'Compliance': 'bg-red-400/10 text-red-400',
}

export default function APIRegistry() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selectedAPI, setSelectedAPI] = useState<string | null>(null)
  const [searchParams] = useSearchParams()

  // Initialize search from URL query params
  useEffect(() => {
    const querySearch = searchParams.get('search')
    if (querySearch) {
      setSearch(querySearch)
    }
  }, [searchParams])

  const filtered = apis.filter(
    a => (category === 'All' || a.category === category) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Registry</h1>
          <p className="text-slate-400 text-sm mt-1">Browse and manage connected APIs</p>
        </div>
        <button className="px-4 py-2 bg-cyan-400 text-slate-950 rounded-lg font-semibold text-sm hover:bg-cyan-300 transition-colors">
          + Register API
        </button>
      </div>

      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search APIs..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === cat ? 'bg-cyan-400/10 border border-cyan-400/30 text-cyan-400' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((api, i) => (
          <motion.div
            key={api.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-white text-lg">{api.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[api.category] || 'bg-slate-700 text-slate-400'}`}>
                  {api.category}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {api.status === 'active' ? (
                  <><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" /></>
                ) : (
                  <><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                  <Clock className="w-4 h-4 text-amber-400" /></>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">{api.description}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded">{api.version}</span>
              <span>{api.endpoints} endpoints</span>
              <button 
                onClick={() => setSelectedAPI(api.name)}
                className="flex items-center gap-1 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-cyan-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* API Details Modal */}
      <AnimatePresence>
        {selectedAPI && apiDetails[selectedAPI] && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAPI(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-8 py-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{apiDetails[selectedAPI].name}</h2>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${categoryColors[apiDetails[selectedAPI].category] || 'bg-slate-700 text-slate-400'}`}>
                        {apiDetails[selectedAPI].category}
                      </span>
                      {apiDetails[selectedAPI].status === 'active' ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-400 text-sm">
                          <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAPI(null)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-8 py-6 space-y-6">
                  {/* Description */}
                  <div>
                    <p className="text-slate-300 text-lg mb-2">{apiDetails[selectedAPI].fullDescription}</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800 rounded-lg p-4 text-center">
                      <p className="text-slate-500 text-xs mb-1">Version</p>
                      <p className="text-xl font-bold text-cyan-400">{apiDetails[selectedAPI].version}</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4 text-center">
                      <p className="text-slate-500 text-xs mb-1">Endpoints</p>
                      <p className="text-xl font-bold text-emerald-400">{apiDetails[selectedAPI].endpoints}</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4 text-center">
                      <p className="text-slate-500 text-xs mb-1">Auth</p>
                      <p className="text-sm font-semibold text-amber-400 truncate">{apiDetails[selectedAPI].authentication}</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4 text-center">
                      <p className="text-slate-500 text-xs mb-1">Rate Limit</p>
                      <p className="text-sm font-semibold text-violet-400">{apiDetails[selectedAPI].rateLimit}</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-bold text-white">Key Features</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {apiDetails[selectedAPI].features.map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-slate-300">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Endpoints */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Code className="w-5 h-5 text-orange-400" />
                      <h3 className="text-lg font-bold text-white">Sample Endpoints</h3>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                      {apiDetails[selectedAPI].endpoints_list.map((endpoint: string, i: number) => (
                        <code key={i} className="block text-sm text-emerald-400 font-mono break-all">
                          {endpoint}
                        </code>
                      ))}
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-bold text-white">Documentation</h3>
                    </div>
                    <button className="w-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 px-4 py-2 rounded-lg hover:bg-cyan-400/20 transition-colors flex items-center justify-center gap-2 font-medium">
                      <ExternalLink className="w-4 h-4" />
                      View Full Documentation
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
