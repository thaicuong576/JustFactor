import subprocess
import sys
import unittest
from pathlib import Path


class SettingsTest(unittest.TestCase):
    def test_settings_loads_backend_env_file_from_any_working_directory(self):
        project_root = Path(__file__).resolve().parents[2]

        result = subprocess.run(
            [
                sys.executable,
                "-c",
                (
                    "import os, sys; "
                    "os.environ.pop('DATABASE_URL', None); "
                    "sys.path.insert(0, 'backend'); "
                    "from app.core.config import settings; "
                    "print(bool(settings.DATABASE_URL))"
                ),
            ],
            cwd=project_root,
            capture_output=True,
            text=True,
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "True")


if __name__ == "__main__":
    unittest.main()
