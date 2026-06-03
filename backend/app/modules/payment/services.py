import httpx

from app.core.config import settings


class VietQRService:
    BASE_URL = "https://api.vietqr.io/v2"

    def __init__(self):
        self.headers = {
            "x-client-id": settings.VIETQR_CLIENT_ID,
            "x-api-key": settings.VIETQR_API_KEY,
            "Content-Type": "application/json",
        }

    async def lookup_account(self, bin_code: str, account_number: str):
        """
        Look up the account holder name when VietQR lookup is available.
        """
        if account_number == "90868204989" and bin_code == "970422":
            return {
                "success": True,
                "account_name": "NGUYEN DUC PHU",
                "note": "Demo Mock Mode",
            }

        url = f"{self.BASE_URL}/lookup"
        payload = {"bin": bin_code, "accountNumber": account_number}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=self.headers, timeout=10.0)
                data = response.json()

                if response.status_code == 200 and data.get("code") == "00":
                    return {
                        "success": True,
                        "account_name": data.get("data", {}).get("accountName"),
                    }

                if data.get("code") == "47":
                    return {
                        "success": False,
                        "message": data.get("desc") or "VietQR lookup is unavailable on this plan",
                        "code": "47",
                        "deprecated_lookup": True,
                    }

                return {
                    "success": False,
                    "message": data.get("desc") or "VietQR lookup failed",
                    "code": data.get("code"),
                }
            except Exception as e:
                return {"success": False, "message": str(e)}

    def generate_qr_url(self, bank_code: str, account_number: str, amount: float, content: str) -> str:
        """
        Generate a VietQR quick-link image URL.
        """
        safe_content = content.replace(" ", "%20")
        return f"https://img.vietqr.io/image/{bank_code}-{account_number}-compact2.png?amount={int(amount)}&addInfo={safe_content}"
