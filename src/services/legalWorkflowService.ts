/**
 * Legal Projects Workflow Service
 * 
 * This service handles all state transitions and business logic for legal case workflows.
 * It supports three distinct case types with their specific rules:
 * 
 * 1. Overstay Appeal - Linear workflow with email submission action
 * 2. Prohibited Persons (V-list) - Linear with recursive appeal loop on loss
 * 3. High Court/Expedition - Linear with 14-day constraint and early exit on settlement
 */

import {
  LegalCase,
  LegalCaseType,
  LegalCaseStatus,
  StepStatus,
  StepHistoryEntry,
  WorkflowTransitionResult,
  WorkflowConstraint,
  AppealRecord,
  OverstayAppealStep,
  ProhibitedPersonsStep,
  HighCourtStep,
  ProhibitedPersonsOutcome,
  SettlementOutcome,
  AppealsStep,
  OverstayAppealData,
  ProhibitedPersonsData,
  HighCourtData,
  Appeals84Data,
  Appeals86Data,
  OVERSTAY_APPEAL_STEPS,
  PROHIBITED_PERSONS_STEPS,
  HIGH_COURT_STEPS,
  APPEALS_8_4_STEPS,
  APPEALS_8_6_STEPS,
  createDefaultOverstayAppealData,
  createDefaultProhibitedPersonsData,
  createDefaultHighCourtData,
  createDefaultAppeals84Data,
  createDefaultAppeals86Data,
  createInitialStepHistory,
  isOverstayAppealData,
  isProhibitedPersonsData,
  isHighCourtData,
  AdvanceStepRequest,
  SetOutcomeRequest,
  SettlementRequest,
  TriggerAppealRequest
} from '../types/legalProjects';

// ============================================================================
// WORKFLOW SERVICE CLASS
// ============================================================================

export class LegalWorkflowService {
  
  // ============================================================================
  // STEP RETRIEVAL HELPERS
  // ============================================================================
  
  /**
   * Get the total number of steps for a case type
   */
  static getTotalSteps(caseType: LegalCaseType): number {
    switch (caseType) {
      case LegalCaseType.OVERSTAY_APPEAL:
        return Object.keys(OVERSTAY_APPEAL_STEPS).length;
      case LegalCaseType.PROHIBITED_PERSONS:
        return Object.keys(PROHIBITED_PERSONS_STEPS).length;
      case LegalCaseType.HIGH_COURT_EXPEDITION:
        return Object.keys(HIGH_COURT_STEPS).length;
      case LegalCaseType.APPEALS_8_4:
        return Object.keys(APPEALS_8_4_STEPS).length;
      case LegalCaseType.APPEALS_8_6:
        return Object.keys(APPEALS_8_6_STEPS).length;
      default:
        return 0;
    }
  }

  /**
   * Get step name by step number and case type
   */
  static getStepName(caseType: LegalCaseType, stepNumber: number): string {
    switch (caseType) {
      case LegalCaseType.OVERSTAY_APPEAL:
        return OVERSTAY_APPEAL_STEPS[stepNumber as OverstayAppealStep] || 'Unknown Step';
      case LegalCaseType.PROHIBITED_PERSONS:
        return PROHIBITED_PERSONS_STEPS[stepNumber as ProhibitedPersonsStep] || 'Unknown Step';
      case LegalCaseType.HIGH_COURT_EXPEDITION:
        return HIGH_COURT_STEPS[stepNumber as HighCourtStep] || 'Unknown Step';
      case LegalCaseType.APPEALS_8_4:
        return APPEALS_8_4_STEPS[stepNumber as AppealsStep] || 'Unknown Step';
      case LegalCaseType.APPEALS_8_6:
        return APPEALS_8_6_STEPS[stepNumber as AppealsStep] || 'Unknown Step';
      default:
        return 'Unknown Step';
    }
  }

  /**
   * Get all step definitions for a case type
   */
  static getStepDefinitions(caseType: LegalCaseType): Record<number, string> {
    switch (caseType) {
      case LegalCaseType.OVERSTAY_APPEAL:
        return OVERSTAY_APPEAL_STEPS;
      case LegalCaseType.PROHIBITED_PERSONS:
        return PROHIBITED_PERSONS_STEPS;
      case LegalCaseType.HIGH_COURT_EXPEDITION:
        return HIGH_COURT_STEPS;
      case LegalCaseType.APPEALS_8_4:
        return APPEALS_8_4_STEPS;
      case LegalCaseType.APPEALS_8_6:
        return APPEALS_8_6_STEPS;
      default:
        return {};
    }
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  /**
   * Check if a case can advance to the next step
   */
  static canAdvanceStep(legalCase: LegalCase): { canAdvance: boolean; reason?: string } {
    // Check if case is closed or lost
    if (legalCase.case_status === LegalCaseStatus.CLOSED) {
      return { canAdvance: false, reason: 'Case is already closed' };
    }
    
    if (legalCase.case_status === LegalCaseStatus.SETTLED) {
      return { canAdvance: false, reason: 'Case has been settled' };
    }
    
    const totalSteps = this.getTotalSteps(legalCase.case_type);
    
    // Check if already at the last step
    if (legalCase.current_step >= totalSteps) {
      return { canAdvance: false, reason: 'Case is already at the final step' };
    }
    
    // Check constraints for High Court cases
    if (legalCase.case_type === LegalCaseType.HIGH_COURT_EXPEDITION) {
      const highCourtData = legalCase.workflow_data as HighCourtData;
      
      // If at Letter of Demand step, check 14-day notification period
      if (legalCase.current_step === HighCourtStep.LETTER_OF_DEMAND) {
        if (!highCourtData.notification_period_satisfied) {
          const endDate = highCourtData.notification_period_end;
          if (endDate && new Date(endDate) > new Date()) {
            return { 
              canAdvance: false, 
              reason: `14-day notification period not satisfied. Wait until ${endDate}` 
            };
          }
        }
      }
      
      // If at Settlement step, must have outcome set
      if (legalCase.current_step === HighCourtStep.SETTLEMENT_AGREEMENT) {
        if (!highCourtData.settlement_outcome) {
          return { 
            canAdvance: false, 
            reason: 'Settlement outcome must be set before proceeding' 
          };
        }
      }
    }
    
    // Check outcome requirement for Prohibited Persons
    if (legalCase.case_type === LegalCaseType.PROHIBITED_PERSONS) {
      if (legalCase.current_step === ProhibitedPersonsStep.OUTCOME) {
        const ppData = legalCase.workflow_data as ProhibitedPersonsData;
        if (!ppData.outcome_result) {
          return { 
            canAdvance: false, 
            reason: 'Outcome must be set (success/lost) before proceeding' 
          };
        }
      }
    }
    
    return { canAdvance: true };
  }

  // ============================================================================
  // WORKFLOW TRANSITIONS
  // ============================================================================

  /**
   * Advance a case to the next step in its workflow
   */
  static advanceStep(
    legalCase: LegalCase,
    request: AdvanceStepRequest
  ): WorkflowTransitionResult {
    const validation = this.canAdvanceStep(legalCase);
    
    if (!validation.canAdvance) {
      return {
        success: false,
        case: legalCase,
        previous_step: legalCase.current_step,
        current_step: legalCase.current_step,
        message: validation.reason || 'Cannot advance step'
      };
    }
    
    const previousStep = legalCase.current_step;
    const newStep = previousStep + 1;
    const now = new Date().toISOString();
    
    // Update step history - mark current step as completed
    const updatedHistory = legalCase.step_history.map(entry => {
      if (entry.step_id === previousStep) {
        return {
          ...entry,
          status: StepStatus.COMPLETED,
          completed_at: now,
          notes: request.notes || entry.notes,
          performed_by: request.performed_by,
          attachments: request.attachments || entry.attachments,
          metadata: request.metadata || entry.metadata
        };
      }
      if (entry.step_id === newStep) {
        return {
          ...entry,
          status: StepStatus.IN_PROGRESS,
          started_at: now
        };
      }
      return entry;
    });
    
    // Build updated case
    const updatedCase: LegalCase = {
      ...legalCase,
      current_step: newStep,
      current_step_name: this.getStepName(legalCase.case_type, newStep),
      step_history: updatedHistory,
      updated_at: now
    };
    
    // Handle case-type specific logic
    const result = this.handleStepSpecificLogic(updatedCase, previousStep, newStep, request);
    
    return result;
  }

  /**
   * Handle step-specific business logic for each case type
   */
  private static handleStepSpecificLogic(
    legalCase: LegalCase,
    previousStep: number,
    currentStep: number,
    request: AdvanceStepRequest
  ): WorkflowTransitionResult {
    const nextActions: string[] = [];
    const warnings: string[] = [];
    let requiresAction: { action_type: string; description: string; due_date?: string } | undefined;
    
    switch (legalCase.case_type) {
      // =========================================================================
      // OVERSTAY APPEAL SPECIFIC LOGIC
      // =========================================================================
      case LegalCaseType.OVERSTAY_APPEAL:
        // At Submit Application step - email submission action required
        if (currentStep === OverstayAppealStep.SUBMIT_APPLICATION) {
          requiresAction = {
            action_type: 'email_submission',
            description: 'Email submission to DHA is required'
          };
          nextActions.push('Send email submission to DHA');
        }
        break;
      
      // =========================================================================
      // PROHIBITED PERSONS SPECIFIC LOGIC  
      // =========================================================================
      case LegalCaseType.PROHIBITED_PERSONS:
        // At Outcome step - need to set success/lost
        if (currentStep === ProhibitedPersonsStep.OUTCOME) {
          nextActions.push('Set case outcome (Success or Lost)');
          nextActions.push('If Lost, consider triggering an appeal');
        }
        break;
      
      // =========================================================================
      // HIGH COURT/EXPEDITION SPECIFIC LOGIC
      // =========================================================================
      case LegalCaseType.HIGH_COURT_EXPEDITION:
        const highCourtData = legalCase.workflow_data as HighCourtData;
        
        // Starting Letter of Demand - set notification period
        if (currentStep === HighCourtStep.LETTER_OF_DEMAND && !highCourtData.notification_period_start) {
          const now = new Date();
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() + 14);
          
          legalCase.workflow_data = {
            ...highCourtData,
            letter_of_demand_date: now.toISOString(),
            notification_period_start: now.toISOString(),
            notification_period_end: endDate.toISOString()
          };
          
          // Add constraint for 14-day period
          legalCase.constraints = [
            ...(legalCase.constraints || []),
            {
              constraint_type: 'time_period',
              description: '14-day notification period for Letter of Demand',
              value: { days: 14 },
              is_satisfied: false,
              due_date: endDate.toISOString()
            }
          ];
          
          legalCase.next_deadline = endDate.toISOString();
          
          warnings.push(`14-day notification period started. Cannot proceed until ${endDate.toLocaleDateString()}`);
        }
        
        // At Settlement step - need to set settled/not settled
        if (currentStep === HighCourtStep.SETTLEMENT_AGREEMENT) {
          nextActions.push('Determine if settlement is reached');
          nextActions.push('If settled, case ends here');
          nextActions.push('If not settled, proceed to High Court');
        }
        break;

      case LegalCaseType.APPEALS_8_4:
      case LegalCaseType.APPEALS_8_6:
        if (currentStep === AppealsStep.SUBMIT_AT_VFS) {
          requiresAction = {
            action_type: 'vfs_center_selection',
            description: 'Select the VFS center for submission'
          };
          nextActions.push('Select VFS center and submit application');
        }
        if (currentStep === AppealsStep.OUTCOME) {
          nextActions.push('Set case outcome (approved/rejected/pending)');
        }
        break;
    }
    
    // Check if we've reached the final step
    const totalSteps = this.getTotalSteps(legalCase.case_type);
    if (currentStep === totalSteps) {
      nextActions.push('Final step reached - set case outcome');
    }
    
    return {
      success: true,
      case: legalCase,
      previous_step: previousStep,
      current_step: currentStep,
      message: `Advanced from step ${previousStep} to step ${currentStep}: ${this.getStepName(legalCase.case_type, currentStep)}`,
      next_actions: nextActions,
      warnings: warnings.length > 0 ? warnings : undefined,
      requires_action: requiresAction
    };
  }

  // ============================================================================
  // OVERSTAY APPEAL SPECIFIC METHODS
  // ============================================================================

  /**
   * Record email submission for Overstay Appeal
   */
  static recordEmailSubmission(
    legalCase: LegalCase,
    emailRecipient: string,
    dhaReference?: string
  ): WorkflowTransitionResult {
    if (legalCase.case_type !== LegalCaseType.OVERSTAY_APPEAL) {
      return {
        success: false,
        case: legalCase,
        previous_step: legalCase.current_step,
        current_step: legalCase.current_step,
        message: 'Email submission only applies to Overstay Appeal cases'
      };
    }
    
    const now = new Date().toISOString();
    const data = legalCase.workflow_data as OverstayAppealData;
    
    const updatedCase: LegalCase = {
      ...legalCase,
      workflow_data: {
        ...data,
        email_submission_sent: true,
        email_submission_date: now,
        email_recipient: emailRecipient,
        dha_reference_number: dhaReference || null
      },
      updated_at: now
    };
    
    return {
      success: true,
      case: updatedCase,
      previous_step: legalCase.current_step,
      current_step: legalCase.current_step,
      message: 'Email submission recorded successfully',
      next_actions: ['Continue to Follow ups with DHA']
    };
  }

  /**
   * Set outcome for Overstay Appeal case
   */
  static setOverstayAppealOutcome(
    legalCase: LegalCase,
    outcome: 'approved' | 'rejected' | 'pending',
    notes?: string
  ): WorkflowTransitionResult {
    if (legalCase.case_type !== LegalCaseType.OVERSTAY_APPEAL) {
      return {
        success: false,
        case: legalCase,
        previous_step: legalCase.current_step,
        current_step: legalCase.current_step,
        message: 'This method only applies to Overstay Appeal cases'
      };
    }
    
    const now = new Date().toISOString();
    const data = legalCase.workflow_data as OverstayAppealData;
    
    let newStatus: LegalCaseStatus;
    switch (outcome) {
      case 'approved':
        newStatus = LegalCaseStatus.CLOSED;
        break;
      case 'rejected':
        newStatus = LegalCaseStatus.LOST;
        break;
      default:
        newStatus = LegalCaseStatus.ACTIVE;
    }
    
    const updatedCase: LegalCase = {
      ...legalCase,
      case_status: newStatus,
      workflow_data: {
        ...data,
        outcome_result: outcome
      },
      closed_at: newStatus !== LegalCaseStatus.ACTIVE ? now : null,
      updated_at: now
    };
    
    // Update step history
    updatedCase.step_history = updatedCase.step_history.map(entry => {
      if (entry.step_id === OverstayAppealStep.OUTCOME) {
        return {
          ...entry,
          status: StepStatus.COMPLETED,
          completed_at: now,
          notes: notes || entry.notes
        };
      }
      return entry;
    });
    
    return {
      success: true,
      case: updatedCase,
      previous_step: legalCase.current_step,
      current_step: legalCase.current_step,
      message: `Case outcome set to: ${outcome}`,
      next_actions: outcome === 'pending' ? ['Await final decision'] : ['Case completed']
    };
  }

  // ============================================================================
  // PROHIBITED PERSONS SPECIFIC METHODS
  // ============================================================================

  /**
   * Set outcome for Prohibited Persons case (Success or Lost)
   */
  static setProhibitedPersonsOutcome(
    legalCase: LegalCase,
    outcome: ProhibitedPersonsOutcome,
    notes?: string,
    performedBy?: number
  ): WorkflowTransitionResult {
    if (legalCase.case_type !== LegalCaseType.PROHIBITED_PERSONS) {
      return {
        success: false,
        case: legalCase,
        previous_step: legalCase.current_step,
        current_step: legalCase.current_step,
        message: 'This method only applies to Prohibited Persons cases'
      };
    }
    
    const now = new Date().toISOString();
    const data = legalCase.workflow_data as ProhibitedPersonsData;
    
    let newStatus: LegalCaseStatus;
    const nextActions: string[] = [];
    
    if (outcome === ProhibitedPersonsOutcome.SUCCESS) {
      newStatus = LegalCaseStatus.CLOSED;
      nextActions.push('Case successfully closed');
    } else {
      newStatus = LegalCaseStatus.LOST;
      nextActions.push('Consider triggering an appeal to restart the process');
    }
    
    const updatedCase: LegalCase = {
      ...legalCase,
      case_status: newStatus,
      workflow_data: {
        ...data,
        outcome_result: outcome
      },
      closed_at: now,
      updated_at: now
    };
    
    // Update step history
    updatedCase.step_history = updatedCase.step_history.map(entry => {
      if (entry.step_id === ProhibitedPersonsStep.OUTCOME) {
        return {
          ...entry,
          status: StepStatus.COMPLETED,
          completed_at: now,
          notes: notes || entry.notes,
          performed_by: performedBy || entry.performed_by
        };
      }
      return entry;
    });
    
    return {
      success: true,
      case: updatedCase,
      previous_step: legalCase.current_step,
      current_step: legalCase.current_step,
      message: `Case outcome set to: ${outcome}`,
      next_actions: nextActions
    };
  }

  /**
   * Trigger an appeal for a Lost Prohibited Persons case
   * This restarts the workflow from Step 1
   */
  static triggerAppeal(
    legalCase: LegalCase,
    request: TriggerAppealRequest
  ): { success: boolean; originalCase: LegalCase; appealCase?: LegalCase; message: string } {
    if (legalCase.case_type !== LegalCaseType.PROHIBITED_PERSONS) {
      return {
        success: false,
        originalCase: legalCase,
        message: 'Appeals only apply to Prohibited Persons cases'
      };
    }
    
    const data = legalCase.workflow_data as ProhibitedPersonsData;
    
    if (data.outcome_result !== ProhibitedPersonsOutcome.LOST) {
      return {
        success: false,
        originalCase: legalCase,
        message: 'Appeals can only be triggered for Lost cases'
      };
    }
    
    const now = new Date().toISOString();
    const appealNumber = (data.appeal_count || 0) + 1;
    
    // Create appeal record for original case
    const appealRecord: AppealRecord = {
      appeal_id: Date.now(), // Will be replaced by DB-generated ID
      parent_case_id: legalCase.case_id,
      appeal_number: appealNumber,
      started_at: now,
      closed_at: null,
      outcome: null,
      notes: request.notes || null
    };
    
    // Update original case to track the appeal
    const updatedOriginalCase: LegalCase = {
      ...legalCase,
      case_status: LegalCaseStatus.APPEALING,
      appeal_count: appealNumber,
      appeals: [...(legalCase.appeals || []), appealRecord],
      updated_at: now
    };
    
    // Create new appeal case (sub-case that starts from step 1)
    const appealCase: LegalCase = {
      ...legalCase,
      case_id: 0, // Will be assigned by database
      case_reference: `${legalCase.case_reference}-APPEAL-${appealNumber}`,
      case_title: `${legalCase.case_title} (Appeal #${appealNumber})`,
      case_status: LegalCaseStatus.ACTIVE,
      current_step: 1,
      current_step_name: PROHIBITED_PERSONS_STEPS[ProhibitedPersonsStep.REACH_OUT],
      step_history: createInitialStepHistory(LegalCaseType.PROHIBITED_PERSONS),
      workflow_data: {
        ...createDefaultProhibitedPersonsData(),
        is_appeal: true,
        appeal_count: appealNumber,
        vlist_reference: data.vlist_reference // Carry over reference
      },
      appeal_count: 0,
      appeals: [],
      parent_case_id: legalCase.case_id,
      created_at: now,
      updated_at: now,
      started_at: now,
      closed_at: null,
      constraints: [],
      next_deadline: null
    };
    
    return {
      success: true,
      originalCase: updatedOriginalCase,
      appealCase: appealCase,
      message: `Appeal #${appealNumber} triggered. New case created starting from Step 1.`
    };
  }

  // ============================================================================
  // HIGH COURT/EXPEDITION SPECIFIC METHODS
  // ============================================================================

  /**
   * Check if 14-day notification period is satisfied
   */
  static checkNotificationPeriod(legalCase: LegalCase): { 
    satisfied: boolean; 
    daysRemaining: number; 
    endDate: string | null 
  } {
    if (legalCase.case_type !== LegalCaseType.HIGH_COURT_EXPEDITION) {
      return { satisfied: true, daysRemaining: 0, endDate: null };
    }
    
    const data = legalCase.workflow_data as HighCourtData;
    
    if (!data.notification_period_end) {
      return { satisfied: false, daysRemaining: 14, endDate: null };
    }
    
    const endDate = new Date(data.notification_period_end);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return {
      satisfied: daysRemaining <= 0,
      daysRemaining: Math.max(0, daysRemaining),
      endDate: data.notification_period_end
    };
  }

  /**
   * Mark notification period as manually satisfied (override)
   */
  static markNotificationPeriodSatisfied(legalCase: LegalCase): WorkflowTransitionResult {
    if (legalCase.case_type !== LegalCaseType.HIGH_COURT_EXPEDITION) {
      return {
        success: false,
        case: legalCase,
        previous_step: legalCase.current_step,
        current_step: legalCase.current_step,
        message: 'This method only applies to High Court cases'
      };
    }
    
    const now = new Date().toISOString();
    const data = legalCase.workflow_data as HighCourtData;
    
    const updatedCase: LegalCase = {
      ...legalCase,
      workflow_data: {
        ...data,
        notification_period_satisfied: true
      },
      constraints: (legalCase.constraints || []).map(c => {
        if (c.constraint_type === 'time_period' && c.description.includes('14-day')) {
          return { ...c, is_satisfied: true };
        }
        return c;
      }),
      updated_at: now
    };
    
    return {
      success: true,
      case: updatedCase,
      previous_step: legalCase.current_step,
      current_step: legalCase.current_step,
      message: '14-day notification period marked as satisfied'
    };
  }

  /**
   * Set settlement outcome for High Court case
   */
  static setSettlementOutcome(
    legalCase: LegalCase,
    request: SettlementRequest
  ): WorkflowTransitionResult {
    if (legalCase.case_type !== LegalCaseType.HIGH_COURT_EXPEDITION) {
      return {
        success: false,
        case: legalCase,
        previous_step: legalCase.current_step,
        current_step: legalCase.current_step,
        message: 'This method only applies to High Court cases'
      };
    }
    
    if (legalCase.current_step !== HighCourtStep.SETTLEMENT_AGREEMENT) {
      return {
        success: false,
        case: legalCase,
        previous_step: legalCase.current_step,
        current_step: legalCase.current_step,
        message: 'Settlement can only be set at the Settlement/Agreement step'
      };
    }
    
    const now = new Date().toISOString();
    const data = legalCase.workflow_data as HighCourtData;
    const nextActions: string[] = [];
    
    let newStatus: LegalCaseStatus = LegalCaseStatus.ACTIVE;
    let newStep = legalCase.current_step;
    
    if (request.settlement_outcome === SettlementOutcome.SETTLED) {
      // Case ends here - mark as settled
      newStatus = LegalCaseStatus.SETTLED;
      nextActions.push('Case settled successfully');
    } else {
      // Proceed to High Court step
      newStep = HighCourtStep.HIGH_COURT;
      nextActions.push('Proceed to High Court hearing');
    }
    
    // Update step history
    const updatedHistory = legalCase.step_history.map(entry => {
      if (entry.step_id === HighCourtStep.SETTLEMENT_AGREEMENT) {
        return {
          ...entry,
          status: StepStatus.COMPLETED,
          completed_at: now,
          notes: request.notes || entry.notes,
          performed_by: request.performed_by
        };
      }
      if (request.settlement_outcome === SettlementOutcome.NOT_SETTLED && 
          entry.step_id === HighCourtStep.HIGH_COURT) {
        return {
          ...entry,
          status: StepStatus.IN_PROGRESS,
          started_at: now
        };
      }
      return entry;
    });
    
    const updatedCase: LegalCase = {
      ...legalCase,
      case_status: newStatus,
      current_step: newStep,
      current_step_name: this.getStepName(LegalCaseType.HIGH_COURT_EXPEDITION, newStep),
      step_history: updatedHistory,
      workflow_data: {
        ...data,
        settlement_outcome: request.settlement_outcome,
        settlement_date: now,
        settlement_amount: request.settlement_amount || null,
        settlement_terms: request.settlement_terms || null
      },
      closed_at: newStatus === LegalCaseStatus.SETTLED ? now : null,
      updated_at: now
    };
    
    return {
      success: true,
      case: updatedCase,
      previous_step: legalCase.current_step,
      current_step: newStep,
      message: request.settlement_outcome === SettlementOutcome.SETTLED
        ? 'Case settled - process complete'
        : 'No settlement - proceeding to High Court',
      next_actions: nextActions
    };
  }

  /**
   * Mark High Court case as complete
   */
  static completeHighCourtCase(
    legalCase: LegalCase,
    judgmentOutcome: string,
    notes?: string,
    performedBy?: number
  ): WorkflowTransitionResult {
    if (legalCase.case_type !== LegalCaseType.HIGH_COURT_EXPEDITION) {
      return {
        success: false,
        case: legalCase,
        previous_step: legalCase.current_step,
        current_step: legalCase.current_step,
        message: 'This method only applies to High Court cases'
      };
    }
    
    const now = new Date().toISOString();
    const data = legalCase.workflow_data as HighCourtData;
    
    // Update step history
    const updatedHistory = legalCase.step_history.map(entry => {
      if (entry.step_id === HighCourtStep.HIGH_COURT) {
        return {
          ...entry,
          status: StepStatus.COMPLETED,
          completed_at: now,
          notes: notes || entry.notes,
          performed_by: performedBy || entry.performed_by
        };
      }
      if (entry.step_id === HighCourtStep.COMPLETE) {
        return {
          ...entry,
          status: StepStatus.COMPLETED,
          started_at: now,
          completed_at: now,
          notes: `Judgment: ${judgmentOutcome}`
        };
      }
      return entry;
    });
    
    const updatedCase: LegalCase = {
      ...legalCase,
      case_status: LegalCaseStatus.CLOSED,
      current_step: HighCourtStep.COMPLETE,
      current_step_name: HIGH_COURT_STEPS[HighCourtStep.COMPLETE],
      step_history: updatedHistory,
      workflow_data: {
        ...data,
        final_judgment_date: now,
        judgment_outcome: judgmentOutcome
      },
      closed_at: now,
      updated_at: now
    };
    
    return {
      success: true,
      case: updatedCase,
      previous_step: legalCase.current_step,
      current_step: HighCourtStep.COMPLETE,
      message: `High Court case completed with judgment: ${judgmentOutcome}`
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate a unique case reference number
   */
  static generateCaseReference(caseType: LegalCaseType): string {
    const prefix = {
      [LegalCaseType.OVERSTAY_APPEAL]: 'OA',
      [LegalCaseType.PROHIBITED_PERSONS]: 'PP',
      [LegalCaseType.HIGH_COURT_EXPEDITION]: 'HC'
    }[caseType];
    
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${prefix}-${year}-${random}`;
  }

  /**
   * Create a new legal case with default values
   */
  static createNewCase(
    caseType: LegalCaseType,
    caseTitle: string,
    clientName: string,
    options?: {
      clientEmail?: string;
      clientPhone?: string;
      clientId?: number;
      assignedCaseManagerId?: number;
      assignedParalegalId?: number;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      notes?: string;
      tags?: string[];
    }
  ): LegalCase {
    const now = new Date().toISOString();
    
    let workflowData: OverstayAppealData | ProhibitedPersonsData | HighCourtData | Appeals84Data | Appeals86Data;
    switch (caseType) {
      case LegalCaseType.OVERSTAY_APPEAL:
        workflowData = createDefaultOverstayAppealData();
        break;
      case LegalCaseType.PROHIBITED_PERSONS:
        workflowData = createDefaultProhibitedPersonsData();
        break;
      case LegalCaseType.HIGH_COURT_EXPEDITION:
        workflowData = createDefaultHighCourtData();
        break;
      case LegalCaseType.APPEALS_8_4:
        workflowData = createDefaultAppeals84Data();
        break;
      case LegalCaseType.APPEALS_8_6:
        workflowData = createDefaultAppeals86Data();
        break;
    }
    
    return {
      case_id: 0, // Will be assigned by database
      case_reference: this.generateCaseReference(caseType),
      case_type: caseType,
      case_title: caseTitle,
      case_status: LegalCaseStatus.ACTIVE,
      
      client_id: options?.clientId || null,
      client_name: clientName,
      client_email: options?.clientEmail || null,
      client_phone: options?.clientPhone || null,
      
      assigned_case_manager_id: options?.assignedCaseManagerId || null,
      assigned_paralegal_id: options?.assignedParalegalId || null,
      
      current_step: 1,
      current_step_name: this.getStepName(caseType, 1),
      step_history: createInitialStepHistory(caseType),
      
      workflow_data: workflowData,
      
      appeal_count: 0,
      appeals: [],
      parent_case_id: null,
      
      created_at: now,
      updated_at: now,
      started_at: now,
      closed_at: null,
      
      constraints: [],
      next_deadline: null,
      
      priority: options?.priority || 'medium',
      notes: options?.notes || null,
      tags: options?.tags || []
    };
  }

  /**
   * Get progress percentage for a case
   */
  static getProgress(legalCase: LegalCase): number {
    const totalSteps = this.getTotalSteps(legalCase.case_type);
    const completedSteps = legalCase.step_history.filter(
      s => s.status === StepStatus.COMPLETED
    ).length;
    
    return Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Check if case has upcoming deadlines
   */
  static getUpcomingDeadlines(legalCase: LegalCase, withinDays: number = 7): WorkflowConstraint[] {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + withinDays);
    
    return (legalCase.constraints || []).filter(c => {
      if (!c.due_date || c.is_satisfied) return false;
      const dueDate = new Date(c.due_date);
      return dueDate >= now && dueDate <= futureDate;
    });
  }

  /**
   * Check if case is overdue on any constraints
   */
  static isOverdue(legalCase: LegalCase): boolean {
    const now = new Date();
    
    return (legalCase.constraints || []).some(c => {
      if (!c.due_date || c.is_satisfied) return false;
      return new Date(c.due_date) < now;
    });
  }
}

// ============================================================================
// EXPORT DEFAULT INSTANCE FOR CONVENIENCE
// ============================================================================

export default LegalWorkflowService;
