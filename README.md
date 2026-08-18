# AKSO Procurement — Document matching demo

Self-contained partner/client demo: unstructured PO, order confirmation, delivery note, and invoice documents become structured data, with confidence-based routing and a simple “talk to your data” dashboard.

No backend and no live LLM. Extraction, confidence, and matching are pre-scripted so the demo is repeatable.

## Run

```bash
npm install
npm run dev
```

Open the local URL Vite prints (typically `http://localhost:5173`).

## Live demo script

1. **Intake** — Click **Simulate email intake** (or drop any files / click the drop zone). Shared inbox is `purchasing@akso.no`. The sample batch is 1,000 documents.
2. **Processing** — Watch extraction. Flagged files land in Review; orders start to fill in.
3. **Review** — Open a document (preview on the right). Click **Run confidence-based mapping** (OCR + 10 LLMs). Scores appear on each row. **Approve all ≥ 80%**, then **Check orders**.
4. **Orders** — Filter by stage or **Missing document**. PO-2026-0918 has no delivery note. Remaining mismatches (amount/qty) are the second check after review.
5. **Ask data** — Try “What’s our total spend with Nordisk Stål?” or the chips for volume and average unit price.
6. **Reset demo** in the header and repeat.

## What is simulated

- Document contents are CSS previews, not parsed PDFs.
- Confidence and order stage (PO created → confirmed → delivered → invoiced) are derived from the sample documents. Amount and quantity mismatches are pre-authored so review is easy to show.
- Natural-language questions are keyword-matched to three canned analytics views (no SQL, no model).
