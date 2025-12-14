#!/usr/bin/env python3
"""
Site Scanner Service - FastAPI application for scanning websites
Detects third-party scripts, cookies, and trackers using Playwright
"""

import os
import json
import asyncio
from typing import List, Dict, Any
from urllib.parse import urlparse, urljoin
import re
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl, validator
import uvicorn

try:
    from playwright.async_api import async_playwright, Page, Browser
except ImportError:
    print("Playwright not installed. Run: pip install playwright && playwright install")
    raise

# Pydantic models for request/response
class ScanRequest(BaseModel):
    url: HttpUrl
    depth: int = 1
    timeout: int = 30
    
    @validator('depth')
    def validate_depth(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Depth must be between 1 and 5')
        return v
    
    @validator('timeout')
    def validate_timeout(cls, v):
        if v < 5 or v > 120:
            raise ValueError('Timeout must be between 5 and 120 seconds')
        return v

class ThirdPartyResource(BaseModel):
    host: str
    type: str  # script, cookie, tracker, pixel, etc.
    url: str
    risk_level: str  # low, medium, high, critical
    description: str
    category: str = "general"

class ScanResult(BaseModel):
    scan_id: str
    target_url: str
    timestamp: str
    resources: List[ThirdPartyResource]
    summary: Dict[str, Any]
    scan_duration: float
    pages_scanned: int

# Initialize FastAPI app
app = FastAPI(
    title="Site Scanner Service",
    description="Scan websites for third-party scripts, cookies, and trackers",
    version="1.0.0"
)

# Known tracker/analytics domains
KNOWN_TRACKERS = {
    'google-analytics.com': {'type': 'analytics', 'risk': 'low', 'category': 'analytics'},
    'googletagmanager.com': {'type': 'tag_manager', 'risk': 'low', 'category': 'analytics'},
    'doubleclick.net': {'type': 'advertising', 'risk': 'medium', 'category': 'advertising'},
    'facebook.net': {'type': 'social_tracking', 'risk': 'medium', 'category': 'social'},
    'facebook.com': {'type': 'social_tracking', 'risk': 'medium', 'category': 'social'},
    'twitter.com': {'type': 'social_tracking', 'risk': 'medium', 'category': 'social'},
    'linkedin.com': {'type': 'social_tracking', 'risk': 'medium', 'category': 'social'},
    'hotjar.com': {'type': 'heat_mapping', 'risk': 'medium', 'category': 'analytics'},
    'mixpanel.com': {'type': 'analytics', 'risk': 'low', 'category': 'analytics'},
    'segment.com': {'type': 'analytics', 'risk': 'low', 'category': 'analytics'},
    'intercom.io': {'type': 'chat', 'risk': 'low', 'category': 'customer_support'},
    'zendesk.com': {'type': 'chat', 'risk': 'low', 'category': 'customer_support'},
    'cloudflare.com': {'type': 'cdn', 'risk': 'low', 'category': 'infrastructure'},
    'amazonaws.com': {'type': 'cdn', 'risk': 'low', 'category': 'infrastructure'},
    'cdnjs.cloudflare.com': {'type': 'cdn', 'risk': 'low', 'category': 'infrastructure'},
    'fonts.googleapis.com': {'type': 'fonts', 'risk': 'low', 'category': 'ui'},
    'fonts.gstatic.com': {'type': 'fonts', 'risk': 'low', 'category': 'ui'},
    'youtube.com': {'type': 'video', 'risk': 'medium', 'category': 'media'},
    'youtu.be': {'type': 'video', 'risk': 'medium', 'category': 'media'},
    'vimeo.com': {'type': 'video', 'risk': 'medium', 'category': 'media'},
    'wistia.com': {'type': 'video', 'risk': 'medium', 'category': 'media'},
    'stripe.com': {'type': 'payment', 'risk': 'low', 'category': 'payments'},
    'paypal.com': {'type': 'payment', 'risk': 'low', 'category': 'payments'},
    'braintreepayments.com': {'type': 'payment', 'risk': 'low', 'category': 'payments'},
    'recaptcha.net': {'type': 'security', 'risk': 'low', 'category': 'security'},
    'hcaptcha.com': {'type': 'security', 'risk': 'low', 'category': 'security'},
}

def extract_domain(url: str) -> str:
    """Extract domain from URL"""
    parsed = urlparse(url)
    return parsed.netloc.lower()

def determine_risk_level(domain: str, resource_type: str) -> str:
    """Determine risk level based on domain and resource type"""
    domain_lower = domain.lower()
    
    # Check known trackers
    for known_domain, info in KNOWN_TRACKERS.items():
        if known_domain in domain_lower:
            return info['risk']
    
    # Default risk assessment
    if resource_type in ['script', 'iframe']:
        # External scripts are medium risk by default
        return 'medium'
    elif resource_type == 'cookie':
        # Cookies depend on type - we'll assess this when we have more info
        return 'low'
    elif resource_type == 'pixel':
        # Tracking pixels are typically medium-high risk
        return 'medium'
    else:
        return 'low'

def categorize_resource(domain: str, resource_type: str) -> str:
    """Categorize the third-party resource"""
    domain_lower = domain.lower()
    
    for known_domain, info in KNOWN_TRACKERS.items():
        if known_domain in domain_lower:
            return info.get('category', 'general')
    
    # Default categorization based on resource type
    if resource_type == 'script':
        return 'script'
    elif resource_type == 'cookie':
        return 'cookie'
    elif resource_type == 'pixel':
        return 'tracking'
    else:
        return 'general'

async def scan_page(page: Page, url: str) -> List[ThirdPartyResource]:
    """Scan a single page for third-party resources"""
    resources = []
    
    try:
        # Navigate to page with timeout
        await page.goto(url, wait_until='networkidle', timeout=30000)
        
        # Wait a bit for dynamic content
        await asyncio.sleep(2)
        
        # Get page cookies
        cookies = await page.context.cookies()
        for cookie in cookies:
            domain = cookie.get('domain', '')
            if domain:
                resources.append(ThirdPartyResource(
                    host=domain.lstrip('.'),
                    type='cookie',
                    url=f"cookie://{domain.lstrip('.')}",
                    risk_level='low',
                    description=f"Cookie: {cookie.get('name', 'unknown')}",
                    category='cookie'
                ))
        
        # Get all script sources
        scripts = await page.evaluate("""
            () => {
                const scripts = Array.from(document.scripts);
                return scripts.map(script => ({
                    src: script.src || null,
                    innerHTML: script.innerHTML.substring(0, 200) // Limit size
                })).filter(script => script.src);
            }
        """)
        
        for script in scripts:
            if script['src']:
                domain = extract_domain(script['src'])
                if domain and domain != extract_domain(url):  # Third-party
                    risk_level = determine_risk_level(domain, 'script')
                    category = categorize_resource(domain, 'script')
                    
                    resources.append(ThirdPartyResource(
                        host=domain,
                        type='script',
                        url=script['src'],
                        risk_level=risk_level,
                        description=f"External script from {domain}",
                        category=category
                    ))
        
        # Get all images (potential tracking pixels)
        images = await page.evaluate("""
            () => {
                const images = Array.from(document.images);
                return images.map(img => ({
                    src: img.src,
                    width: img.width,
                    height: img.height
                }));
            }
        """)
        
        for img in images:
            if img['src']:
                domain = extract_domain(img['src'])
                if domain and domain != extract_domain(url):  # Third-party
                    # Check if it's a tracking pixel (small dimensions)
                    is_pixel = (img.get('width', 0) <= 2 and img.get('height', 0) <= 2) or \
                              ('pixel' in img['src'].lower() or 'track' in img['src'].lower())
                    
                    resource_type = 'pixel' if is_pixel else 'image'
                    risk_level = determine_risk_level(domain, resource_type)
                    category = categorize_resource(domain, resource_type)
                    
                    resources.append(ThirdPartyResource(
                        host=domain,
                        type=resource_type,
                        url=img['src'],
                        risk_level=risk_level,
                        description=f"{resource_type.title()} from {domain}",
                        category=category
                    ))
        
        # Get all iframes
        iframes = await page.evaluate("""
            () => {
                const iframes = Array.from(document.querySelectorAll('iframe'));
                return iframes.map(iframe => iframe.src);
            }
        """)
        
        for iframe_src in iframes:
            if iframe_src:
                domain = extract_domain(iframe_src)
                if domain and domain != extract_domain(url):  # Third-party
                    risk_level = determine_risk_level(domain, 'iframe')
                    category = categorize_resource(domain, 'iframe')
                    
                    resources.append(ThirdPartyResource(
                        host=domain,
                        type='iframe',
                        url=iframe_src,
                        risk_level=risk_level,
                        description=f"Embedded iframe from {domain}",
                        category=category
                    ))
        
        # Get network requests made by the page
        def handle_response(response):
            url = response.url
            domain = extract_domain(url)
            if domain and domain != extract_domain(page.url):
                resource_type = 'network_request'
                if 'script' in response.headers.get('content-type', ''):
                    resource_type = 'script'
                elif 'image' in response.headers.get('content-type', ''):
                    resource_type = 'image'
                elif 'css' in response.headers.get('content-type', ''):
                    resource_type = 'stylesheet'
                
                risk_level = determine_risk_level(domain, resource_type)
                category = categorize_resource(domain, resource_type)
                
                resources.append(ThirdPartyResource(
                    host=domain,
                    type=resource_type,
                    url=url,
                    risk_level=risk_level,
                    description=f"{resource_type.replace('_', ' ').title()} from {domain}",
                    category=category
                ))
        
        page.on('response', handle_response)
        
    except Exception as e:
        print(f"Error scanning page {url}: {str(e)}")
    
    return resources

async def scan_website(url: str, depth: int = 1, timeout: int = 30) -> ScanResult:
    """Scan a website for third-party resources"""
    start_time = datetime.now()
    scan_id = f"scan_{int(start_time.timestamp())}"
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        )
        
        # Create context
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        )
        
        # Create page
        page = await context.new_page()
        
        # Enable request interception to catch all network requests
        await page.route('**/*', lambda route: route.continue_())
        
        try:
            # Scan the main page
            all_resources = []
            pages_scanned = 0
            
            # Scan main page
            resources = await scan_page(page, url)
            all_resources.extend(resources)
            pages_scanned += 1
            
            # TODO: Implement recursive scanning for depth > 1
            # This would involve finding links on the page and scanning them
            
            # Create summary
            resource_summary = {}
            risk_summary = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
            category_summary = {}
            
            for resource in all_resources:
                # Count by type
                resource_summary[resource.type] = resource_summary.get(resource.type, 0) + 1
                
                # Count by risk
                risk_summary[resource.risk_level] = risk_summary.get(resource.risk_level, 0) + 1
                
                # Count by category
                category_summary[resource.category] = category_summary.get(resource.category, 0) + 1
            
            end_time = datetime.now()
            scan_duration = (end_time - start_time).total_seconds()
            
            return ScanResult(
                scan_id=scan_id,
                target_url=url,
                timestamp=start_time.isoformat(),
                resources=all_resources,
                summary={
                    'total_resources': len(all_resources),
                    'by_type': resource_summary,
                    'by_risk': risk_summary,
                    'by_category': category_summary,
                    'unique_hosts': len(set(r.host for r in all_resources))
                },
                scan_duration=scan_duration,
                pages_scanned=pages_scanned
            )
            
        finally:
            await browser.close()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "scanner", "version": "1.0.0"}

@app.post("/scan", response_model=ScanResult)
async def scan_site(request: ScanRequest, background_tasks: BackgroundTasks):
    """
    Scan a website for third-party scripts, cookies, and trackers
    """
    try:
        # Validate URL
        url = str(request.url)
        if not url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="URL must start with http:// or https://")
        
        # Perform scan
        result = await scan_website(url, request.depth, request.timeout)
        
        # Log scan completion (background task)
        background_tasks.add_task(
            print, 
            f"Scan completed: {result.scan_id} for {url} - {len(result.resources)} resources found"
        )
        
        return JSONResponse(
            status_code=200,
            content=result.dict()
        )
        
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Scan timeout - the website took too long to load")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@app.get("/scan/{scan_id}")
async def get_scan_result(scan_id: str):
    """
    Retrieve a previous scan result
    """
    # TODO: Implement scan result storage/retrieval
    # For now, return not found
    raise HTTPException(status_code=404, detail="Scan result not found")

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )