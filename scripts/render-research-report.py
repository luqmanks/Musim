"""Render the MUSIM Markdown research report as a print-ready PDF."""

from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import markdown


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "RESEARCH_REPORT.md"
OUTPUT = ROOT / "docs" / "MUSIM_RESEARCH_REPORT.pdf"


def find_browser() -> Path:
    candidates = [
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    for executable in ("msedge", "chrome", "chromium", "chromium-browser"):
        resolved = shutil.which(executable)
        if resolved:
            return Path(resolved)

    raise RuntimeError("Microsoft Edge, Chrome, or Chromium is required to render the PDF.")


def build_html(source: str) -> str:
    body = markdown.markdown(
        source,
        extensions=["tables", "sane_lists", "smarty"],
        output_format="html5",
    )
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MUSIM Research Report</title>
  <style>
    @page {{ size: A4; margin: 16mm 17mm 17mm; }}
    * {{ box-sizing: border-box; }}
    html {{ background: #fff; }}
    body {{
      margin: 0 auto;
      max-width: 178mm;
      color: #142a27;
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 9.4pt;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
    body::before {{
      content: "MUSIM  /  NASA SPACE APPS 2026";
      display: block;
      margin-bottom: 14mm;
      color: #527c27;
      font-size: 8pt;
      font-weight: 750;
      letter-spacing: 0.14em;
    }}
    h1 {{
      max-width: 150mm;
      margin: 0 0 4mm;
      color: #102f2d;
      font-size: 27pt;
      line-height: 1.05;
      letter-spacing: -0.025em;
    }}
    h2 {{
      margin: 6.2mm 0 2.3mm;
      padding-bottom: 1.4mm;
      border-bottom: 1.5px solid #a6ce39;
      color: #173f3b;
      font-size: 15.5pt;
      line-height: 1.15;
      break-after: avoid;
    }}
    h3 {{
      margin: 4.5mm 0 1.5mm;
      color: #50752c;
      font-size: 11.5pt;
      line-height: 1.2;
      break-after: avoid;
    }}
    h1 + h2 {{
      display: inline-block;
      margin: 0 0 4mm;
      padding: 1.3mm 3mm;
      border: 0;
      border-radius: 999px;
      background: #edf4dc;
      color: #50752c;
      font-size: 8.5pt;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }}
    h1 + h2 + h3 {{ margin-top: 2mm; color: #173f3b; }}
    p {{ margin: 0 0 2.5mm; orphans: 3; widows: 3; }}
    ul, ol {{ margin: 1.5mm 0 3mm; padding-left: 6mm; }}
    li {{ margin-bottom: 1mm; }}
    h2 + ol {{
      columns: 2;
      column-gap: 8mm;
      font-size: 8pt;
      line-height: 1.22;
    }}
    h2 + ol li {{
      margin: 0 0 0.8mm;
      padding-right: 2mm;
      break-inside: avoid-column;
    }}
    strong {{ color: #173f3b; }}
    a {{ color: #2c655e; text-decoration: none; }}
    blockquote {{
      margin: 3mm 0;
      padding: 2.5mm 4mm;
      border-left: 3px solid #a6ce39;
      background: #f4f7ed;
    }}
    table {{
      width: 100%;
      margin: 3mm 0 4mm;
      border-collapse: collapse;
      font-size: 8.45pt;
      line-height: 1.32;
      break-inside: avoid;
    }}
    thead {{ display: table-header-group; }}
    th {{
      padding: 2.1mm 2.4mm;
      background: #173f3b;
      color: #fff;
      text-align: left;
      font-weight: 700;
    }}
    td {{
      padding: 1.9mm 2.4mm;
      border-bottom: 1px solid #d9e1d5;
      vertical-align: top;
    }}
    tbody tr:nth-child(even) {{ background: #f4f7ed; }}
    th:nth-child(2), td:nth-child(2) {{ white-space: nowrap; }}
    hr {{ border: 0; border-top: 1px solid #d9e1d5; }}
    h2, h3, table, li {{ break-inside: avoid; }}
    @media print {{
      a {{ color: #24574f; }}
      h2 {{ break-before: auto; }}
    }}
  </style>
</head>
<body>{body}</body>
</html>
"""


def main() -> int:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Report not found: {SOURCE}")

    browser = find_browser()
    html = build_html(SOURCE.read_text(encoding="utf-8"))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="musim-report-") as temp_dir:
        html_path = Path(temp_dir) / "report.html"
        profile_path = Path(temp_dir) / "browser-profile"
        html_path.write_text(html, encoding="utf-8")
        command = [
            str(browser),
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            "--allow-file-access-from-files",
            f"--user-data-dir={profile_path}",
            f"--print-to-pdf={OUTPUT}",
            html_path.resolve().as_uri(),
        ]
        result = subprocess.run(command, check=False, capture_output=True, text=True)
        if result.returncode != 0 or not OUTPUT.exists():
            details = result.stderr.strip() or result.stdout.strip()
            raise RuntimeError(f"Browser PDF rendering failed: {details}")

    print(f"Created {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
