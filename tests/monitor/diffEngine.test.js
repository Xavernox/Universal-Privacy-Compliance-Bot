const { createDiff, markStalePolicies, validateTracker } = require('../../lambda/monitor/diffEngine');

// Mock AWS SDK
jest.mock('aws-sdk', () => {
  const mockDynamoDB = {
    DocumentClient: jest.fn(() => ({
      update: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      })
    }))
  };
  
  return {
    DynamoDB: mockDynamoDB
  };
});

describe('DiffEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDiff', () => {
    it('should detect new trackers correctly', () => {
      const previousTrackers = [];
      const currentTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 85,
          compliant: true,
          controlFailures: 2,
          criticalViolations: 0,
          remediationStatus: 'IN_PROGRESS'
        }
      ];

      const result = createDiff(previousTrackers, currentTrackers);

      expect(result.newTrackers).toHaveLength(1);
      expect(result.newTrackers[0].policyId).toBe('policy-1');
      expect(result.removedTrackers).toHaveLength(0);
      expect(result.regressions).toHaveLength(0);
      expect(result.summary.totalNew).toBe(1);
    });

    it('should detect removed trackers correctly', () => {
      const previousTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 85,
          compliant: true,
          controlFailures: 2,
          criticalViolations: 0,
          remediationStatus: 'IN_PROGRESS'
        }
      ];
      const currentTrackers = [];

      const result = createDiff(previousTrackers, currentTrackers);

      expect(result.newTrackers).toHaveLength(0);
      expect(result.removedTrackers).toHaveLength(1);
      expect(result.removedTrackers[0].policyId).toBe('policy-1');
      expect(result.summary.totalRemoved).toBe(1);
    });

    it('should detect compliance score regression', () => {
      const previousTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 85,
          compliant: true,
          controlFailures: 2,
          criticalViolations: 0,
          remediationStatus: 'COMPLETED'
        }
      ];
      const currentTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 70, // Decreased score
          compliant: true,
          controlFailures: 2,
          criticalViolations: 0,
          remediationStatus: 'COMPLETED'
        }
      ];

      const result = createDiff(previousTrackers, currentTrackers);

      expect(result.regressions).toHaveLength(1);
      expect(result.regressions[0].policyId).toBe('policy-1');
      expect(result.regressions[0].regressionIndicators).toContainEqual(
        expect.objectContaining({
          type: 'COMPLIANCE_SCORE_DECREASED',
          previous: 85,
          current: 70,
          change: -15
        })
      );
    });

    it('should detect policy becoming non-compliant', () => {
      const previousTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 85,
          compliant: true, // Previously compliant
          controlFailures: 1,
          criticalViolations: 0,
          remediationStatus: 'COMPLETED'
        }
      ];
      const currentTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 60,
          compliant: false, // Now non-compliant
          controlFailures: 3,
          criticalViolations: 1,
          remediationStatus: 'IN_PROGRESS'
        }
      ];

      const result = createDiff(previousTrackers, currentTrackers);

      expect(result.regressions).toHaveLength(1);
      expect(result.regressions[0].regressionIndicators).toContainEqual(
        expect.objectContaining({
          type: 'POLICY_BECAME_NON_COMPLIANT'
        })
      );
    });

    it('should detect increased control failures', () => {
      const previousTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 85,
          compliant: true,
          controlFailures: 2,
          criticalViolations: 0,
          remediationStatus: 'COMPLETED'
        }
      ];
      const currentTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 85,
          compliant: true,
          controlFailures: 4, // Increased failures
          criticalViolations: 0,
          remediationStatus: 'COMPLETED'
        }
      ];

      const result = createDiff(previousTrackers, currentTrackers);

      expect(result.regressions).toHaveLength(1);
      expect(result.regressions[0].regressionIndicators).toContainEqual(
        expect.objectContaining({
          type: 'CONTROL_FAILURES_INCREASED',
          previous: 2,
          current: 4,
          change: 2
        })
      );
    });

    it('should detect increased critical violations', () => {
      const previousTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 85,
          compliant: true,
          controlFailures: 2,
          criticalViolations: 0,
          remediationStatus: 'COMPLETED'
        }
      ];
      const currentTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 85,
          compliant: true,
          controlFailures: 2,
          criticalViolations: 2, // Increased violations
          remediationStatus: 'COMPLETED'
        }
      ];

      const result = createDiff(previousTrackers, currentTrackers);

      expect(result.regressions).toHaveLength(1);
      expect(result.regressions[0].regressionIndicators).toContainEqual(
        expect.objectContaining({
          type: 'CRITICAL_VIOLATIONS_INCREASED',
          previous: 0,
          current: 2,
          change: 2
        })
      );
    });

    it('should detect remediation status regression', () => {
      const previousTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 85,
          compliant: true,
          controlFailures: 2,
          criticalViolations: 0,
          remediationStatus: 'COMPLETED' // Previously completed
        }
      ];
      const currentTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 85,
          compliant: true,
          controlFailures: 2,
          criticalViolations: 0,
          remediationStatus: 'IN_PROGRESS' // Now in progress
        }
      ];

      const result = createDiff(previousTrackers, currentTrackers);

      expect(result.regressions).toHaveLength(1);
      expect(result.regressions[0].regressionIndicators).toContainEqual(
        expect.objectContaining({
          type: 'REMEDIATION_STATUS_REGRESSED',
          previous: 'COMPLETED',
          current: 'IN_PROGRESS'
        })
      );
    });

    it('should handle multiple regression indicators', () => {
      const previousTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 90,
          compliant: true,
          controlFailures: 1,
          criticalViolations: 0,
          remediationStatus: 'COMPLETED'
        }
      ];
      const currentTrackers = [
        {
          policyId: 'policy-1',
          resourceId: 'resource-1',
          userId: 'user-1',
          policyName: 'Security Policy',
          complianceScore: 60, // Decreased
          compliant: false, // No longer compliant
          controlFailures: 4, // Increased
          criticalViolations: 2, // Increased
          remediationStatus: 'IN_PROGRESS' // Regressed
        }
      ];

      const result = createDiff(previousTrackers, currentTrackers);

      expect(result.regressions).toHaveLength(1);
      expect(result.regressions[0].regressionIndicators).toHaveLength(5);
      expect(result.regressions[0].severity).toBe('CRITICAL'); // Should be highest severity
    });

    it('should calculate correct severity levels', () => {
      const testCases = [
        {
          indicator: { type: 'POLICY_BECAME_NON_COMPLIANT' },
          expectedSeverity: 'CRITICAL'
        },
        {
          indicator: { type: 'CRITICAL_VIOLATIONS_INCREASED' },
          expectedSeverity: 'CRITICAL'
        },
        {
          indicator: { type: 'COMPLIANCE_SCORE_DECREASED' },
          expectedSeverity: 'HIGH'
        },
        {
          indicator: { type: 'CONTROL_FAILURES_INCREASED' },
          expectedSeverity: 'MEDIUM'
        },
        {
          indicator: { type: 'REMEDIATION_STATUS_REGRESSED' },
          expectedSeverity: 'MEDIUM'
        }
      ];

      testCases.forEach(({ indicator, expectedSeverity }) => {
        const previousTrackers = [
          {
            policyId: 'policy-1',
            resourceId: 'resource-1',
            userId: 'user-1',
            policyName: 'Test Policy',
            complianceScore: 90,
            compliant: true,
            controlFailures: 0,
            criticalViolations: 0,
            remediationStatus: 'COMPLETED'
          }
        ];
        
        let currentTrackers;
        switch (indicator.type) {
          case 'POLICY_BECAME_NON_COMPLIANT':
            currentTrackers = [{
              ...previousTrackers[0],
              compliant: false
            }];
            break;
          case 'CRITICAL_VIOLATIONS_INCREASED':
            currentTrackers = [{
              ...previousTrackers[0],
              criticalViolations: 1
            }];
            break;
          case 'COMPLIANCE_SCORE_DECREASED':
            currentTrackers = [{
              ...previousTrackers[0],
              complianceScore: 70
            }];
            break;
          case 'CONTROL_FAILURES_INCREASED':
            currentTrackers = [{
              ...previousTrackers[0],
              controlFailures: 2
            }];
            break;
          case 'REMEDIATION_STATUS_REGRESSED':
            currentTrackers = [{
              ...previousTrackers[0],
              remediationStatus: 'IN_PROGRESS'
            }];
            break;
        }

        const result = createDiff(previousTrackers, currentTrackers);
        expect(result.regressions[0].severity).toBe(expectedSeverity);
      });
    });
  });

  describe('validateTracker', () => {
    it('should validate correct tracker data', () => {
      const validTracker = {
        policyId: 'policy-1',
        resourceId: 'resource-1',
        userId: 'user-1',
        policyName: 'Test Policy',
        complianceScore: 85,
        controlFailures: 2,
        criticalViolations: 0
      };

      const result = validateTracker(validTracker);
      expect(result.valid).toBe(true);
    });

    it('should reject tracker with missing required fields', () => {
      const invalidTracker = {
        policyName: 'Test Policy',
        complianceScore: 85
      };

      const result = validateTracker(invalidTracker);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('policyId');
      expect(result.error).toContain('resourceId');
      expect(result.error).toContain('userId');
    });

    it('should reject tracker with invalid numeric fields', () => {
      const invalidTracker = {
        policyId: 'policy-1',
        resourceId: 'resource-1',
        userId: 'user-1',
        complianceScore: 'not-a-number'
      };

      const result = validateTracker(invalidTracker);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('complianceScore');
    });
  });

  describe('markStalePolicies', () => {
    it('should mark policies as stale in database', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({})
      });
      
      const AWS = require('aws-sdk');
      AWS.DynamoDB.DocumentClient.mockImplementation(() => ({
        update: mockUpdate
      }));

      const regressions = [
        {
          policyId: 'policy-1',
          regressionIndicators: [
            { type: 'COMPLIANCE_SCORE_DECREASED' }
          ],
          severity: 'HIGH'
        }
      ];

      process.env.POLICIES_TABLE = 'test-policies-table';

      await markStalePolicies('user-1', regressions);

      expect(mockUpdate).toHaveBeenCalledWith({
        TableName: 'test-policies-table',
        Key: {
          policyId: 'policy-1',
          userId: 'user-1'
        },
        UpdateExpression: 'SET stale = :stale, lastAlertedAt = :alertedAt, regressionSeverity = :severity',
        ExpressionAttributeValues: {
          ':stale': true,
          ':alerted': expect.any(String),
          ':severity': 'HIGH'
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      const AWS = require('aws-sdk');
      const mockUpdate = jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Database error'))
      });
      
      AWS.DynamoDB.DocumentClient.mockImplementation(() => ({
        update: mockUpdate
      }));

      const regressions = [
        {
          policyId: 'policy-1',
          regressionIndicators: [],
          severity: 'LOW'
        }
      ];

      await expect(markStalePolicies('user-1', regressions)).rejects.toThrow('Database error');
    });
  });
});