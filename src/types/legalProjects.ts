/**
 * Legal Projects Module - Data Models
 * 
 * This module defines the TypeScript interfaces and types for the Legal Projects system.
 * It supports three distinct case types:
 * 1. Overstay Appeal - Linear workflow
 * 2. Prohibited Persons (V-list) - Linear with conditional recursive loop
 * 3. High Court/Expedition - Linear with conditional early exit branch
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export enum LegalCaseType {
  OVERSTAY_APPEAL = 'overstay_appeal',
  PROHIBITED_PERSONS = 'prohibited_persons',
    HIGH_COURT_EXPEDITION = 'high_court_expedition',
    APPEALS_8_4 = 'appeals_8_4',
    APPEALS_8_6 = 'appeals_8_6'
}

export enum LegalCaseStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  LOST = 'lost',
  SETTLED = 'settled',
  APPEALING = 'appealing',
  ON_HOLD = 'on_hold'
}

export enum StepStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped'
}

// ============================================================================
// OVERSTAY APPEAL WORKFLOW
// ============================================================================

export enum OverstayAppealStep {
  REACH_OUT = 1,
  PREPARE_APPLICATION = 2,
  SUBMIT_APPLICATION = 3,
  FOLLOW_UPS = 4,
  OUTCOME = 5
}

export const OVERSTAY_APPEAL_STEPS: Record<OverstayAppealStep, string> = {
  [OverstayAppealStep.REACH_OUT]: 'Reach Out to Client',
  [OverstayAppealStep.PREPARE_APPLICATION]: 'Prepare Application (Drafting)',
  [OverstayAppealStep.SUBMIT_APPLICATION]: 'Submit Application',
  [OverstayAppealStep.FOLLOW_UPS]: 'Follow ups with DHA',
  [OverstayAppealStep.OUTCOME]: 'Outcome'
};

// ============================================================================
// PROHIBITED PERSONS (V-LIST) WORKFLOW
// ============================================================================

export enum ProhibitedPersonsStep {
  REACH_OUT = 1,
  PREPARE_APPLICATION = 2,
  SUBMISSION = 3,
  FOLLOW_UPS = 4,
  OUTCOME = 5
}

export const PROHIBITED_PERSONS_STEPS: Record<ProhibitedPersonsStep, string> = {
  [ProhibitedPersonsStep.REACH_OUT]: 'Reach Out to Client',
  [ProhibitedPersonsStep.PREPARE_APPLICATION]: 'Prepare Application (Drafting)',
  [ProhibitedPersonsStep.SUBMISSION]: 'Submission',
  [ProhibitedPersonsStep.FOLLOW_UPS]: 'Follow ups with DHA',
  [ProhibitedPersonsStep.OUTCOME]: 'Outcome'
};

export enum ProhibitedPersonsOutcome {
  SUCCESS = 'success',
  LOST = 'lost'
}

// ============================================================================
// HIGH COURT/EXPEDITION WORKFLOW
// ============================================================================

export enum HighCourtStep {
  LETTER_OF_DEMAND = 1,
  FOUNDING_AFFIDAVIT = 2,
  COMMISSIONER_OF_OATHS = 3,
  ISSUING_AT_HIGH_COURT = 4,
  SHERIFF = 5,
  RETURN_OF_SERVICE = 6,
  SETTLEMENT_AGREEMENT = 7,
  HIGH_COURT = 8,
  COMPLETE = 9
}

export const HIGH_COURT_STEPS: Record<HighCourtStep, string> = {
  [HighCourtStep.LETTER_OF_DEMAND]: 'Letter of Demand',
  [HighCourtStep.FOUNDING_AFFIDAVIT]: 'Founding Affidavit (Drafting)',
  [HighCourtStep.COMMISSIONER_OF_OATHS]: 'Commissioner of Oaths',
  [HighCourtStep.ISSUING_AT_HIGH_COURT]: 'Issuing at the High Court',
  [HighCourtStep.SHERIFF]: 'Sheriff',
  [HighCourtStep.RETURN_OF_SERVICE]: 'Return of Service',
  [HighCourtStep.SETTLEMENT_AGREEMENT]: 'Settlement / Agreement',
  [HighCourtStep.HIGH_COURT]: 'High Court',
  [HighCourtStep.COMPLETE]: 'Complete'
};

export enum SettlementOutcome {
  SETTLED = 'settled',
  NOT_SETTLED = 'not_settled'
}

  // ============================================================================
  // APPEALS 8(4) & 8(6) WORKFLOW
  // ============================================================================

  export enum AppealsStep {
    REACH_OUT = 1,
    PREPARE_APPEAL_DRAFT = 2,
    APPOINTMENT_BOOKED = 3,
    SUBMIT_AT_VFS = 4,
    TRACK_APPLICATION = 5,
    OUTCOME = 6
  }

  export const APPEALS_8_4_STEPS: Record<AppealsStep, string> = {
    [AppealsStep.REACH_OUT]: 'Reach Out to Clients',
    [AppealsStep.PREPARE_APPEAL_DRAFT]: 'Prepare Appeal Draft',
    [AppealsStep.APPOINTMENT_BOOKED]: 'Appointment Booked',
    [AppealsStep.SUBMIT_AT_VFS]: 'Submit Application at VFS Center',
    [AppealsStep.TRACK_APPLICATION]: 'Track the Application',
    [AppealsStep.OUTCOME]: 'Outcome'
  };

  export const APPEALS_8_6_STEPS: Record<AppealsStep, string> = {
    [AppealsStep.REACH_OUT]: 'Reach Out to Clients',
    [AppealsStep.PREPARE_APPEAL_DRAFT]: 'Prepare Appeal Draft',
    [AppealsStep.APPOINTMENT_BOOKED]: 'Appointment Booked',
    [AppealsStep.SUBMIT_AT_VFS]: 'Submit Application at VFS Center',
    [AppealsStep.TRACK_APPLICATION]: 'Track the Application',
    [AppealsStep.OUTCOME]: 'Outcome'
  };

// ============================================================================
// STEP HISTORY & TRACKING
// ============================================================================

export interface StepHistoryEntry {
  step_id: number;
  step_name: string;
  status: StepStatus;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  performed_by: number | null;
  performer_name?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowConstraint {
  constraint_type: 'time_period' | 'required_action' | 'conditional';
  description: string;
  value: any;
  is_satisfied: boolean;
  due_date?: string;
}

// ============================================================================
// APPEAL/SUB-CASE TRACKING (For Prohibited Persons recursive loop)
// ============================================================================

export interface AppealRecord {
  appeal_id: number;
  parent_case_id: number;
  appeal_number: number; // 1st appeal, 2nd appeal, etc.
  started_at: string;
  closed_at: string | null;
  outcome: ProhibitedPersonsOutcome | null;
  notes: string | null;
}

// ============================================================================
// MAIN LEGAL CASE INTERFACE
// ============================================================================

export interface LegalCase {
  case_id: number;
  case_reference: string; // Unique reference number
  case_type: LegalCaseType;
  case_title: string;
  case_status: LegalCaseStatus;
  
  // Client Information
  client_id: number | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  
  // Assignment
  assigned_case_manager_id: number | null;
  assigned_case_manager_name?: string;
  assigned_paralegal_id: number | null;
  assigned_paralegal_name?: string;
  
  // Workflow State
  current_step: number;
  current_step_name?: string;
  step_history: StepHistoryEntry[];
  
  // Specific workflow data based on case_type
  workflow_data: OverstayAppealData | ProhibitedPersonsData | HighCourtData | Appeals84Data | Appeals86Data;
  
  // Appeal tracking (for Prohibited Persons)
  appeal_count: number;
  appeals: AppealRecord[];
  parent_case_id: number | null; // If this is an appeal sub-case
  
  // Time tracking
  created_at: string;
  updated_at: string;
  started_at: string | null;
  closed_at: string | null;
  
  // Constraints and deadlines
  constraints: WorkflowConstraint[];
  next_deadline: string | null;
  
  // Additional metadata
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes: string | null;
  tags: string[];
}

// ============================================================================
// WORKFLOW-SPECIFIC DATA INTERFACES
// ============================================================================

export interface OverstayAppealData {
  type: LegalCaseType.OVERSTAY_APPEAL;
  email_submission_sent: boolean;
  email_submission_date: string | null;
  email_recipient: string | null;
  dha_reference_number: string | null;
  outcome_result: 'approved' | 'rejected' | 'pending' | null;
}

export interface ProhibitedPersonsData {
  type: LegalCaseType.PROHIBITED_PERSONS;
  vlist_reference: string | null;
  dha_reference_number: string | null;
  outcome_result: ProhibitedPersonsOutcome | null;
  is_appeal: boolean;
  appeal_count: number;
}

export interface HighCourtData {
  type: LegalCaseType.HIGH_COURT_EXPEDITION;
  // Letter of Demand tracking
  letter_of_demand_date: string | null;
  notification_period_start: string | null;
  notification_period_end: string | null; // 14 days from start
  notification_period_satisfied: boolean;
  
  // High Court specific
  court_case_number: string | null;
  court_filing_date: string | null;
  sheriff_service_date: string | null;
  
  // Settlement tracking
  settlement_outcome: SettlementOutcome | null;
  settlement_date: string | null;
  settlement_amount: number | null;
  settlement_terms: string | null;
  
  // Final outcome
  final_judgment_date: string | null;
  judgment_outcome: string | null;
}

export interface Appeals84Data {
  type: LegalCaseType.APPEALS_8_4;
  appointment_booked_date: string | null;
  vfs_center: string | null;
  tracking_reference: string | null;
  outcome_result: 'approved' | 'rejected' | 'pending' | null;
}

export interface Appeals86Data {
  type: LegalCaseType.APPEALS_8_6;
  appointment_booked_date: string | null;
  vfs_center: string | null;
  tracking_reference: string | null;
  outcome_result: 'approved' | 'rejected' | 'pending' | null;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateLegalCaseRequest {
  case_type: LegalCaseType;
  case_title: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_id?: number;
  assigned_case_manager_id?: number;
  assigned_paralegal_id?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  tags?: string[];
}

export interface UpdateLegalCaseRequest {
  case_title?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  assigned_case_manager_id?: number;
  assigned_paralegal_id?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  tags?: string[];
}

export interface AdvanceStepRequest {
  case_id: number;
  notes?: string;
  performed_by: number;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface SetOutcomeRequest {
  case_id: number;
  outcome: string; // varies by case type
  notes?: string;
  performed_by: number;
}

export interface SettlementRequest {
  case_id: number;
  settlement_outcome: SettlementOutcome;
  settlement_amount?: number;
  settlement_terms?: string;
  performed_by: number;
  notes?: string;
}

export interface TriggerAppealRequest {
  case_id: number;
  notes?: string;
  performed_by: number;
}

// ============================================================================
// WORKFLOW TRANSITION RESULT
// ============================================================================

export interface WorkflowTransitionResult {
  success: boolean;
  case: LegalCase;
  previous_step: number;
  current_step: number;
  message: string;
  next_actions?: string[];
  warnings?: string[];
  requires_action?: {
    action_type: string;
    description: string;
    due_date?: string;
  };
}

// ============================================================================
// DASHBOARD & REPORTING TYPES
// ============================================================================

export interface LegalCaseStats {
  total_cases: number;
  by_type: Record<LegalCaseType, number>;
  by_status: Record<LegalCaseStatus, number>;
  by_priority: Record<string, number>;
  upcoming_deadlines: LegalCase[];
  overdue_cases: LegalCase[];
  cases_per_case_manager: Record<number, number>;
}

export interface CaseFilter {
  case_type?: LegalCaseType[];
  case_status?: LegalCaseStatus[];
  assigned_case_manager_id?: number;
  assigned_paralegal_id?: number;
  priority?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
  has_deadline_before?: string;
  is_overdue?: boolean;
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isOverstayAppealData(data: any): data is OverstayAppealData {
  return data?.type === LegalCaseType.OVERSTAY_APPEAL;
}

export function isProhibitedPersonsData(data: any): data is ProhibitedPersonsData {
  return data?.type === LegalCaseType.PROHIBITED_PERSONS;
}

export function isHighCourtData(data: any): data is HighCourtData {
  return data?.type === LegalCaseType.HIGH_COURT_EXPEDITION;
}

// ============================================================================
// DEFAULT/INITIAL DATA FACTORIES
// ============================================================================

export function createDefaultOverstayAppealData(): OverstayAppealData {
  return {
    type: LegalCaseType.OVERSTAY_APPEAL,
    email_submission_sent: false,
    email_submission_date: null,
    email_recipient: null,
    dha_reference_number: null,
    outcome_result: null
  };
}

export function createDefaultProhibitedPersonsData(): ProhibitedPersonsData {
  return {
    type: LegalCaseType.PROHIBITED_PERSONS,
    vlist_reference: null,
    dha_reference_number: null,
    outcome_result: null,
    is_appeal: false,
    appeal_count: 0
  };
}

export function createDefaultHighCourtData(): HighCourtData {
  return {
    type: LegalCaseType.HIGH_COURT_EXPEDITION,
    letter_of_demand_date: null,
    notification_period_start: null,
    notification_period_end: null,
    notification_period_satisfied: false,
    court_case_number: null,
    court_filing_date: null,
    sheriff_service_date: null,
    settlement_outcome: null,
    settlement_date: null,
    settlement_amount: null,
    settlement_terms: null,
    final_judgment_date: null,
    judgment_outcome: null
  };
}

export function createDefaultAppeals84Data(): Appeals84Data {
  return {
    type: LegalCaseType.APPEALS_8_4,
    appointment_booked_date: null,
    vfs_center: null,
    tracking_reference: null,
    outcome_result: null
  };
}

export function createDefaultAppeals86Data(): Appeals86Data {
  return {
    type: LegalCaseType.APPEALS_8_6,
    appointment_booked_date: null,
    vfs_center: null,
    tracking_reference: null,
    outcome_result: null
  };
}

export function createInitialStepHistory(caseType: LegalCaseType): StepHistoryEntry[] {
  let steps: Record<number, string>;
  
  switch (caseType) {
    case LegalCaseType.OVERSTAY_APPEAL:
      steps = OVERSTAY_APPEAL_STEPS;
      break;
    case LegalCaseType.PROHIBITED_PERSONS:
      steps = PROHIBITED_PERSONS_STEPS;
      break;
    case LegalCaseType.HIGH_COURT_EXPEDITION:
      steps = HIGH_COURT_STEPS;
      break;
    case LegalCaseType.APPEALS_8_4:
      steps = APPEALS_8_4_STEPS;
      break;
    case LegalCaseType.APPEALS_8_6:
      steps = APPEALS_8_6_STEPS;
      break;
    default:
      steps = {};
  }
  
  return Object.entries(steps).map(([stepId, stepName]) => ({
    step_id: parseInt(stepId),
    step_name: stepName,
    status: parseInt(stepId) === 1 ? StepStatus.IN_PROGRESS : StepStatus.NOT_STARTED,
    started_at: parseInt(stepId) === 1 ? new Date().toISOString() : null,
    completed_at: null,
    notes: null,
    performed_by: null
  }));
}
