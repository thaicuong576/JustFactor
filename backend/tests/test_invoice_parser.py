from decimal import Decimal
import unittest

from app.modules.invoice.parser import InvoiceParser


class InvoiceParserTest(unittest.TestCase):
    def test_parses_total_amount_from_alternate_total_tags(self):
        xml = b"""
        <HDon>
          <DLHDon>
            <TTChung>
              <KHHDon>C26TAA</KHHDon>
              <KHMSHDon>1</KHMSHDon>
              <SHDon>900002</SHDon>
              <NLap>2026-06-04</NLap>
              <DVTTe>VND</DVTTe>
            </TTChung>
            <NDHDon>
              <NBan><MST>0318770868</MST><Ten>UDD Labs</Ten></NBan>
              <NMua><MST>0312345678</MST><Ten>Buyer Test Company</Ten></NMua>
              <TToan><TgTToan>1,234,567</TgTToan></TToan>
            </NDHDon>
          </DLHDon>
        </HDon>
        """

        parsed = InvoiceParser(xml).parse()

        self.assertEqual(parsed["total_amount"], Decimal("1234567"))


if __name__ == "__main__":
    unittest.main()
