from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.modules.invoice import models as inv_models
from app.modules.scoring import models as score_models
from app.modules.sme import models as sme_models
from app.modules.alternative_data import models as alt_models

class ScoringService:
    def __init__(self, db: AsyncSession):
        self.db = db
    async def match_fi_rules(self, credit_score: score_models.CreditScore):
        """
        Tìm các FI phù hợp với hồ sơ này dựa trên Risk Config của họ
        """
        from app.modules.fi.models import FinancialInstitution
        
        # Lấy tất cả FI
        fis = await self.db.execute(select(FinancialInstitution))
        fis = fis.scalars().all()
        
        matched_fis = []
        
        for fi in fis:
            config = fi.risk_config or {}
            
            # Rule 1: Điểm tối thiểu
            min_score = config.get("min_score", 0)
            if credit_score.total_score < min_score:
                continue # Loại
                
            # Rule 2: Hạng tối thiểu
            accepted_grades = config.get("accepted_grades", ["A", "B", "C"])
            if credit_score.grade.value not in accepted_grades:
                continue
                
            matched_fis.append(fi.name)
            
        return matched_fis
    
    async def calculate_score(self, invoice_id: int):
        # 1. Lấy dữ liệu Hóa đơn + Documents
        invoice = await self.db.get(inv_models.Invoice, invoice_id)
        if not invoice:
            raise ValueError("Invoice not found")
        
        # Lấy SME profile để tính tuổi đời
        sme = await self.db.get(sme_models.SME, invoice.sme_id)
        
        # Lấy Documents
        docs_result = await self.db.execute(select(inv_models.InvoiceDocument).where(inv_models.InvoiceDocument.invoice_id == invoice_id))
        documents = docs_result.scalars().all()

        # --- KHỐI 1: ĐÁNH GIÁ BÊN NỢ (BUYER) - Max 400đ ---
        # Input: "Thông tin bên nợ hóa đơn"
        score_buyer = 0
        ver_details = invoice.verification_details or {}
        buyer_kyb = ver_details.get("buyer_kyb_check")
        
        if buyer_kyb == "ACTIVE":
            score_buyer = 400
        elif buyer_kyb == "NOT_FOUND":
            score_buyer = 0 # Rủi ro cao
        else:
            score_buyer = 200 # Không xác định (API lỗi), cho điểm trung bình

        # --- KHỐI 2: ĐÁNH GIÁ HÓA ĐƠN (INVOICE) - Max 300đ ---
        # Input: "Hoá đơn hợp lệ" + Documents
        score_invoice = 0
        doc_count = len(documents)
        
        # Có đủ Hợp đồng + Biên bản -> Uy tín
        if doc_count >= 2: 
            score_invoice = 300
        elif doc_count == 1:
            score_invoice = 150
        
        # Trừ điểm nếu hóa đơn quá nhỏ hoặc quá lớn (bất thường)
        # Ví dụ: Hóa đơn > 10 tỷ mà SME mới thành lập -> Rủi ro
        if invoice.total_amount and invoice.total_amount > 10_000_000_000:
             score_invoice -= 50

        # --- KHỐI 3: ALTERNATIVE DATA SME - Max 200đ ---
        # Input: website, LinkedIn, public company footprint, source confidence
        alt_result = await self.db.execute(
            select(alt_models.AlternativeDataAssessment).where(
                alt_models.AlternativeDataAssessment.sme_id == invoice.sme_id
            )
        )
        alt_assessment = alt_result.scalar_one_or_none()
        if alt_assessment and alt_assessment.status == alt_models.AlternativeDataStatus.COMPLETED:
            alt_scorecard = alt_assessment.scorecard or {}
            alt_components = alt_scorecard.get("components", {})
            if not alt_components and alt_scorecard.get("confidence_breakdown"):
                alt_components = alt_scorecard["confidence_breakdown"]
            score_sme = alt_assessment.alternative_data_score
            alt_details = {
                "status": alt_assessment.status.value,
                "alternative_data_score": alt_assessment.alternative_data_score,
                "fit_score": alt_assessment.fit_score,
                "confidence_avg": alt_assessment.confidence_avg,
                "components": alt_components,
            }
        else:
            score_sme = 100
            alt_details = {
                "status": alt_assessment.status.value if alt_assessment else "NOT_RUN",
                "alternative_data_score": score_sme,
                "fit_score": 5.0,
                "confidence_avg": 0.0,
                "components": {},
                "note": "Neutral alternative data score used while assessment is unavailable.",
            }

        # --- KHỐI 4: TÓM TẮT TÍN DỤNG (CIC) - Max 100đ ---
        # Input: "Tóm tắt tín dụng" -> MVP dùng Mock
        # Giả sử SME không có nợ xấu
        score_cic = 100

        # --- TỔNG HỢP ---
        total_score = score_buyer + score_invoice + score_sme + score_cic
        
        # Xếp hạng (Grade)
        if total_score >= 800:
            grade = score_models.RiskGrade.A
            funding_rate = 0.85 # 85%
            explanation = "Hạng A: Rủi ro rất thấp. Bên mua uy tín, hồ sơ đầy đủ."
        elif total_score >= 600:
            grade = score_models.RiskGrade.B
            funding_rate = 0.75 # 75%
            explanation = "Hạng B: Rủi ro thấp. Hồ sơ đạt chuẩn."
        else:
            grade = score_models.RiskGrade.C
            funding_rate = 0.60 # 60%
            explanation = "Hạng C: Rủi ro trung bình/cao. Cần thẩm định thêm."

        # 1. Kiểm tra xem đã có điểm chưa
        stmt = select(score_models.CreditScore).where(score_models.CreditScore.invoice_id == invoice_id)
        result = await self.db.execute(stmt)
        existing_score = result.scalar_one_or_none()

        if existing_score:
            # UPDATE: Nếu có rồi thì cập nhật lại điểm mới
            existing_score.total_score = total_score
            existing_score.grade = grade
            existing_score.recommended_funding_rate = funding_rate
            existing_score.score_details = {
                "buyer_score": score_buyer,
                "invoice_score": score_invoice,
                "alternative_data_score": score_sme,
                "alternative_data": alt_details,
                "cic_score": score_cic
            }
            existing_score.explanation = explanation
            # Không cần db.add(), SQLAlchemy tự track thay đổi
            score_record = existing_score
        else:
            # INSERT: Nếu chưa có thì tạo mới
            score_record = score_models.CreditScore(
                invoice_id=invoice_id,
                total_score=total_score,
                grade=grade,
                recommended_funding_rate=funding_rate,
                score_details={
                    "buyer_score": score_buyer,
                    "invoice_score": score_invoice,
                    "alternative_data_score": score_sme,
                    "alternative_data": alt_details,
                    "cic_score": score_cic
                },
                explanation=explanation
            )
            self.db.add(score_record)
        
        await self.db.commit()
        await self.db.refresh(score_record)
        
        return score_record
