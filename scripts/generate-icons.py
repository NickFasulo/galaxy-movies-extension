#!/usr/bin/env python3
# Thin wrapper — the badge render lives in the main repo so the extension
# icons and the site favicon can't drift. Needs ../galaxy-movies checked out.
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
GEN = REPO.parent / 'galaxy-movies' / 'scripts' / 'generate-brandmark.py'

sys.exit(subprocess.call([sys.executable, str(GEN), '--extension-dir', str(REPO)]))
