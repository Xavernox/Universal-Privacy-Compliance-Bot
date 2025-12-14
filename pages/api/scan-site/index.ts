import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Import utilities and models
import { connectToDatabase } from '../../../lib/mongodb';
import { validateJWT } from '../../../middleware/auth';
import { scannerServiceClient } from '../../../lib/scanner-service';
import { ScanRequest, ScanResponse, ThirdPartyResource, ScanResult } from '../../../models/ScanResult';

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/api.log' })
  ]
});

// Validation schema for request
const scanRequestSchema = Joi.object({
  url: Joi.string().uri().required(),
  depth: Joi.number().integer().min(1).max(5).default(1),
  timeout: Joi.number().integer().min(5).max(120).default(30)
});

// Request interface extending NextApiRequest
interface ScanApiRequest extends NextApiRequest {
  body: ScanRequest;
}

// API handler with JWT authentication
export default validateJWT(async function handler(
  req: ScanApiRequest,
  res: NextApiResponse<ScanResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const scanId = uuidv4();
  const startTime = Date.now();

  try {
    logger.info('Starting site scan', { 
      scanId, 
      url: req.body.url,
      userAgent: req.headers['user-agent']
    });

    // Validate request input
    const { error, value } = scanRequestSchema.validate(req.body);
    if (error) {
      logger.warn('Invalid request data', { scanId, error: error.message });
      return res.status(400).json({ error: `Invalid request: ${error.message}` });
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const scansCollection = db.collection('scans');

    // Check for duplicate scans
    const existingScan = await scansCollection.findOne({
      target_url: value.url,
      status: 'completed',
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (existingScan) {
      logger.info('Returning cached scan result', { scanId, existingScanId: existingScan.scan_id });
      return res.status(200).json(existingScan);
    }

    // Create initial scan record
    const scanRecord = {
      scan_id: scanId,
      target_url: value.url,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
      request_data: value
    };

    await scansCollection.insertOne(scanRecord);

    // Update status to scanning
    await scansCollection.updateOne(
      { scan_id: scanId },
      { $set: { status: 'scanning', updated_at: new Date() } }
    );

    logger.info('Invoking scanner service', { scanId, scannerUrl: process.env.SCANNER_SERVICE_URL });

    // Call scanner service
    const scannerResponse = await scannerServiceClient.scanWebsite({
      url: value.url,
      depth: value.depth,
      timeout: value.timeout
    });

    // Process and enrich the scan results
    const enrichedResults = await enrichScanResults(scannerResponse, scanId);

    // Update scan record with results
    await scansCollection.updateOne(
      { scan_id: scanId },
      { 
        $set: { 
          status: 'completed',
          results: enrichedResults,
          completed_at: new Date(),
          scan_duration: (Date.now() - startTime) / 1000,
          updated_at: new Date()
        }
      }
    );

    logger.info('Scan completed successfully', { 
      scanId, 
      duration: (Date.now() - startTime) / 1000,
      resourcesFound: enrichedResults.resources.length
    });

    // Return successful response
    return res.status(200).json(enrichedResults);

  } catch (error: any) {
    const duration = (Date.now() - startTime) / 1000;
    
    logger.error('Scan failed', { 
      scanId, 
      error: error.message,
      stack: error.stack,
      duration
    });

    // Update scan record with error
    try {
      const { db } = await connectToDatabase();
      const scansCollection = db.collection('scans');
      
      await scansCollection.updateOne(
        { scan_id: scanId },
        { 
          $set: { 
            status: 'failed',
            error: error.message,
            failed_at: new Date(),
            scan_duration: duration,
            updated_at: new Date()
          }
        }
      );
    } catch (dbError) {
      logger.error('Failed to update scan record with error', { scanId, dbError });
    }

    // Return error response
    return res.status(500).json({ 
      error: 'Internal server error',
      scanId,
      duration
    });
  }
});

// Enrich scan results with additional metadata
async function enrichScanResults(
  scannerResponse: any, 
  scanId: string
): Promise<ScanResult> {
  const baseResults = scannerResponse as ScanResult;
  
  // Add enrichment data
  const enrichedResults: ScanResult = {
    ...baseResults,
    scan_id: scanId,
    enriched_at: new Date().toISOString(),
    metadata: {
      scanner_version: '1.0.0',
      enrichment_applied: true,
      risk_analysis: calculateRiskAnalysis(baseResults.resources),
      category_analysis: analyzeCategories(baseResults.resources),
      recommendations: generateRecommendations(baseResults.resources)
    }
  };

  return enrichedResults;
}

// Calculate overall risk analysis
function calculateRiskAnalysis(resources: ThirdPartyResource[]) {
  const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
  const totalResources = resources.length;
  
  resources.forEach(resource => {
    riskCounts[resource.risk_level as keyof typeof riskCounts]++;
  });
  
  const overallRisk = totalResources > 0 ? 
    (riskCounts.high * 3 + riskCounts.medium * 2 + riskCounts.critical * 4) / totalResources : 0;
  
  return {
    ...riskCounts,
    overall_risk_score: Math.round(overallRisk * 100) / 100,
    risk_level: overallRisk >= 3 ? 'high' : overallRisk >= 2 ? 'medium' : 'low'
  };
}

// Analyze resource categories
function analyzeCategories(resources: ThirdPartyResource[]) {
  const categoryCounts: Record<string, number> = {};
  
  resources.forEach(resource => {
    categoryCounts[resource.category] = (categoryCounts[resource.category] || 0) + 1;
  });
  
  return {
    categories_found: Object.keys(categoryCounts).length,
    category_distribution: categoryCounts,
    primary_category: Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none'
  };
}

// Generate recommendations based on findings
function generateRecommendations(resources: ThirdPartyResource[]) {
  const recommendations = [];
  
  // Check for high-risk resources
  const highRiskResources = resources.filter(r => r.risk_level === 'high' || r.risk_level === 'critical');
  if (highRiskResources.length > 0) {
    recommendations.push({
      type: 'security',
      priority: 'high',
      message: `Found ${highRiskResources.length} high/critical risk resources. Review and consider removing or replacing them.`,
      affected_resources: highRiskResources.map(r => r.host)
    });
  }
  
  // Check for excessive third-party scripts
  const scriptResources = resources.filter(r => r.type === 'script');
  if (scriptResources.length > 10) {
    recommendations.push({
      type: 'performance',
      priority: 'medium',
      message: `Found ${scriptResources.length} third-party scripts. Consider reducing the number to improve page load performance.`,
      affected_resources: scriptResources.map(r => r.host)
    });
  }
  
  // Check for tracking cookies
  const trackingResources = resources.filter(r => 
    r.type === 'cookie' && (r.category === 'analytics' || r.category === 'advertising')
  );
  if (trackingResources.length > 0) {
    recommendations.push({
      type: 'privacy',
      priority: 'medium',
      message: `Found ${trackingResources.length} tracking cookies. Ensure GDPR/CCPA compliance with proper consent mechanisms.`,
      affected_resources: trackingResources.map(r => r.host)
    });
  }
  
  return recommendations;
}
