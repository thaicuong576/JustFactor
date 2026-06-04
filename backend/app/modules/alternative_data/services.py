from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse, quote_plus, unquote, urljoin

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.modules.alternative_data import models as alt_models
from app.modules.auth.models import UserRole
from app.modules.sme import models as sme_models


COMPONENT_CONFIG = {
    "identity_consistency": {
        "max_score": 40,
        "data_point": "company_identity",
        "label": "Identity consistency",
    },
    "digital_legitimacy": {
        "max_score": 35,
        "data_point": "digital_legitimacy",
        "label": "Digital legitimacy",
    },
    "linkedin_footprint": {
        "max_score": 30,
        "data_point": "linkedin_footprint",
        "label": "LinkedIn footprint",
    },
    "operating_activity": {
        "max_score": 35,
        "data_point": "operating_activity",
        "label": "Operating activity",
    },
    "reputation_risk": {
        "max_score": 35,
        "data_point": "reputation_risk",
        "label": "Reputation and risk signals",
    },
    "source_quality": {
        "max_score": 25,
        "data_point": "source_quality",
        "label": "Source quality",
    },
}

CONFIDENCE_MULTIPLIERS = {
    5: 1.0,
    4: 0.8,
    3: 0.5,
    2: 0.3,
    1: 0.1,
}

FIRST_PARTY_RECRUITMENT_TOKENS = (
    "career",
    "careers",
    "job",
    "jobs",
    "recruit",
    "recruitment",
    "hiring",
    "join-us",
    "joinus",
    "tuyen-dung",
    "tuyendung",
    "viec-lam",
    "vieclam",
    "nhan-su",
)


def normalize_url(url: str | None) -> str | None:
    if not url or not url.strip():
        return None
    cleaned = url.strip()
    if not re.match(r"^https?://", cleaned, flags=re.IGNORECASE):
        cleaned = f"https://{cleaned}"
    parsed = urlparse(cleaned)
    if not parsed.netloc:
        return None
    return cleaned


def _looks_like_first_party_recruitment_url(url: str) -> bool:
    normalized_path = unquote(url.lower()).replace("_", "-")
    return any(token in normalized_path for token in FIRST_PARTY_RECRUITMENT_TOKENS)


def _html_to_text_excerpt(html: str, limit: int = 1200) -> str:
    text_content = re.sub(r"<[^>]+>", " ", html)
    text_content = re.sub(r"\s+", " ", text_content).strip()
    return text_content[:limit]


def _confidence_to_score(max_score: int, confidence: int) -> int:
    multiplier = CONFIDENCE_MULTIPLIERS.get(max(1, min(confidence, 5)), 0.0)
    return int(round((max_score * multiplier) + 0.0001))


def _safe_confidence(data_point: dict[str, Any] | None) -> int:
    if not data_point:
        return 0
    try:
        return max(1, min(int(data_point.get("confidenceScore", 0)), 5))
    except (TypeError, ValueError):
        return 0


def _extract_sources(enrichment: dict[str, Any]) -> list[str]:
    sources = []
    for data_point in enrichment.values():
        if isinstance(data_point, dict):
            source = data_point.get("source")
            if source and source not in sources:
                sources.append(source)
    return sources


class AlternativeDataScoringService:
    def score_enrichment(self, enrichment: dict[str, Any]) -> dict[str, Any]:
        components: dict[str, dict[str, Any]] = {}
        confidence_values = [
            confidence
            for confidence in (_safe_confidence(value) for value in enrichment.values() if isinstance(value, dict))
            if confidence
        ]

        for key, config in COMPONENT_CONFIG.items():
            data_point = enrichment.get(config["data_point"])
            confidence = _safe_confidence(data_point)
            score = _confidence_to_score(config["max_score"], confidence) if confidence else 0
            components[key] = {
                "label": config["label"],
                "score": score,
                "max_score": config["max_score"],
                "confidence": confidence,
                "evidence": data_point.get("content") if isinstance(data_point, dict) else None,
                "source": data_point.get("source") if isinstance(data_point, dict) else None,
            }

        total_score = sum(component["score"] for component in components.values())
        confidence_avg = round(sum(confidence_values) / len(confidence_values), 2) if confidence_values else 0.0
        fit_score = round(total_score / 20, 1)
        sources = _extract_sources(enrichment)

        if total_score >= 160:
            summary = "Strong alternative data profile with high-confidence public evidence."
        elif total_score >= 100:
            summary = "Moderate alternative data profile with useful but incomplete public evidence."
        elif total_score > 0:
            summary = "Limited alternative data profile; manual review is recommended."
        else:
            summary = "No meaningful alternative data evidence was available."

        return {
            "alternative_data_score": total_score,
            "fit_score": fit_score,
            "confidence_avg": confidence_avg,
            "components": components,
            "sources": sources,
            "public_summary": summary,
            "reasoning": (
                "Score is derived from Mira-style evidence confidence across identity, digital presence, "
                "LinkedIn footprint, operating activity, reputation risk, and source quality."
            ),
        }


class MiraStyleFallbackEnrichmentService:
    async def _analyze_with_llm(
        self,
        company_name: str,
        website: str | None,
        page_text: str,
        linkedin_url: str | None
    ) -> dict[str, Any] | None:
        from app.core.config import settings
        if not settings.LLM_API_KEY:
            return None
        
        base_url = settings.LLM_BASE_URL.rstrip("/")
        if not base_url.endswith("/v1"):
            base_url = f"{base_url}/v1"
        url = f"{base_url}/chat/completions"
        
        context = f"""
        Company Name: {company_name}
        Website: {website or 'None'}
        LinkedIn Profile: {linkedin_url or 'None'}
        
        Website Homepage Excerpt:
        {page_text[:4000] if page_text else 'No website content scraped.'}
        """
        
        prompt = f"""
        You are an expert risk auditor for JustFactor, an invoice factoring platform in Vietnam.
        Your job is to analyze the alternative data footprint of a company and score its digital legitimacy and identity consistency.
        
        Analyze this company footprint:
        Company Name: {company_name}
        Website: {website or 'None'}
        LinkedIn Profile: {linkedin_url or 'None'}
        Website Homepage Excerpt: {page_text[:4000] if page_text else 'No website content scraped.'}
        
        For each of the following 7 components, evaluate and assign a confidenceScore (1 to 5, where 5 is highest confidence/lowest risk, and 1 is lowest confidence/highest risk; except for linkedin_footprint which should be 0 if no profile is available) and write a short Vietnamese description explaining the evidence.
        
        1. company_identity: Is the company's identity consistent? (Check if the company's website or LinkedIn matches the submitted company name). Max score is 5 if website is active and clearly matches the company name, 3 if barely matching, 1 if no website/profile matches.
        2. business_profile: Provide a brief summary of what the company does based on the homepage excerpt. Max score 4 if content is available, 2 if no content.
        3. digital_legitimacy: Does the company have a professional digital footprint (reachable website)? Max score 5 if website is fully active, 3 if barely active, 1 if no website.
        4. linkedin_footprint: Evaluate LinkedIn footprint. Max score 4 if LinkedIn profile is active, 0 if no LinkedIn profile is available.
        5. operating_activity: Is there active operating evidence (mention of news, blogs, hiring, products)? Max score 4 if active signals present, 2 if static site, 0 if no site.
        6. reputation_risk: Are there any negative signals (scam, fraud, bankruptcy, blacklist, lawsuit, suspended)? Max score 4 if no negative signals and site is verified, 2 if unverified/no site, 1 if negative signals.
        7. source_quality: Evaluate the overall quality of alternative data sources used. Max score 5 if website and LinkedIn are both available, active and consistent, 3 if only website, 1 if only basic profile.
        
        Return ONLY a raw JSON object (no markdown wrapping, no explanation outside JSON, no code blocks) with the 7 keys listed above. Each key must map to an object containing a "content" key (string in Vietnamese) and a "confidenceScore" key (integer).
        """
        
        try:
            payload = {
                "model": settings.LLM_MODEL or "kimi-k2.6",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "stream": False
            }
            headers = {
                "Authorization": f"Bearer {settings.LLM_API_KEY}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                choices = data.get("choices") or []
                content = choices[0]["message"]["content"]
                content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL | re.IGNORECASE)
                clean_json = content.strip()
                if clean_json.startswith("```"):
                    clean_json = re.sub(r"^```(?:json)?\n", "", clean_json)
                    clean_json = re.sub(r"\n```$", "", clean_json)
                    clean_json = clean_json.strip()
                
                import json
                parsed = json.loads(clean_json)
                
                required_keys = [
                    "company_identity", "business_profile", "digital_legitimacy",
                    "linkedin_footprint", "operating_activity", "reputation_risk", "source_quality"
                ]
                if all(k in parsed for k in required_keys):
                    for k in required_keys:
                        min_val = 0 if k == "linkedin_footprint" else 1
                        parsed[k]["confidenceScore"] = max(min_val, min(int(parsed[k].get("confidenceScore", min_val)), 5))
                    return parsed
        except Exception as e:
            import traceback
            print("DEBUG: LLM enrichment exception details:")
            traceback.print_exc()
            
            if settings.MINIMAX_API_KEY:
                print("DEBUG: Enrichment failed. Falling back to MiniMax...", flush=True)
                try:
                    minimax_base = settings.MINIMAX_BASE_URL.rstrip("/")
                    if not minimax_base.endswith("/v1"):
                        minimax_base = f"{minimax_base}/v1"
                    minimax_url = f"{minimax_base}/chat/completions"
                    
                    minimax_payload = {
                        "model": settings.MINIMAX_MODEL or "MiniMax-M2.7",
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "stream": False
                    }
                    minimax_headers = {
                        "Authorization": f"Bearer {settings.MINIMAX_API_KEY}",
                        "Content-Type": "application/json"
                    }
                    async with httpx.AsyncClient(timeout=90.0) as client:
                        response = await client.post(minimax_url, json=minimax_payload, headers=minimax_headers)
                        response.raise_for_status()
                        data = response.json()
                        
                        choices = data.get("choices") or []
                        content = choices[0]["message"]["content"]
                        content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL | re.IGNORECASE)
                        clean_json = content.strip()
                        if clean_json.startswith("```"):
                            clean_json = re.sub(r"^```(?:json)?\n", "", clean_json)
                            clean_json = re.sub(r"\n```$", "", clean_json)
                            clean_json = clean_json.strip()
                        
                        import json
                        parsed = json.loads(clean_json)
                        
                        required_keys = [
                            "company_identity", "business_profile", "digital_legitimacy",
                            "linkedin_footprint", "operating_activity", "reputation_risk", "source_quality"
                        ]
                        if all(k in parsed for k in required_keys):
                            for k in required_keys:
                                min_val = 0 if k == "linkedin_footprint" else 1
                                parsed[k]["confidenceScore"] = max(min_val, min(int(parsed[k].get("confidenceScore", min_val)), 5))
                            return parsed
                except Exception as ex_minimax:
                    print(f"ERROR: MiniMax fallback enrichment failed: {ex_minimax}", flush=True)
                    traceback.print_exc()
            return None
        return None

    async def enrich(self, sme: sme_models.SME) -> dict[str, Any]:
        website = normalize_url(sme.company_website)
        linkedin_url = normalize_url(sme.linkedin_url)
        company_name = sme.company_name or "SME"
        sources: list[str] = []
        page_text = ""
        internal_links: list[str] = []

        if website:
            sources.append(website)
            try:
                async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                    response = await client.get(website)
                    response.raise_for_status()
                    page_text = re.sub(r"\s+", " ", response.text[:8000])
                    internal_links = self._extract_internal_links(response.text, website)
            except Exception:
                page_text = ""

        if linkedin_url:
            sources.append(linkedin_url)

        # Try LLM-based enrichment
        llm_enrichment = await self._analyze_with_llm(
            company_name=company_name,
            website=website,
            page_text=page_text,
            linkedin_url=linkedin_url
        )

        if llm_enrichment:
            enrichment: dict[str, Any] = {}
            for key, val in llm_enrichment.items():
                if key == "linkedin_footprint" and val["confidenceScore"] == 0:
                    continue
                enrichment[key] = {
                    "content": val["content"],
                    "confidenceScore": val["confidenceScore"],
                    "source": website or linkedin_url or "submitted_profile"
                }
            
            # Specific component source adjustments
            if "company_identity" in enrichment:
                enrichment["company_identity"]["source"] = website or "submitted_profile"
            if "linkedin_footprint" in enrichment and linkedin_url:
                enrichment["linkedin_footprint"]["source"] = linkedin_url
        else:
            # Fallback to local rule-based system
            identity_evidence = ""
            if website and page_text and company_name.lower() in page_text.lower():
                identity_confidence = 5
                identity_evidence = f"Company name '{company_name}' verified directly on submitted website '{website}'."
            elif website:
                identity_confidence = 3
                identity_evidence = f"Website '{website}' is active, but company name matching was not verified."
            else:
                identity_confidence = 1
                identity_evidence = f"No digital footprint or website verified for company '{company_name}'."

            digital_confidence = 5 if website and page_text and internal_links else 3 if website else 1
            linkedin_confidence = 4 if linkedin_url else 0
            activity_confidence = self._activity_confidence(page_text, internal_links)
            reputation_confidence = 4 if website and not self._has_negative_signal(page_text) else 2 if website else 0
            source_quality_confidence = self._source_quality_confidence(website, linkedin_url, sources)

            enrichment = {
                "company_identity": {
                    "content": identity_evidence,
                    "confidenceScore": identity_confidence,
                    "source": website or "submitted_profile",
                },
                "business_profile": {
                    "content": self._business_profile_summary(company_name, page_text),
                    "confidenceScore": 4 if page_text else 2,
                    "source": website or "submitted_profile",
                },
                "digital_legitimacy": {
                    "content": f"Website reachable with {len(internal_links)} relevant internal pages discovered."
                    if page_text
                    else "Website information was missing or unreachable.",
                    "confidenceScore": digital_confidence,
                    "source": website or "submitted_profile",
                },
                "operating_activity": {
                    "content": "Signals checked across website content, news, careers, blog, and contact pages.",
                    "confidenceScore": activity_confidence,
                    "source": website or "submitted_profile",
                },
                "reputation_risk": {
                    "content": "No adverse keyword signals found in available public content."
                    if reputation_confidence >= 4
                    else "Adverse or insufficient reputation evidence requires manual review.",
                    "confidenceScore": reputation_confidence,
                    "source": website or "submitted_profile",
                },
                "source_quality": {
                    "content": "Evidence includes submitted profile, first-party website, and LinkedIn when available.",
                    "confidenceScore": source_quality_confidence,
                    "source": website or linkedin_url or "submitted_profile",
                },
            }

            if linkedin_url:
                enrichment["linkedin_footprint"] = {
                    "content": "Submitted LinkedIn company profile is available for footprint review.",
                    "confidenceScore": linkedin_confidence,
                    "source": linkedin_url,
                }

        return {
            "enriched_company": enrichment,
            "raw_evidence": {
                "website_excerpt": page_text[:2000],
                "internal_links": internal_links[:5],
                "submitted_website": website,
                "submitted_linkedin": linkedin_url,
            },
            "sources": sources,
        }

    def _extract_internal_links(self, html: str, website: str) -> list[str]:
        parsed = urlparse(website)
        base = f"{parsed.scheme}://{parsed.netloc}"
        links: list[str] = []
        for href in re.findall(r'href=["\']([^"\']+)["\']', html, flags=re.IGNORECASE):
            if href.startswith("/"):
                url = f"{base}{href}"
            elif href.startswith(base):
                url = href
            else:
                continue
            lowered = url.lower()
            if any(token in lowered for token in ["about", "contact", "service", "news", "blog", "career"]):
                if url not in links:
                    links.append(url)
            if len(links) >= 5:
                break
        return links

    def _activity_confidence(self, page_text: str, links: list[str]) -> int:
        haystack = f"{page_text} {' '.join(links)}".lower()
        if any(token in haystack for token in ["news", "blog", "career", "hiring", "customer", "partner"]):
            return 4
        return 2 if page_text else 0

    def _has_negative_signal(self, page_text: str) -> bool:
        negative_tokens = ["scam", "fraud", "bankruptcy", "lawsuit", "suspended", "blacklist"]
        lowered = page_text.lower()
        return any(token in lowered for token in negative_tokens)

    def _source_quality_confidence(self, website: str | None, linkedin_url: str | None, sources: list[str]) -> int:
        if website and linkedin_url:
            return 5
        if website or linkedin_url:
            return 3
        return 1 if sources else 0

    def _business_profile_summary(self, company_name: str, page_text: str) -> str:
        if not page_text:
            return f"{company_name} has limited public business profile evidence."
        snippet = re.sub(r"<[^>]+>", " ", page_text)
        snippet = re.sub(r"\s+", " ", snippet).strip()
        return snippet[:280] or f"{company_name} public website content was available."


class AlternativeDataAssessmentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.enrichment_service = MiraStyleFallbackEnrichmentService()
        self.scoring_service = AlternativeDataScoringService()

    async def get_or_create(self, sme_id: int) -> alt_models.AlternativeDataAssessment:
        result = await self.db.execute(
            select(alt_models.AlternativeDataAssessment).where(
                alt_models.AlternativeDataAssessment.sme_id == sme_id
            )
        )
        assessment = result.scalar_one_or_none()
        if assessment:
            return assessment
        assessment = alt_models.AlternativeDataAssessment(
            sme_id=sme_id,
            status=alt_models.AlternativeDataStatus.PENDING,
            scorecard={},
            enriched_data={},
            raw_evidence={},
            sources=[],
        )
        self.db.add(assessment)
        await self.db.flush()
        return assessment

    async def run_for_sme(self, sme_id: int) -> alt_models.AlternativeDataAssessment:
        sme = await self.db.get(sme_models.SME, sme_id)
        if not sme:
            raise ValueError("SME not found")

        assessment = await self.get_or_create(sme_id)
        assessment.status = alt_models.AlternativeDataStatus.PROCESSING
        assessment.error_message = None
        await self.db.flush()

        try:
            enrichment_result = await self.enrichment_service.enrich(sme)
            enriched_company = enrichment_result["enriched_company"]
            scorecard = self.scoring_service.score_enrichment(enriched_company)

            assessment.status = alt_models.AlternativeDataStatus.COMPLETED
            assessment.alternative_data_score = scorecard["alternative_data_score"]
            assessment.fit_score = scorecard["fit_score"]
            assessment.confidence_avg = scorecard["confidence_avg"]
            assessment.scorecard = scorecard
            assessment.enriched_data = enriched_company
            assessment.raw_evidence = enrichment_result["raw_evidence"]
            assessment.sources = scorecard["sources"] or enrichment_result["sources"]
            assessment.public_summary = scorecard["public_summary"]
            assessment.last_run_at = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(assessment)
            return assessment
        except Exception as exc:
            assessment.status = alt_models.AlternativeDataStatus.FAILED
            assessment.error_message = str(exc)
            assessment.last_run_at = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(assessment)
            return assessment


def fetch_sme_website(website_url: str) -> tuple[str, list[str]]:
    from scrapling.fetchers import StealthyFetcher
    
    normalized = normalize_url(website_url)
    if not normalized:
        return "No website content scraped.", []
        
    try:
        response = StealthyFetcher.fetch(normalized, headless=True, timeout=12000)
        if response.status != 200:
            return f"Failed to fetch website. HTTP Status: {response.status}", []
            
        # Strip HTML tags
        text_content = _html_to_text_excerpt(response.text, limit=4000)
        
        # Extract internal links
        parsed = urlparse(normalized)
        base = f"{parsed.scheme}://{parsed.netloc}"
        links = []
        for href in re.findall(r'href=["\']([^"\']+)["\']', response.text, flags=re.IGNORECASE):
            url = urljoin(base, href)
            parsed_url = urlparse(url)
            if parsed_url.netloc != parsed.netloc:
                continue
            lowered = url.lower()
            if any(token in lowered for token in ["about", "contact", "service", "news", "blog"]) or _looks_like_first_party_recruitment_url(url):
                if url not in links:
                    links.append(url)
            if len(links) >= 5:
                break
        return text_content[:4000], links
    except Exception as e:
        return f"Failed to fetch website: {str(e)}", []


def search_ddg_queries(company_name: str) -> tuple[list[str], list[str]]:
    from scrapling.fetchers import StealthyFetcher
    from urllib.parse import quote_plus
    
    rec_snippets = []
    neg_snippets = []
    
    # 1. Combined recruitment query
    query_rec = f'"{company_name}" (site:topcv.vn OR site:vietnamworks.com OR site:careerviet.vn OR site:linkedin.com/jobs)'
    url_rec = f"https://html.duckduckgo.com/html/?q={quote_plus(query_rec)}"
    try:
        response = StealthyFetcher.fetch(url_rec, headless=True, timeout=12000)
        if response.status == 200:
            snippets = response.css('.result__snippet::text').getall()
            rec_snippets = [s.strip() for s in snippets if s.strip()][:5]
    except Exception as e:
        print(f"ERROR: DDG recruitment search failed: {e}")
        
    # 2. Combined negative query
    query_neg = f'"{company_name}" (phốt OR lừa đảo OR scam OR đa cấp OR nợ OR kiện)'
    url_neg = f"https://html.duckduckgo.com/html/?q={quote_plus(query_neg)}"
    try:
        response = StealthyFetcher.fetch(url_neg, headless=True, timeout=12000)
        if response.status == 200:
            snippets = response.css('.result__snippet::text').getall()
            neg_snippets = [s.strip() for s in snippets if s.strip()][:5]
    except Exception as e:
        print(f"ERROR: DDG negative search failed: {e}")
        
    return rec_snippets, neg_snippets


def fetch_first_party_recruitment_snippets(internal_links: list[str]) -> list[str]:
    from scrapling.fetchers import StealthyFetcher

    snippets: list[str] = []
    recruitment_links = [
        link for link in internal_links
        if _looks_like_first_party_recruitment_url(link)
    ][:3]

    for link in recruitment_links:
        try:
            response = StealthyFetcher.fetch(link, headless=True, timeout=12000)
            if response.status != 200:
                continue
            excerpt = _html_to_text_excerpt(response.text)
            if excerpt:
                snippets.append(f"First-party recruitment page {link}: {excerpt}")
        except Exception as e:
            print(f"ERROR: First-party recruitment page fetch failed for {link}: {e}")

    return snippets


def run_scraping_sync(company_name: str, website: str) -> tuple[str, list[str], list[str], list[str]]:
    page_excerpt, internal_links = fetch_sme_website(website)
    rec_snippets, neg_snippets = search_ddg_queries(company_name)
    first_party_rec_snippets = fetch_first_party_recruitment_snippets(internal_links)
    if first_party_rec_snippets:
        rec_snippets = list(dict.fromkeys(first_party_rec_snippets + rec_snippets))[:8]
    return page_excerpt, internal_links, rec_snippets, neg_snippets


async def evaluate_with_llm(
    company_name: str,
    website: str,
    linkedin_url: str,
    page_excerpt: str,
    rec_snippets: list[str],
    neg_snippets: list[str]
) -> dict | None:
    from app.core.config import settings
    import httpx
    import json
    
    if not settings.LLM_API_KEY:
        return None
        
    base_url = settings.LLM_BASE_URL.rstrip("/")
    if not base_url.endswith("/v1"):
        base_url = f"{base_url}/v1"
    url = f"{base_url}/chat/completions"
    
    print(f"DEBUG: Calling LLM at URL: {url}", flush=True)
    
    context = f"""
Company Name: {company_name}
Website: {website or 'None'}
LinkedIn: {linkedin_url or 'None'}

--- Website Homepage Excerpt ---
{page_excerpt}

--- Recruitment Evidence Snippets ---
{json.dumps(rec_snippets, ensure_ascii=False, indent=2)}

--- Negative Reputation Search Snippets ---
{json.dumps(neg_snippets, ensure_ascii=False, indent=2)}
"""
    
    prompt = f"""
You are an expert risk auditor for JustFactor, an invoice factoring platform in Vietnam.
Your job is to evaluate the digital footprint of this company and assign a confidence score (1 to 5, where 5 is highest confidence/lowest risk, and 1 is lowest confidence/highest risk) for the following three components:

1. digital_presence: Max score is 5 if the website is active and clearly matches the company name, 3 if barely matching, 1 if no website or unreachable.
2. recruitment_signal: Max score is 5 if active recruitment evidence is found on the company's own careers/jobs/recruitment pages or reputable job boards. Prefer first-party company careers pages over third-party job boards because job boards often block crawlers. Score 3 if evidence is old, sparse, or only weakly implied. Score 1 if no recruitment or hiring evidence is found.
3. public_visibility: Max score is 5 if the company has clean search presence without any negative signals (such as scam, fraud, phốt, lawsuit, or debt issues), 3 if presence is sparse, 1 if negative signals are found.

Write a short Vietnamese description (evidence summary) explaining the evidence for each.

Return ONLY a raw JSON object (no markdown wrapping, no explanation outside JSON, no code blocks) in this format:
{{
  "confidence_breakdown": {{
    "digital_presence": {{
      "confidence": 4,
      "evidence": "Website hoạt động bình thường, thông tin trùng khớp."
    }},
    "recruitment_signal": {{
      "confidence": 3,
      "evidence": "Tìm thấy một số thông tin tuyển dụng cũ."
    }},
    "public_visibility": {{
      "confidence": 5,
      "evidence": "Không phát hiện tin tức tiêu cực hay phốt trên mạng."
    }}
  }},
  "risk_flags": [],
  "evidence_summary": "Doanh nghiệp có sự hiện diện số tốt, không phát hiện rủi ro."
}}
"""
    
    payload = {
        "model": settings.LLM_MODEL or "kimi-k2.6",
        "messages": [
            {"role": "user", "content": f"{context}\n\n{prompt}"}
        ],
        "stream": False
    }
    
    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            choices = data.get("choices") or []
            content = choices[0]["message"]["content"].strip()
            content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL | re.IGNORECASE)
            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\n", "", content)
                content = re.sub(r"\n```$", "", content)
                content = content.strip()
                
            return json.loads(content)
    except Exception as e:
        import traceback
        print(f"ERROR: LLM evaluation failed: {e}", flush=True)
        traceback.print_exc()
        
        if settings.MINIMAX_API_KEY:
            print("DEBUG: Evaluation failed. Falling back to MiniMax...", flush=True)
            try:
                minimax_base = settings.MINIMAX_BASE_URL.rstrip("/")
                if not minimax_base.endswith("/v1"):
                    minimax_base = f"{minimax_base}/v1"
                minimax_url = f"{minimax_base}/chat/completions"
                
                minimax_payload = {
                    "model": settings.MINIMAX_MODEL or "MiniMax-M2.7",
                    "messages": [
                        {"role": "user", "content": f"{context}\n\n{prompt}"}
                    ],
                    "stream": False
                }
                minimax_headers = {
                    "Authorization": f"Bearer {settings.MINIMAX_API_KEY}",
                    "Content-Type": "application/json"
                }
                async with httpx.AsyncClient(timeout=45.0) as client:
                    resp = await client.post(minimax_url, json=minimax_payload, headers=minimax_headers)
                    resp.raise_for_status()
                    minimax_data = resp.json()
                    choices = minimax_data.get("choices") or []
                    content = choices[0]["message"]["content"].strip()
                    content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL | re.IGNORECASE)
                    if content.startswith("```"):
                        content = re.sub(r"^```(?:json)?\n", "", content)
                        content = re.sub(r"\n```$", "", content)
                        content = content.strip()
                        
                    return json.loads(content)
            except Exception as ex_minimax:
                print(f"ERROR: MiniMax fallback evaluation failed: {ex_minimax}", flush=True)
                traceback.print_exc()
                
        return None


async def run_alternative_data_assessment_task(sme_id: int) -> None:
    import anyio
    from app.modules.scoring.services import ScoringService
    from app.modules.invoice.models import Invoice

    async with AsyncSessionLocal() as db:
        sme = await db.get(sme_models.SME, sme_id)
        if not sme:
            return

        service = AlternativeDataAssessmentService(db)
        assessment = await service.get_or_create(sme_id)
        assessment.status = alt_models.AlternativeDataStatus.PROCESSING
        assessment.error_message = None
        assessment.last_run_at = datetime.now(timezone.utc)
        await db.commit()

        try:
            # Step 1 & 2: Crawl and search using Scrapling in a worker thread
            page_excerpt, internal_links, rec_snippets, neg_snippets = await anyio.to_thread.run_sync(
                run_scraping_sync, sme.company_name, sme.company_website
            )

            # Step 3: LLM evaluation
            llm_result = await evaluate_with_llm(
                company_name=sme.company_name,
                website=sme.company_website,
                linkedin_url=sme.linkedin_url,
                page_excerpt=page_excerpt,
                rec_snippets=rec_snippets,
                neg_snippets=neg_snippets
            )

            if not llm_result:
                fallback_result = await service.enrichment_service.enrich(sme)
                fallback_scorecard = service.scoring_service.score_enrichment(
                    fallback_result["enriched_company"]
                )

                assessment.status = alt_models.AlternativeDataStatus.COMPLETED
                assessment.alternative_data_score = fallback_scorecard["alternative_data_score"]
                assessment.fit_score = fallback_scorecard["fit_score"]
                assessment.confidence_avg = fallback_scorecard["confidence_avg"]
                assessment.scorecard = fallback_scorecard
                assessment.enriched_data = fallback_result["enriched_company"]
                assessment.raw_evidence = fallback_result["raw_evidence"]
                assessment.sources = fallback_scorecard["sources"] or fallback_result["sources"]
                assessment.public_summary = fallback_scorecard["public_summary"]
                assessment.error_message = None
                assessment.last_run_at = datetime.now(timezone.utc)
                await db.commit()

                invoices_result = await db.execute(
                    select(Invoice).where(Invoice.sme_id == sme_id)
                )
                invoices = invoices_result.scalars().all()
                if invoices:
                    scoring_service = ScoringService(db)
                    for invoice in invoices:
                        await scoring_service.calculate_score(invoice.id)
                return

            # Step 4: Calculate scores deterministically
            confidence_to_percent = {5: 1.0, 4: 0.8, 3: 0.5, 2: 0.3, 1: 0.1}
            breakdown = llm_result.get("confidence_breakdown", {})

            dp_conf = max(1, min(5, int(breakdown.get("digital_presence", {}).get("confidence", 1))))
            dp_score = round(3.5 * confidence_to_percent[dp_conf], 2)

            rec_conf = max(1, min(5, int(breakdown.get("recruitment_signal", {}).get("confidence", 1))))
            rec_score = round(2.5 * confidence_to_percent[rec_conf], 2)

            pv_conf = max(1, min(5, int(breakdown.get("public_visibility", {}).get("confidence", 1))))
            pv_score = round(4.0 * confidence_to_percent[pv_conf], 2)

            alternative_score = round(dp_score + rec_score + pv_score, 2)

            # Gather sources
            sources = []
            normalized_web = normalize_url(sme.company_website)
            if normalized_web:
                sources.append(normalized_web)
            normalized_li = normalize_url(sme.linkedin_url)
            if normalized_li:
                sources.append(normalized_li)
            # Add topcv / recruitment domains if links matched
            for link in internal_links:
                if link not in sources:
                    sources.append(link)

            # Build final result JSON scorecard matching the required schema
            result_scorecard = {
                "sme_id": sme_id,
                "status": "completed",
                "alternative_score": alternative_score,
                "confidence_breakdown": {
                    "digital_presence": {
                        "score": dp_score,
                        "confidence": dp_conf,
                        "evidence": breakdown.get("digital_presence", {}).get("evidence", "unavailable")
                    },
                    "recruitment_signal": {
                        "score": rec_score,
                        "confidence": rec_conf,
                        "evidence": breakdown.get("recruitment_signal", {}).get("evidence", "unavailable")
                    },
                    "public_visibility": {
                        "score": pv_score,
                        "confidence": pv_conf,
                        "evidence": breakdown.get("public_visibility", {}).get("evidence", "unavailable")
                    }
                },
                "risk_flags": llm_result.get("risk_flags", []),
                "evidence_summary": llm_result.get("evidence_summary", ""),
                "sources": sources,
                "scraped_at": datetime.now(timezone.utc).isoformat()
            }

            # Save to assessment record
            assessment.status = alt_models.AlternativeDataStatus.COMPLETED
            assessment.fit_score = alternative_score
            assessment.alternative_data_score = int(alternative_score * 20)
            assessment.confidence_avg = round((dp_conf + rec_conf + pv_conf) / 3.0, 2)
            assessment.scorecard = result_scorecard
            assessment.enriched_data = result_scorecard.get("confidence_breakdown", {})
            assessment.raw_evidence = {
                "homepage_excerpt": page_excerpt,
                "recruitment_snippets": rec_snippets,
                "negative_snippets": neg_snippets,
                "internal_links": internal_links,
                "submitted_website": sme.company_website,
                "submitted_linkedin": sme.linkedin_url,
                "llm_raw_response": llm_result,
            }
            assessment.sources = sources
            assessment.public_summary = result_scorecard.get("evidence_summary", "")
            assessment.error_message = None

        except Exception as exc:
            print(f"ERROR: Alternative data assessment task failed: {exc}")
            assessment.status = alt_models.AlternativeDataStatus.FAILED
            assessment.error_message = str(exc)

        assessment.last_run_at = datetime.now(timezone.utc)
        await db.commit()

        # Step 5: Recalculate J-Scores for open invoices
        if assessment.status == alt_models.AlternativeDataStatus.COMPLETED:
            try:
                invoices_result = await db.execute(
                    select(Invoice).where(Invoice.sme_id == sme_id)
                )
                invoices = invoices_result.scalars().all()
                if invoices:
                    scoring_service = ScoringService(db)
                    for invoice in invoices:
                        await scoring_service.calculate_score(invoice.id)
            except Exception as scoring_error:
                print(f"ERROR: Failed to recalculate J-Score for SME {sme_id}: {str(scoring_error)}")



def build_public_scorecard(assessment: Any, role: UserRole | str) -> dict[str, Any]:
    if isinstance(assessment, dict):
        data = dict(assessment)
    else:
        data = {
            "status": assessment.status.value if hasattr(assessment.status, "value") else assessment.status,
            "alternative_data_score": assessment.alternative_data_score,
            "fit_score": assessment.fit_score,
            "confidence_avg": assessment.confidence_avg,
            "scorecard": assessment.scorecard or {},
            "sources": assessment.sources or [],
            "public_summary": assessment.public_summary,
            "error_message": assessment.error_message,
            "last_run_at": assessment.last_run_at,
            "raw_evidence": assessment.raw_evidence or {},
        }

    # Inject components key if missing to support frontend rendering
    scorecard = dict(data.get("scorecard") or {})
    if scorecard and "components" not in scorecard and "confidence_breakdown" in scorecard:
        cb = scorecard["confidence_breakdown"]
        scorecard["components"] = {
            "digital_presence": {
                "label": "Digital Presence",
                "max_score": 3.5,
                "score": cb.get("digital_presence", {}).get("score", 0.0),
                "confidence": cb.get("digital_presence", {}).get("confidence", 1),
                "evidence": cb.get("digital_presence", {}).get("evidence", "")
            },
            "recruitment_signal": {
                "label": "Recruitment Signal",
                "max_score": 2.5,
                "score": cb.get("recruitment_signal", {}).get("score", 0.0),
                "confidence": cb.get("recruitment_signal", {}).get("confidence", 1),
                "evidence": cb.get("recruitment_signal", {}).get("evidence", "")
            },
            "public_visibility": {
                "label": "Public Visibility",
                "max_score": 4.0,
                "score": cb.get("public_visibility", {}).get("score", 0.0),
                "confidence": cb.get("public_visibility", {}).get("confidence", 1),
                "evidence": cb.get("public_visibility", {}).get("evidence", "")
            }
        }
        data["scorecard"] = scorecard

    if role != UserRole.ADMIN and str(role) != UserRole.ADMIN.value:
        data.pop("raw_evidence", None)

    return data


def validate_result_schema(data: dict) -> bool:
    required_fields = [
        "sme_id", "status", "alternative_score", 
        "confidence_breakdown", "scraped_at"
    ]
    if not all(f in data for f in required_fields):
        return False
    
    breakdown = data.get("confidence_breakdown", {})
    required_components = ["digital_presence", "recruitment_signal", "public_visibility"]
    if not all(c in breakdown for c in required_components):
        return False
    
    for component in required_components:
        comp_data = breakdown[component]
        if not all(k in comp_data for k in ["score", "confidence", "evidence"]):
            return False
    
    return True
