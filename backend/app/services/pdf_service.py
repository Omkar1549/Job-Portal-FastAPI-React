import os
import re
from typing import Optional


class PDFService:
    """
    Extracts plain text from PDF files.

    Uses PyPDF2 for standard PDFs.
    Falls back gracefully if a PDF is scanned/image-only
    (returns empty string — AI analysis will skip those).

    For production, consider adding:
    - pdfplumber for better layout preservation
    - pytesseract + pdf2image for OCR on scanned PDFs
    """

    def extract_text(self, pdf_path: str) -> Optional[str]:
        """
        Extract all text from a PDF file.

        Args:
            pdf_path: Absolute or relative path to the PDF file.

        Returns:
            Extracted text as a single string, or None on failure.
        """
        try:
            import PyPDF2

            text_parts = []

            with open(pdf_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)

                for page_num, page in enumerate(reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text_parts.append(page_text)
                    except Exception as e:
                        # Skip pages that fail to extract (e.g. encrypted pages)
                        print(f"Warning: Could not extract page {page_num}: {e}")
                        continue

            if not text_parts:
                print(f"Warning: No text extracted from {pdf_path} — may be a scanned PDF")
                return None

            raw_text = "\n\n".join(text_parts)
            return self._clean_text(raw_text)

        except ImportError:
            raise RuntimeError(
                "PyPDF2 not installed. Run: pip install PyPDF2"
            )
        except FileNotFoundError:
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        except Exception as e:
            print(f"Error extracting PDF text: {e}")
            return None

    def _clean_text(self, text: str) -> str:
        """
        Post-process extracted text:
        - Remove excessive whitespace and blank lines
        - Fix common PDF extraction artifacts (broken words, odd chars)
        - Normalize line endings
        """
        # Normalize whitespace
        text = re.sub(r'\r\n', '\n', text)          # Windows line endings
        text = re.sub(r'\r', '\n', text)            # Old Mac line endings
        text = re.sub(r'[ \t]+', ' ', text)         # Multiple spaces → single
        text = re.sub(r'\n{3,}', '\n\n', text)      # 3+ blank lines → 2
        text = re.sub(r'[^\x20-\x7E\n]', ' ', text) # Remove non-ASCII garbage

        return text.strip()

    def get_metadata(self, pdf_path: str) -> dict:
        """
        Extract PDF metadata (author, title, creation date, page count).
        Useful for basic validation and display.
        """
        try:
            import PyPDF2
            with open(pdf_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                meta = reader.metadata or {}
                return {
                    "page_count": len(reader.pages),
                    "title":      meta.get("/Title", ""),
                    "author":     meta.get("/Author", ""),
                    "created":    meta.get("/CreationDate", ""),
                }
        except Exception:
            return {"page_count": 0}


# ── Singleton instance ────────────────────────────────
pdf_service = PDFService()