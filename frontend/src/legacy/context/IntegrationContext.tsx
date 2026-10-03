import { createContext, useContext, useState, ReactNode } from 'react'

export interface ExtractedField {
  field_name: string
  value: string
  confidence: number
  data_type: string
}

export interface PipelineSummary {
  document_id: string
  field_count: number
  mapping_completeness: number
  overall_quality_score: number
  deployment_ready: boolean
  total_processing_time_ms: number
  intent: string
  workflow_type: string
}

export interface DocumentResult {
  document_index: number
  document_name: string
  timestamp?: string
  result: {
    pipeline_summary: PipelineSummary
    step_1_document_parsing: {
      sections: string[]
      tables: string[]
      extraction_quality_score: number
      processing_time_ms: number
    }
    step_2_field_extraction: {
      extracted_fields: ExtractedField[]
      intent: string
      intent_confidence: number
    }
    step_3_api_mapping: {
      mappings: string[]
      mapping_statistics: {
        mapped_fields: number
        overall_mapping_completeness: number
      }
    }
    step_4_simulation: {
      status: string
      deployment_readiness: {
        is_ready: boolean
        readiness_score: number
      }
    }
  }
}

export interface UploadData {
  results: DocumentResult[]
  summary: {
    total_documents: number
    status: string
  }
}

interface IntegrationContextType {
  uploadData: UploadData | null
  setUploadData: (data: UploadData) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
  currentDocumentIndex: number
  setCurrentDocumentIndex: (index: number) => void
}

const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined)

export function IntegrationProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage if available
  const [uploadData, setUploadDataState] = useState<UploadData | null>(() => {
    try {
      const stored = localStorage.getItem('fins_upload_data')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(() => {
    try {
      const stored = localStorage.getItem('fins_current_doc_index')
      return stored ? parseInt(stored) : 0
    } catch {
      return 0
    }
  })

  // Persist uploadData to localStorage whenever it changes
  const setUploadData = (data: UploadData) => {
    setUploadDataState(data)
    try {
      localStorage.setItem('fins_upload_data', JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save upload data to localStorage:', e)
    }
  }

  // Persist currentDocumentIndex to localStorage whenever it changes
  const setCurrentDocumentIndexPersist = (index: number) => {
    setCurrentDocumentIndex(index)
    try {
      localStorage.setItem('fins_current_doc_index', String(index))
    } catch (e) {
      console.error('Failed to save document index to localStorage:', e)
    }
  }

  return (
    <IntegrationContext.Provider
      value={{
        uploadData,
        setUploadData,
        isLoading,
        setIsLoading,
        error,
        setError,
        currentDocumentIndex,
        setCurrentDocumentIndex: setCurrentDocumentIndexPersist,
      }}
    >
      {children}
    </IntegrationContext.Provider>
  )
}

export function useIntegration() {
  const context = useContext(IntegrationContext)
  if (context === undefined) {
    throw new Error('useIntegration must be used within IntegrationProvider')
  }
  return context
}
