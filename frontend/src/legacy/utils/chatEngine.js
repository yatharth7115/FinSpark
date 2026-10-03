import axios from 'axios';

// Page-aware context
const PAGE_CONTEXT = {
  Home: 'Home/Dashboard page - user viewing main interface',
  Upload: 'Upload page - user uploading documents',
  Analysis: 'Analysis page - viewing document analysis results',
  Mapping: 'Field Mapping page - mapping document fields to APIs',
  Simulation: 'Simulation page - previewing pipeline execution',
  Deploy: 'Deploy page - executing the integration pipeline',
  Dashboard: 'Dashboard page - viewing active pipelines',
};

export const generateResponse = async (message, currentPage) => {
  try {
    // Use Llama via Groq (most reliable free option)
    const response = await callLlamaAPI(message, currentPage);
    return response;
  } catch (error) {
    console.error('Error calling Llama API:', error);
    
    // Fallback to contextual responses
    return generateLocalResponse(message, currentPage);
  }
};

const callLlamaAPI = async (message, currentPage) => {
  // Construct system prompt with page context
  const pageContext = PAGE_CONTEXT[currentPage] || 'FinSpark platform';
  const systemPrompt = `You are FinSpark AI, a helpful assistant for financial API integration platform.
Current page: ${pageContext}

You help users with:
1. Understanding how to use FinSpark platform
2. Uploading and processing financial documents
3. Mapping document fields to financial APIs (KYC, CIBIL, UPI, etc.)
4. Executing integration pipelines
5. Monitoring and troubleshooting integrations

Keep responses concise (2-3 sentences max), friendly, and directly relevant to the user's current page.
Answer general questions intelligently while maintaining context about the FinSpark platform.`;

  try {
    // Try Groq API (free, fast, no auth needed for demo)
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama2-70b-4096',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 150,
      },
      {
        headers: {
          'Authorization': `Bearer demo`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    const text = response.data.choices[0]?.message?.content || 'I could not generate a response.';
    return {
      text: text.trim(),
      shouldSpeak: false,
    };
  } catch (groqError) {
    console.log('Groq API not available, using local response generator');
    throw new Error('Using fallback');
  }
};

// Suggested questions for users
export const SUGGESTED_QUESTIONS = [
  '💡 How do I upload a document?',
  '🔀 What APIs can you integrate?',
  '📊 How does field mapping work?',
  '🚀 How do I deploy an integration?',
  '✅ What file formats are supported?',
  '🤖 How accurate is the AI mapping?'
];

const generateLocalResponse = (message, currentPage) => {
  const msgLower = message.toLowerCase().trim();
  
  // General greeting and conversational responses
  const conversationalPatterns = {
    hello: 'Hi there! 👋 How can I help you with FinSpark today?',
    'how are you': 'I\'m doing great! Ready to help you with your financial API integrations. What would you like to know?',
    'how r u': 'Doing well! How can I assist you with FinSpark?',
    'hi': 'Hello! Welcome to FinSpark. What can I help you with?',
    'hey': 'Hey! 👋 What do you need help with?',
    'thanks': 'You\'re welcome! Let me know if you need anything else.',
    'thank you': 'Happy to help! Feel free to ask me anything about FinSpark.',
    'help': 'I can help with document uploads, field mapping, API integration, and pipeline execution. What would you like to do?',
    'what can you do': 'I can assist with uploading documents, analyzing fields, mapping to APIs, and managing integration pipelines. What\'s your current task?',
  };
  
  // Extended Q&A knowledge base (5-6 general questions)
  const faqPatterns = {
    'upload|document|how do i upload|file format|supported format': 'FinSpark supports PDF, DOCX, and TXT files. Simply click the upload area or drag & drop your financial document. The system will automatically extract fields and suggest relevant APIs for your data.',
    'api|integrate|which api|kyc|cibil|upi': 'We support 10+ financial APIs including KYC-Pro (identity verification), CIBIL (credit scoring), UPI Gateway (payments), E-signature, Bank-Disbursal (loans), and more. The AI automatically detects which APIs match your document fields.',
    'field mapping|mapping|how does mapping|map fields': 'Field mapping connects your document fields to the right financial APIs. Our AI analyzes each field and intelligently routes it to the appropriate API. You can review and customize mappings before deploying.',
    'deploy|execute|run pipeline|go live|launch': 'Deployment executes your configured pipeline: 1) Review your mappings, 2) Click Deploy, 3) The system processes your document through selected APIs, 4) View results in the Dashboard. It takes just a few seconds!',
    'accuracy|confidence|how accurate|trust': 'Our AI achieves 80-90% mapping accuracy using advanced machine learning. Each field has a confidence score showing how certain the system is. You can always override or refine mappings manually.',
    'time|fast|speed|processing|how long': 'Document processing typically takes 2-5 seconds depending on file size and complexity. Field extraction and API mapping run in parallel for optimal performance. Check the Dashboard for detailed timing metrics.',
  };

  // Page-specific context-aware responses
  const pageResponses = {
    Upload: {
      'upload': 'You can upload PDF, DOCX, or TXT files containing financial documents. The system will automatically extract fields and suggest relevant APIs.',
      'how to upload': 'Click the upload area or drag & drop your document. Supported formats: PDF, DOCX, TXT.',
      'what files': 'Upload financial documents like KYC forms, loan applications, identity documents, or any structured data.',
    },
    Analysis: {
      'results': 'The analysis shows extracted fields and recommended APIs based on field types and content.',
      'confidence': 'Confidence scores reflect how well the system matched fields to appropriate APIs.',
    },
    Mapping: {
      'mapping': 'Field mapping connects your document fields to the right financial APIs for processing.',
      'apis': 'You can map fields to multiple APIs like KYC, CIBIL, UPI Gateway, E-sign, etc.',
      'customize': 'Review and adjust mappings before deployment to ensure correct API routing.',
    },
    Simulation: {
      'simulate': 'Simulation shows how your pipeline will execute without actually processing the data.',
      'preview': 'See the execution flow and expected outputs before final deployment.',
    },
    Deploy: {
      'deploy': 'Deployment executes your configured pipeline, processing the document through selected APIs.',
      'execute': 'Click Deploy to process your document and see results in the Dashboard.',
    },
    Dashboard: {
      'dashboard': 'Dashboard shows all active pipelines with status, execution results, and history.',
      'pipeline': 'Each pipeline represents a configured integration. You can run, stop, or delete pipelines.',
      'status': 'Check the status of your integrations and view detailed execution history.',
    },
  };

  // Check for conversational patterns
  for (const [keyword, response] of Object.entries(conversationalPatterns)) {
    if (msgLower.includes(keyword)) {
      return { text: response, shouldSpeak: false };
    }
  }
  
  // Check for FAQ patterns
  for (const [keywords, response] of Object.entries(faqPatterns)) {
    const keywordArray = keywords.split('|');
    if (keywordArray.some(kw => msgLower.includes(kw))) {
      return { text: response, shouldSpeak: false };
    }
  }

  // Check for page-specific responses
  const pageSpecificResponses = pageResponses[currentPage];
  if (pageSpecificResponses) {
    for (const [keyword, response] of Object.entries(pageSpecificResponses)) {
      if (msgLower.includes(keyword)) {
        return { text: response, shouldSpeak: false };
      }
    }
  }

  // Generic FinSpark help responses
  const genericResponses = [
    'FinSpark helps you integrate financial APIs by automatically mapping fields from documents to appropriate services.',
    'You can upload documents, analyze fields, map them to APIs like KYC, CIBIL, UPI, and execute the pipeline automatically.',
    'Start by uploading a document in the Upload section. I\'ll help guide you through the rest!',
    'Financial APIs require proper field mapping. That\'s what FinSpark does - intelligently connects your data to the right services.',
  ];

  // For general questions user hasn't heard specific answer to
  const randomResponse = genericResponses[Math.floor(Math.random() * genericResponses.length)];
  return { text: randomResponse, shouldSpeak: false };
};
