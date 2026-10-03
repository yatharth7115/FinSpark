from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import io
import os
from dotenv import load_dotenv
import json
from pathlib import Path
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Import database and auth
from app.api.auth import get_current_user

# Import your engine and analyzer
from app.services.engine import run_full_pipeline, generate_summary_report
from app.services.requirement_analyzer import analyzer

from app.services.documents import (
    read_document,
    save_pipeline_history,
    get_pipeline_history,
    history_user,
    history_directory,
    history_path,
)
from app.core.config import settings


async def history_owner(user=Depends(get_current_user)):
    context = history_user.set(user.id)
    try:
        yield user
    finally:
        history_user.reset(context)


router = APIRouter(dependencies=[Depends(history_owner)])

# ============================================================
# ROOT
# ============================================================


@router.get("/")
def home():
    return {"message": "FinSpark API is running 🚀"}


# ============================================================
# MAIN API ENDPOINT
# ============================================================


@router.post("/process/")
async def process_files(file: UploadFile = File(...)):
    """
    Process uploaded file through the pipeline with INTELLIGENT API DETECTION
    - Step 1 & 2: Parse document into sections and fields (engine.py)
    - Step 3+: Use Llama to analyze parsed data for APIs and mappings
    """

    text = await read_document(file)

    print(f"\n{'=' * 60}")
    print(f"📄 Processing: {file.filename}")
    print(f"{'=' * 60}")

    # ====================================================
    # STEP 1 & 2: PARSE DOCUMENT (engine.py)
    # ====================================================
    documents = [
        {
            "name": file.filename,
            "content": text,
            "file_type": file.filename.split(".")[-1],
        }
    ]

    print("\n📝 Step 1-2: Parsing document with engine...")
    results = run_full_pipeline(documents)

    # Extract parsed sections and fields from results
    if results and len(results) > 0:
        parsed_sections = (
            results[0]
            .get("result", {})
            .get("step_1_document_parsing", {})
            .get("sections", [])
        )
        extracted_fields = (
            results[0]
            .get("result", {})
            .get("step_2_field_extraction", {})
            .get("extracted_fields", [])
        )
    else:
        parsed_sections = []
        extracted_fields = []

    print(f"✅ Parsed {len(parsed_sections)} sections, {len(extracted_fields)} fields")

    # ====================================================
    # INTELLIGENT ANALYSIS: Use parsed data for API detection
    # ====================================================
    print("\n🤖 Step 3+: Intelligent API detection with Llama...")

    analysis = analyzer.analyze_parsed_fields(extracted_fields, parsed_sections)

    detected_apis = analysis.get("detected_apis", [])
    field_mappings = analysis.get("field_to_api_mapping", {})
    workflow_requirements = analysis.get("workflow_requirements", [])

    print(f"\n📌 Detected Workflow Requirements:")
    for i, req in enumerate(workflow_requirements, 1):
        print(f"   {i}. {req}")

    print(f"\n🔗 Auto-mapped {len(field_mappings)} fields:")
    for field, api_id in list(field_mappings.items())[:5]:  # Show first 5
        api_name = next(
            (a["name"] for a in detected_apis if a["api_id"] == api_id), api_id
        )
        print(f"   {field} → {api_name}")
    if len(field_mappings) > 5:
        print(f"   ... and {len(field_mappings) - 5} more")

    # ====================================================
    # ENHANCE RESULTS WITH INTELLIGENT DETECTION
    # ====================================================
    if results and len(results) > 0:
        results[0]["detected_apis"] = detected_apis
        results[0]["field_to_api_mapping"] = field_mappings
        results[0]["workflow_requirements"] = workflow_requirements
        results[0]["auto_detected"] = True

    summary = generate_summary_report(results)

    response_data = {
        "results": results,
        "summary": summary,
        "intelligent_analysis": {
            "apis_detected": len(detected_apis),
            "detected_apis": detected_apis,
            "field_mappings_auto_generated": field_mappings,
            "workflow_steps": workflow_requirements,
            "automation_level": "FULL_AUTO",
        },
    }

    # Save to history
    save_pipeline_history(file.filename, response_data)

    print(f"\n✅ Processing Complete - {len(detected_apis)} APIs auto-detected\n")

    return response_data


# ============================================================
# INTELLIGENT API DETECTION ENDPOINTS
# ============================================================


@router.get("/api-details/")
def get_all_api_details():
    """Get detailed information about ALL available APIs"""
    return {
        "total_available_apis": len(analyzer.EXTENDED_API_REGISTRY),
        "apis": [
            {
                "api_id": api_id,
                "name": info["name"],
                "category": info["category"],
                "fields": info["fields"],
                "keywords": info["requirement_keywords"],
                "priority": info["priority"],
            }
            for api_id, info in analyzer.EXTENDED_API_REGISTRY.items()
        ],
    }


@router.get("/api-details/{api_id}")
def get_api_details(api_id: str):
    """Get details for a specific API"""
    if api_id in analyzer.EXTENDED_API_REGISTRY:
        info = analyzer.EXTENDED_API_REGISTRY[api_id]
        return {
            "api_id": api_id,
            "name": info["name"],
            "category": info["category"],
            "description": "Advanced integration for financial workflows",
            "fields": info["fields"],
            "keywords": info["requirement_keywords"],
            "priority": info["priority"],
            "status": "active",
            "endpoints_available": len(info["fields"]) * 3,
        }
    return {"error": f"API {api_id} not found"}


# ============================================================
# PIPELINE HISTORY ENDPOINTS
# ============================================================


@router.get("/history/{pipeline_name}")
def get_history(pipeline_name: str):
    """Get history for a specific pipeline"""
    return get_pipeline_history(pipeline_name)


@router.get("/history/")
def list_all_history():
    """List all pipeline histories"""
    histories = []
    try:
        for history_file in history_directory().glob("*_history.json"):
            with open(history_file, "r") as f:
                histories.append(json.load(f))
    except Exception as e:
        return {"error": str(e), "histories": []}

    return {"total": len(histories), "histories": histories}


# ============================================================
# ADDITIONAL API ENDPOINTS (11+ APIs)
# ============================================================


@router.get("/supported-apis/")
def get_supported_apis():
    """Get list of supported API integrations"""
    return {
        "supported_apis": [
            {"name": "Stripe", "category": "Payment", "status": "active"},
            {"name": "Salesforce", "category": "CRM", "status": "active"},
            {"name": "Plaid", "category": "Banking", "status": "active"},
            {"name": "QuickBooks", "category": "Accounting", "status": "active"},
            {"name": "HubSpot", "category": "CRM", "status": "active"},
            {"name": "Twilio", "category": "Communication", "status": "active"},
            {"name": "Shopify", "category": "E-commerce", "status": "active"},
            {"name": "Slack", "category": "Communication", "status": "active"},
            {"name": "Google Sheets", "category": "Productivity", "status": "active"},
            {"name": "Notion", "category": "Productivity", "status": "active"},
            {"name": "Zapier", "category": "Automation", "status": "active"},
        ]
    }


@router.get("/pipelines/")
def list_pipelines():
    """List all created pipelines"""
    pipelines = []
    try:
        for history_file in history_directory().glob("*_history.json"):
            with open(history_file, "r") as f:
                data = json.load(f)
                pipelines.append(
                    {
                        "id": history_file.stem,
                        "name": data.get("pipeline_name"),
                        "runs": len(data.get("runs", [])),
                        "status": "active" if data.get("runs") else "pending",
                    }
                )
    except Exception as e:
        return {"error": str(e), "pipelines": []}

    return {"total": len(pipelines), "pipelines": pipelines}


@router.post("/validate/")
async def validate_api_spec(file: UploadFile = File(...)):
    """Validate API specification file"""
    text = await read_document(file)

    try:
        # Try to parse as JSON/YAML
        parsed = json.loads(text)
        return {
            "valid": True,
            "message": "API specification is valid",
            "fields_found": len(parsed) if isinstance(parsed, dict) else 0,
        }
    except:
        return {
            "valid": False,
            "message": "Invalid JSON format",
            "suggestion": "Please upload valid API documentation",
        }


@router.post("/simulate/", deprecated=True, tags=["legacy-simulation"])
async def simulate_api_call(file: UploadFile = File(...)):
    """Simulate API call with extracted data"""
    text = await read_document(file)

    return {
        "simulation_status": "success",
        "method": "POST",
        "endpoint": "/api/transfer",
        "status_code": 200,
        "response_time_ms": 245,
        "fields_mapped": 8,
        "message": "Simulation completed successfully",
    }


@router.get("/status/")
def get_system_status():
    """Get overall system status"""
    return {
        "service": "FinSpark",
        "status": "healthy",
        "version": "1.0.0",
        "uptime": "running",
        "pipelines_total": 0,
        "last_processed": "Never",
        "ai_model": "Llama 3.1 8B",
    }


@router.post("/mapping/", deprecated=True, tags=["legacy-simulation"])
async def create_custom_mapping(file: UploadFile = File(...)):
    """Create custom field mapping for pipeline"""
    text = await read_document(file)

    return {
        "mapping_id": f"map_{datetime.now().timestamp()}",
        "status": "created",
        "fields_mapped": 12,
        "confidence_score": 0.94,
        "ready_for_deployment": True,
    }


@router.post("/webhook/", deprecated=True, tags=["legacy-simulation"])
async def webhook_receiver(data: dict):
    """Receive webhook payloads from external APIs"""
    return {
        "webhook_id": f"wh_{datetime.now().timestamp()}",
        "status": "received",
        "processed": True,
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/pipeline/{pipeline_id}/details")
def get_pipeline_details(pipeline_id: str):
    """Get detailed information about a specific pipeline"""
    try:
        history = get_pipeline_history(pipeline_id)
        if history.get("runs"):
            latest_run = history["runs"][-1]
            return {
                "pipeline_id": pipeline_id,
                "name": history.get("pipeline_name"),
                "status": "active",
                "total_runs": len(history.get("runs", [])),
                "last_run": latest_run.get("timestamp"),
                "quality_score": latest_run.get("data", {})
                .get("results", [{}])[0]
                .get("result", {})
                .get("pipeline_summary", {})
                .get("overall_quality_score", 0),
            }
    except Exception as e:
        return {"error": str(e)}

    return {"error": "Pipeline not found"}


@router.post("/pipeline/{pipeline_id}/run", deprecated=True, tags=["legacy-simulation"])
def trigger_pipeline_run(pipeline_id: str):
    """Trigger manual pipeline run"""
    return {
        "pipeline_id": pipeline_id,
        "run_id": f"run_{datetime.now().timestamp()}",
        "status": "started",
        "message": "Pipeline execution started",
    }


@router.delete("/pipeline/{pipeline_id}")
def delete_pipeline(pipeline_id: str):
    """Delete a pipeline and its history"""
    try:
        history_file = history_path(pipeline_id)
        if history_file.exists():
            history_file.unlink()
            return {"status": "success", "message": "Pipeline deleted"}
    except Exception as e:
        return {"error": str(e)}

    return {"error": "Pipeline not found"}


# ============================================================
# PROCESS DOCUMENTATION & VISUALIZATION
# ============================================================


@router.post("/generate-process-doc/")
async def generate_process_document(file: UploadFile = File(...)):
    """Generate complete process documentation showing what was connected where"""

    text = await read_document(file)

    # Run full pipeline to get all data
    documents = [
        {
            "name": file.filename,
            "content": text,
            "file_type": file.filename.split(".")[-1],
        }
    ]

    results = run_full_pipeline(documents)

    # Get parsed data
    if results and len(results) > 0:
        parsed_sections = (
            results[0]
            .get("result", {})
            .get("step_1_document_parsing", {})
            .get("sections", [])
        )
        extracted_fields = (
            results[0]
            .get("result", {})
            .get("step_2_field_extraction", {})
            .get("extracted_fields", [])
        )
    else:
        parsed_sections = []
        extracted_fields = []

    # Analyze with AI
    analysis = analyzer.analyze_parsed_fields(extracted_fields, parsed_sections)
    detected_apis = analysis.get("detected_apis", [])
    field_mappings = analysis.get("field_to_api_mapping", {})
    workflow_steps = analysis.get("workflow_requirements", [])

    # Build comprehensive process document
    process_doc = {
        "document_name": file.filename,
        "timestamp": datetime.now().isoformat(),
        "process_steps": [
            {
                "step": 1,
                "name": "Document Parsing",
                "description": f"Extracted {len(parsed_sections)} sections from document",
                "status": "✅ Complete",
                "details": {
                    "sections_found": len(parsed_sections),
                    "section_preview": parsed_sections[:3] if parsed_sections else [],
                },
            },
            {
                "step": 2,
                "name": "Field Extraction",
                "description": f"Identified {len(extracted_fields)} fields from document",
                "status": "✅ Complete",
                "details": {
                    "fields_extracted": len(extracted_fields),
                    "fields": [f["field_name"] for f in extracted_fields],
                    "confidence_scores": [f["confidence"] for f in extracted_fields],
                },
            },
            {
                "step": 3,
                "name": "API Detection",
                "description": f"Auto-detected {len(detected_apis)} required APIs",
                "status": "✅ Complete",
                "details": {
                    "apis_detected": [
                        {
                            "name": api["name"],
                            "id": api["api_id"],
                            "confidence": f"{(api['confidence'] * 100):.0f}%",
                            "category": api["category"],
                            "matched_keywords": api.get("matched_keywords", []),
                        }
                        for api in detected_apis
                    ]
                },
            },
            {
                "step": 4,
                "name": "Field-to-API Mapping",
                "description": f"Mapped {len(field_mappings)} fields to their respective APIs",
                "status": "✅ Complete",
                "details": {
                    "mappings": [
                        {
                            "field": field,
                            "api_id": api_id,
                            "api_name": next(
                                (
                                    a["name"]
                                    for a in detected_apis
                                    if a["api_id"] == api_id
                                ),
                                api_id,
                            ),
                        }
                        for field, api_id in field_mappings.items()
                    ]
                },
            },
            {
                "step": 5,
                "name": "Workflow Requirements",
                "description": f"Identified {len(workflow_steps)} workflow steps",
                "status": "✅ Complete",
                "details": {"steps": workflow_steps},
            },
        ],
        "summary": {
            "total_apis": len(detected_apis),
            "total_fields": len(extracted_fields),
            "total_workflow_steps": len(workflow_steps),
            "automation_score": min(
                100, (len(detected_apis) * 20 + len(field_mappings) * 5)
            ),
        },
        "ready_for_execution": True,
        "execution_endpoint": "/execute-pipeline/",
    }

    return process_doc


# ============================================================
# MOCK EXECUTION: KYC + VIRTUAL MONEY DISBURSEMENT
# ============================================================


@router.post("/execute-pipeline/", tags=["simulation"])
async def execute_pipeline_mock(pipeline_data: dict):
    """
    Execute mock pipeline with many-to-many field mappings:
    - Step 1: KYC Verification (mock)
    - Step 2: Virtual Money Disbursement (mock for loans)
    - Returns detailed execution log with all field→API processing
    """

    detected_apis = pipeline_data.get("detected_apis", [])
    field_mappings = pipeline_data.get(
        "field_mappings_auto_generated", {}
    )  # Now: {field: [apis]}
    workflow_steps = pipeline_data.get("workflow_steps", [])

    # Check if this is a loan pipeline
    is_loan_pipeline = any(
        "loan" in step.lower() or "loan" in api.get("name", "").lower()
        for step in workflow_steps
        for api in detected_apis
    )

    execution_log = []
    execution_status = "SUCCESS"
    virtual_amount = None
    fields_processed = 0

    # Step 0: Process Fields Through Multiple APIs (many-to-many)
    field_processing = {
        "timestamp": datetime.now().isoformat(),
        "step": "Field Processing Through Multiple APIs",
        "api": "MULTI-API",
        "status": "✅ COMPLETE",
        "details": {"fields_processed": 0, "field_details": []},
    }

    for field_name, api_list in field_mappings.items():
        # api_list is now a list of API IDs (many-to-many)
        if not isinstance(api_list, list):
            api_list = [api_list]  # Handle if still single

        field_detail = {
            "field": field_name,
            "mapped_to_apis": [],
            "processing_status": "PROCESSED",
        }

        for api_id in api_list:
            api_name = next(
                (a["name"] for a in detected_apis if a["api_id"] == api_id), api_id
            )
            field_detail["mapped_to_apis"].append(
                {
                    "api_id": api_id,
                    "api_name": api_name,
                    "status": "✅ SENT",
                    "timestamp": datetime.now().isoformat(),
                }
            )
            fields_processed += 1

        field_processing["details"]["field_details"].append(field_detail)

    field_processing["details"]["fields_processed"] = fields_processed
    execution_log.append(field_processing)

    # Step 1: KYC Verification
    kyc_api = next((a for a in detected_apis if a["api_id"] == "kyc-pro"), None)
    if kyc_api:
        kyc_result = {
            "timestamp": datetime.now().isoformat(),
            "step": "Customer KYC Verification",
            "api": "kyc-pro",
            "status": "✅ VERIFIED",
            "details": {
                "verification_type": "AADHAAR_PAN_VERIFICATION",
                "customer_id": f"CUST_{datetime.now().timestamp()}",
                "pan_status": "✅ Valid",
                "aadhar_status": "✅ Valid",
                "kyc_score": "95%",
                "message": "Customer verified successfully",
            },
        }
        execution_log.append(kyc_result)

    # Step 2: Virtual Money Disbursement (only for loans)
    if is_loan_pipeline:
        bank_api = next(
            (a for a in detected_apis if a["api_id"] == "bank-disbursal"), None
        )

        # Generate mock loan amount
        virtual_amount = 50000  # Mock: ₹50,000 virtual loan

        disbursement_result = {
            "timestamp": datetime.now().isoformat(),
            "step": "Virtual Money Disbursement",
            "api": "bank-disbursal",
            "status": "✅ DISBURSED",
            "details": {
                "transaction_type": "LOAN_DISBURSEMENT",
                "amount_inr": virtual_amount,
                "currency": "INR",
                "transaction_id": f"TXN_{datetime.now().timestamp()}_VIRTUAL",
                "bank_account": "XX1234",
                "upi_id": "customer@upi",
                "status_code": 200,
                "message": f"✅ Virtual ₹{virtual_amount:,} credited to customer account (MOCK)",
                "timestamp_completed": datetime.now().isoformat(),
            },
        }
        execution_log.append(disbursement_result)

    # Step 3: Notifications (if Twilio API detected)
    twilio_api = next((a for a in detected_apis if a["api_id"] == "twilio"), None)
    if twilio_api:
        notification_result = {
            "timestamp": datetime.now().isoformat(),
            "step": "Customer Notification",
            "api": "twilio",
            "status": "✅ SENT",
            "details": {
                "notification_type": "SMS",
                "recipient": "+91-XXXXXX9999",
                "message": f"Your KYC is verified and ₹{virtual_amount:,} has been credited (MOCK)."
                if is_loan_pipeline
                else "Your profile has been processed.",
                "message_id": f"MSG_{datetime.now().timestamp()}",
                "delivery_status": "DELIVERED",
            },
        }
        execution_log.append(notification_result)

    # Step 4: CRM Update (if Salesforce API detected)
    salesforce_api = next(
        (a for a in detected_apis if a["api_id"] == "salesforce"), None
    )
    if salesforce_api:
        crm_result = {
            "timestamp": datetime.now().isoformat(),
            "step": "CRM Record Update",
            "api": "salesforce",
            "status": "✅ UPDATED",
            "details": {
                "record_type": "Lead",
                "action": "UPDATE_STATUS",
                "status_change": "VERIFIED → ACTIVE",
                "record_id": f"LEAD_{datetime.now().timestamp()}",
                "message": "Customer record updated in CRM",
            },
        }
        execution_log.append(crm_result)

    # Build execution summary
    execution_result = {
        "execution_id": f"EXEC_{datetime.now().timestamp()}",
        "pipeline_type": "LOAN" if is_loan_pipeline else "GENERAL",
        "status": execution_status,
        "timestamp": datetime.now().isoformat(),
        "execution_log": execution_log,
        "summary": {
            "total_steps": len(execution_log),
            "successful_steps": len([s for s in execution_log if "✅" in s["status"]]),
            "failed_steps": len([s for s in execution_log if "❌" in s["status"]]),
            "fields_processed": fields_processed,
            "virtual_amount_disbursed": virtual_amount if is_loan_pipeline else None,
            "customer_verified": any(s["api"] == "kyc-pro" for s in execution_log),
            "time_taken_seconds": 2.34,
        },
        "message": f"✅ Pipeline executed successfully! {fields_processed} fields processed through {len(detected_apis)} APIs. Virtual loan of ₹{virtual_amount:,} disbursed (MOCK)"
        if is_loan_pipeline
        else f"✅ Pipeline executed successfully! {fields_processed} fields processed through {len(detected_apis)} APIs.",
    }

    return execution_result


# ============================================================
# HEALTH CHECK
# ============================================================


@router.get("/health/legacy", deprecated=True)
def health():
    return {"status": "healthy", "service": "FinSpark"}


# ============================================================
# AI ASSISTANT ENDPOINT (USING LLAMA MODEL)
# ============================================================


@router.post("/ai-assistant/")
async def ai_assistant_chat(request_data: dict):
    """
    AI Assistant endpoint using Llama model for:
    - Navigation help
    - General Q&A
    - Context-aware suggestions
    - Multilingual support
    """

    message = request_data.get("message", "")
    language = request_data.get("language", "en")
    context = request_data.get("context", "home")  # Current page context
    chat_history = request_data.get("chat_history", [])

    if not message.strip():
        return {"response": "Please ask me something!", "should_speak": False}

    # System prompts in multiple languages
    system_prompts = {
        "en": "You are a helpful AI assistant for FinSpark, a financial API integration platform. Help users navigate the platform, explain features, and answer questions about API integration, financial workflows, and data mapping.",
        "es": "Eres un asistente de IA útil para FinSpark, una plataforma de integración de API financieras. Ayuda a los usuarios a navegar por la plataforma.",
        "fr": "Vous êtes un assistant IA utile pour FinSpark, une plateforme d'intégration d'API financière. Aidez les utilisateurs à naviguer sur la plateforme.",
        "de": "Sie sind ein hilfreicher KI-Assistent für FinSpark, eine Finanz-API-Integrations-Plattform. Helfen Sie Benutzern, die Plattform zu navigieren.",
        "hi": "आप FinSpark के लिए एक सहायक AI सहायक हैं, एक वित्तीय API एकीकरण प्लेटफॉर्म। उपयोगकर्ताओं को प्लेटफॉर्म को नेविगेट करने में मदद करें।",
        "ja": "あなたはFinSpark（金融API統合プラットフォーム）の有用なAIアシスタントです。ユーザーがプラットフォームをナビゲートするのをお手伝いします。",
        "zh": "您是FinSpark（财务API集成平台）的有用AI助手。帮助用户浏览该平台。",
        "pt": "Você é um assistente de IA útil para o FinSpark, uma plataforma de integração de API financeira. Ajude os usuários a navegar pela plataforma.",
    }

    navigation_contexts = {
        "home": "User is on the home page. Suggest exploring pipelines or uploading documents.",
        "upload": "User is in the upload section. Help them understand document requirements.",
        "dashboard": "User is viewing the pipeline dashboard. Help with pipeline management and execution.",
        "mapping": "User is in the field mapping section. Explain API field matching and configuration.",
        "simulate": "User is simulating a pipeline. Explain the execution flow and expected outcomes.",
    }

    selected_system_prompt = system_prompts.get(language, system_prompts["en"])
    context_hint = navigation_contexts.get(context, "")

    # Build a simplified response using mock LLM behavior
    # In production, this would call your Llama model API endpoint
    response = generate_ai_response(
        message=message,
        language=language,
        context=context,
        system_prompt=selected_system_prompt,
        context_hint=context_hint,
        chat_history=chat_history,
    )

    return {
        "response": response,
        "language": language,
        "should_speak": True
        if len(response) < 200
        else False,  # Speak for shorter responses
        "timestamp": datetime.now().isoformat(),
    }


def generate_ai_response(
    message: str,
    language: str,
    context: str,
    system_prompt: str,
    context_hint: str,
    chat_history: list,
) -> str:
    """
    Generate AI response using smart LLM logic with general query handling
    Production: Replace with actual Llama model API call
    """

    message_lower = message.lower()

    # Multi-language system prompts
    language_prompts = {
        "en": "You are FinSpark's intelligent AI assistant. You help with platform navigation, API integration, financial workflows, and answer user questions comprehensively.",
        "es": "Eres el asistente de IA inteligente de FinSpark.",
        "fr": "Vous êtes l'assistant IA intelligent de FinSpark.",
        "de": "Sie sind der intelligente KI-Assistent von FinSpark.",
        "hi": "आप FinSpark के बुद्धिमान AI सहायक हैं। आप प्लेटफॉर्म नेविगेशन, API एकीकरण, वित्तीय वर्कफ़्लो में मदद करते हैं।",
        "ta": "நீங்கள் FinSpark இன் அறிவுள்ள AI உதவியாளர். நீங்கள் தளம் சஞ்சரணை, API ஒருங்கிணைப்பு, நிதி பணிப்பாய்வுகளில் உதவி செய்கிறீர்கள்.",
        "te": "మీరు FinSpark యొక్క తెలివైన AI సహాయకుడు. మీరు ప్ల్యాట్‌ఫారమ్ నావిగేషన్, API ఇంటిగ్రేషన్, ఆర్థిక వర్క్‌ఫ్లోలో సహాయం చేస్తారు.",
        "kn": "ನೀವು FinSpark ನ ಬುದ್ಧಿಶೀಲ AI ಸಹಾಯಕ. ನೀವು ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ನ್ಯಾವಿಗೇಷನ್, API ಇಂಟಿಗ್ರೇಷನ್, ಆರ್ಥಿಕ ವರ್ಕ್‌ಫ್ಲೋಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡುತ್ತೀರಿ.",
        "bn": "আপনি FinSpark এর বুদ্ধিমান AI সহায়ক। আপনি প্ল্যাটফর্ম নেভিগেশন, API ইন্টিগ্রেশন, আর্থিক ওয়ার্কফ্লোতে সহায়তা করেন।",
        "gu": "તમે FinSpark ના બુદ્ધશાળી AI સહાયક છો. તમે પ્લેટફForm નેવિગેશન, API ઇન્ટીગ્રેશન, આર્થિક વર્કફ્લોમાં મદદ કરો છો.",
        "mr": "आप FinSpark चे बुद्धिमान AI सहाय्यक आहात. आप प्लॅटफॉर्म नेव्हिगेशन, API एकीकरण, आर्थिक वर्कफ्लोमध्ये मदत करता.",
        "ja": "あなたはFinSparkのインテリジェントなAIアシスタントです。",
        "zh": "你是FinSpark的智能AI助手。",
        "pt": "Você é o assistente de IA inteligente do FinSpark.",
    }

    # Navigation helpers
    navigation_keys = {
        "upload": [
            "upload",
            "file",
            "document",
            "छाप",
            "फाइल",
            "దస్తాబేరు",
            "ഡോക്യുമെന്റ്",
            "ফাইল",
            "ફાઇલ",
            "फाइल",
            "ファイル",
            "文件",
        ],
        "mapping": [
            "mapping",
            "field",
            "api",
            "मानचित्र",
            "क्षेत्र",
            "నిర్ణయం",
            "മാപ്പിംഗ്",
            "ক্ষেত্র",
            "મેપિંગ",
            "संग्रह",
            "マッピング",
            "映射",
        ],
        "dashboard": [
            "dashboard",
            "pipeline",
            "run",
            "execute",
            "डैशबोर्ड",
            "పైపుల్",
            "ഡ്യാഷ്ബോർഡ്",
            "ড্যাশবোর্ড",
            "ડેશબોર્ડ",
            "पाइपलाइन",
            "ダッシュボード",
            "执行",
        ],
        "kyc": [
            "kyc",
            "verification",
            "verify",
            "customer",
            "केवाईसी",
            "ధృవీకరణ",
            "KYC",
            "যাচাইকরণ",
            "ચકાસણી",
            "ग्राहक",
            "KYC",
            "KYC",
        ],
        "money": [
            "money",
            "amount",
            "disbursement",
            "loan",
            "पैसा",
            "డబ్బు",
            "പണം",
            "টাকা",
            "પૈસો",
            "ऋण",
            "お金",
            "钱",
        ],
    }

    # Topic-based responses in multiple languages
    responses = {
        "upload": {
            "en": "You can upload PDF, DOCX, or TXT files under the Upload section. The system will automatically extract fields and detect which APIs are needed for your workflow. Supported formats: PDF (with text), DOCX, TXT, and RAW text.",
            "hi": "आप अपलोड सेक्शन के तहत PDF, DOCX, या TXT फाइलें अपलोड कर सकते हैं। सिस्टम स्वचालित रूप से फील्ड निकालेगा और आपके वर्कफ़्लो के लिए आवश्यक APIs का पता लगाएगा।",
            "ta": "நீங்கள் அப்லோட் பிரிவின் கீழ் PDF, DOCX, அல்லது TXT ফাইলগুলি அப்லോड할できます। கணினி தானாக क्षेत्रগুলைপের जानकार होगा।",
            "te": "మీరు అప్‌లోడ్ విభాగంలో PDF, DOCX, లేదా TXT ఫైלులను అప్‌లోడ్ చేయవచ్చు। సిస్టమ్ స్వయంచాలకంగా ఫీల్డ్‌లను సంగ్రహిస్తుంది.",
            "bn": "আপনি আপলোড বিভাগে PDF, DOCX বা TXT ফাইলগুলি আপলোড করতে পারেন। সিস্টেম স্বয়ংক্রিয়ভাবে ফিল্ড বের করবে।",
            "kn": "ನೀವು ಅಪ್‌ಲೋಡ್ ವಿಭಾಗದಲ್ಲಿ PDF, DOCX ಅಥವಾ TXT ಫೈಲ್‌ಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು।",
            "gu": "તમે અપલોડ વિભાગ હેઠળ PDF, DOCX, અથવા TXT ફાઈલો અપલોડ કરી શકો છો।",
            "mr": "आप अपलोड सेक्शनमध्ये PDF, DOCX, किंवा TXT फाइლें अपलोड करू शकता.",
        },
        "mapping": {
            "en": "Field mapping connects your document fields to the appropriate APIs. The system intelligently suggests API matches based on field types and content. You can customize mappings before deployment. Each field can connect to multiple APIs for comprehensive coverage.",
            "hi": "फील्ड मैपिंग आपके दस्तावेज़ फील्ड को उपयुक्त APIs से जोड़ता है। सिस्टम फील्ड प्रकार और सामग्री के आधार पर API मेल सुझाता है।",
            "ta": "புல மேப்பிங் உங்கள் ஆவணத் புலங்களை பொருத்தமான API களுடன் இணைக்கிறது।",
            "te": "ఫీల్డ్ మ్యాపింగ్ మీ డాక్యుమెంట్ ఫీల్డ్‌లను తగిన API లకు కనెక్ట్ చేస్తుంది.",
            "bn": "ফিল্ড ম্যাপিং আপনার ডকুমেন্ট ফিল্ডকে উপযুক্ত API গুলির সাথে সংযুক্ত করে।",
        },
        "dashboard": {
            "en": "The dashboard shows all your active pipelines. You can monitor their status, run them manually, view execution history, view detailed metrics, and manage their configurations. Each pipeline displays: status, quality score, last run time, and number of connected APIs.",
            "hi": "डैशबोर्ड आपकी सभी सक्रिय पाइपलाइनों को दिखाता है। आप उनकी स्थिति की निगरानी कर सकते हैं, उन्हें मैन्युअल रूप से चलाएं, निष्पादन इतिहास देखें।",
            "ta": "டேશ்போர்ட் உங்கள் அனைத்து செயலில் உள்ள பைப்லைன்களைக் காட்டுகிறது।",
            "te": "ড్যాషবోర్డ్ మీ అన్ని క్రియాశీల పైపులను చూపుతుంది.",
        },
        "kyc": {
            "en": "KYC (Know Your Customer) verification is automatically performed during pipeline execution. It validates customer identity, eligibility for financial services, and compliance requirements. Our system supports multiple KYC APIs for comprehensive verification.",
            "hi": "KYC (अपने ग्राहक को जानें) सत्यापन पाइपलाइन निष्पादन के दौरान स्वचालित रूप से किया जाता है। यह ग्राहक पहचान को मान्य करता है।",
            "ta": "KYC (உங்கள் வாடிக்கையாளரைத் தெரிந்து கொள்ளுங்கள்) சரிபார்ப்பு பைப்লைன் செயல்படுத்தும் போது தானாக செய்யப்படுகிறது.",
        },
        "money": {
            "en": "The system can simulate virtual money disbursement for loan pipelines. After KYC verification, mock amounts (₹50,000) are credited to demonstrate the complete workflow. This feature helps visualize the end-to-end financial process.",
            "hi": "सिस्टम ऋण पाइपलाइन के लिए आभासी धन वितरण का अनुकरण कर सकता है। KYC सत्यापन के बाद, नकली राशि जमा की जाती है।",
            "ta": "கணினி கடன் பைப்லைன்களுக்கான가상 பணப் பகிர்வை உருப்பகர்த்த முடியும்.",
        },
    }

    # Check for topic matches
    for topic, keywords in navigation_keys.items():
        if any(keyword in message_lower for keyword in keywords):
            lang_key = language if language in responses.get(topic, {}) else "en"
            return responses[topic].get(lang_key, responses[topic]["en"])

    # General query handling with context awareness
    general_responses = {
        "en": f"That's a great question! You asked about '{message}'. Based on the FinSpark platform context, here's what I can help with: If you're working on API integration, I'd recommend uploading your document first, then reviewing the auto-detected API mappings in the dashboard. You can simulate execution to see how your financial workflow will process. Is there a specific part of the platform you'd like to learn more about?",
        "hi": f"यह एक बहुत अच्छा सवाल है! आपने '{message}' के बारे में पूछा। FinSpark प्लेटफॉर्म संदर्भ के आधार पर, यहाँ मैं कैसे मदद कर सकता हूं: यदि आप API इंटीग्रेशन पर काम कर रहे हैं, तो मैं पहले अपना दस्तावेज़ अपलोड करने की सिफारिश करता हूं।",
        "ta": f"இது ஒரு பெரிய கேள்வி! நீங்கள் '{message}' பற்றி கேட்டீர்கள். FinSpark தளம் சூழலின் அடிப்படையில், நான் எவ்வாறு உதவ முடியும்.",
        "te": f"ఇది ఒక గొప్ప ప్రశ్న! మీరు '{message}' గురించి అడిగారు. FinSpark ప్ల్యాట్‌ఫారమ్ సందర్భం ఆధారంగా, నేను ఎలా సహాయం చేయగలను.",
        "bn": f"এটি একটি দুর্দান্ত প্রশ্ন! আপনি '{message}' সম্পর্কে জিজ্ঞাসা করেছেন। FinSpark প্ল্যাটফর্ম প্রসঙ্গের ভিত্তিতে, আমি কীভাবে সহায়তা করতে পারি।",
        "kn": f"ಇದು ಒಂದು ದೊಡ್ಡ ಪ್ರಶ್ನೆ! ನೀವು '{message}' ಬಗ್ಗೆ ಕೇಳಿದ್ದೀರಿ. FinSpark ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಸಂದರ್ಭದ ಆಧಾರದ ಮೇಲೆ, ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು.",
        "gu": f"આ એક શાનદાર પ્રશ્ન છે! તમે '{message}' વિશે પૂછ્યું. FinSpark પ્લેટફર્મ સંદર્ભ के आधार पर, હું કેવી રીતે મદદ કરી શકું.",
        "mr": f"हे एक मस्त प्रश्न आहे! तुम्ही '{message}' बद्दल विचारले. FinSpark प्लॅटफॉर्ммध्ये, मी कसे मदत करू शकतो.",
    }

    lang_key = language if language in general_responses else "en"
    return general_responses[lang_key]
