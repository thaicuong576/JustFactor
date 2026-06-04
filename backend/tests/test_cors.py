import unittest

from fastapi.testclient import TestClient

from app.main import app


class CorsTest(unittest.TestCase):
    def test_allows_localhost_dev_ports(self):
        client = TestClient(app)

        response = client.options(
            "/api/v1/chatbot/chat",
            headers={
                "Origin": "http://localhost:5174",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:5174")


if __name__ == "__main__":
    unittest.main()
