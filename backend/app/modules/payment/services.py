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

    def generate_qr_url(self, bank_short_name: str, account_number: str, amount: float, content: str) -> str:
        """
        Generate a SePay QR image URL.
        SePay docs: https://qr.sepay.vn/img?acc={acc}&bank={bank}&amount={amount}&des={des}
        bank must be the SePay short_name (e.g. "MBBank"), not the VietQR BIN code.
        """
        import urllib.parse
        safe_content = urllib.parse.quote(content, safe="")
        return f"https://qr.sepay.vn/img?acc={account_number}&bank={bank_short_name}&amount={int(amount)}&des={safe_content}"
