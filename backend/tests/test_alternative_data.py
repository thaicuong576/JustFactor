import unittest
from unittest.mock import patch

from app.modules.auth.schemas import RegisterSMERequest
from app.modules.auth.models import UserRole
from app.modules.alternative_data.services import (
    AlternativeDataScoringService,
    build_public_scorecard,
    run_scraping_sync,
)


class AlternativeDataServiceTest(unittest.TestCase):
    def test_scores_mira_style_evidence_on_justfactor_scale(self):
        enrichment = {
            "company_identity": {
                "content": "Cong ty TNHH Alpha matches the submitted company profile.",
                "confidenceScore": 5,
                "source": "https://alpha.vn/about",
            },
            "business_profile": {
                "content": "Alpha provides B2B logistics and recurring supply services.",
                "confidenceScore": 4,
                "source": "https://alpha.vn/services",
            },
            "digital_legitimacy": {
                "content": "Website has About, Contact, Services and professional company domain.",
                "confidenceScore": 5,
                "source": "https://alpha.vn",
            },
            "linkedin_footprint": {
                "content": "LinkedIn company page lists employees, headquarters and recent posts.",
                "confidenceScore": 4,
                "source": "https://linkedin.com/company/alpha",
            },
            "operating_activity": {
                "content": "Recent customer updates and hiring page found.",
                "confidenceScore": 4,
                "source": "https://alpha.vn/news",
            },
            "reputation_risk": {
                "content": "No adverse news or conflicting claims found.",
                "confidenceScore": 4,
                "source": "https://news.example/search?q=alpha",
            },
            "source_quality": {
                "content": "First-party, LinkedIn and third-party evidence agree.",
                "confidenceScore": 5,
                "source": "https://alpha.vn",
            },
        }

        scorecard = AlternativeDataScoringService().score_enrichment(enrichment)

        self.assertEqual(scorecard["alternative_data_score"], 180)
        self.assertEqual(scorecard["fit_score"], 9.0)
        self.assertAlmostEqual(scorecard["confidence_avg"], 4.43, places=2)
        self.assertEqual(scorecard["components"]["identity_consistency"]["score"], 40)
        self.assertEqual(scorecard["components"]["source_quality"]["max_score"], 25)
        self.assertGreaterEqual(len(scorecard["sources"]), 5)

    def test_missing_and_low_confidence_evidence_lowers_score(self):
        enrichment = {
            "company_identity": {
                "content": "Company name appears on the website but address is not visible.",
                "confidenceScore": 3,
                "source": "https://beta.vn",
            },
            "digital_legitimacy": {
                "content": "Website is reachable but has limited business detail.",
                "confidenceScore": 2,
                "source": "https://beta.vn",
            },
        }

        scorecard = AlternativeDataScoringService().score_enrichment(enrichment)

        self.assertEqual(scorecard["alternative_data_score"], 31)
        self.assertEqual(scorecard["fit_score"], 1.6)
        self.assertEqual(scorecard["components"]["linkedin_footprint"]["score"], 0)
        self.assertEqual(scorecard["components"]["reputation_risk"]["confidence"], 0)

    def test_public_scorecard_redacts_raw_evidence_for_non_admin_roles(self):
        assessment = {
            "status": "COMPLETED",
            "scorecard": {"alternative_data_score": 120, "fit_score": 6.0},
            "raw_evidence": {"html": "<main>private crawl output</main>"},
            "error_message": None,
        }

        fi_view = build_public_scorecard(assessment, UserRole.FI)
        admin_view = build_public_scorecard(assessment, UserRole.ADMIN)

        self.assertNotIn("raw_evidence", fi_view)
        self.assertIn("raw_evidence", admin_view)


class AlternativeDataRegistrationSchemaTest(unittest.TestCase):
    def test_sme_registration_accepts_optional_website_and_linkedin(self):
        payload = RegisterSMERequest.model_validate(
            {
                "user": {
                    "email": "owner@alpha.vn",
                    "full_name": "Nguyen Van A",
                    "password": "secret123",
                },
                "sme": {
                    "tax_code": "0312345678",
                    "company_name": "Cong ty TNHH Alpha",
                    "address": "1 Nguyen Hue, Quan 1, TP HCM",
                    "company_website": "https://alpha.vn",
                    "linkedin_url": "https://www.linkedin.com/company/alpha",
                    "legal_rep_name": "Nguyen Van A",
                    "legal_rep_cccd": "012345678901",
                    "phone_number": "0901234567",
                    "business_license_path": "uploads/license.pdf",
                    "cccd_front_path": "uploads/front.jpg",
                    "cccd_back_path": "uploads/back.jpg",
                    "portrait_path": "uploads/portrait.jpg",
                },
            }
        )

        self.assertEqual(payload.sme.company_website, "https://alpha.vn")
        self.assertEqual(payload.sme.linkedin_url, "https://www.linkedin.com/company/alpha")


class AlternativeDataScrapingFallbackTest(unittest.TestCase):
    def test_first_party_careers_page_feeds_recruitment_signal_when_job_boards_are_empty(self):
        careers_link = "https://alpha.vn/tuyen-dung"

        with (
            patch(
                "app.modules.alternative_data.services.fetch_sme_website",
                return_value=("Alpha homepage content", [careers_link]),
            ),
            patch(
                "app.modules.alternative_data.services.search_ddg_queries",
                return_value=([], []),
            ),
            patch(
                "app.modules.alternative_data.services.fetch_first_party_recruitment_snippets",
                return_value=["First-party careers page lists Sales Executive openings."],
            ) as careers_fetch,
        ):
            _, _, rec_snippets, neg_snippets = run_scraping_sync(
                "Cong ty TNHH Alpha",
                "https://alpha.vn",
            )

        careers_fetch.assert_called_once_with([careers_link])
        self.assertEqual(
            rec_snippets,
            ["First-party careers page lists Sales Executive openings."],
        )
        self.assertEqual(neg_snippets, [])


if __name__ == "__main__":
    unittest.main()
