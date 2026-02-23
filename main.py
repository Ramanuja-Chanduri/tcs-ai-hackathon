"""TradeSummaryAI — FastAPI application entry point.

Serves the frontend, handles trade data uploads, and exposes
summary / metrics / ticker / domain query endpoints.
"""

import uuid

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.database import get_db, get_metrics_by_session, get_summary, init_db
from src.models import (
    DomainsResponse,
    MetricItem,
    MetricsResponse,
    SummaryResponse,
    TickersResponse,
    UploadResponse,
)
from src.pipeline import run_pipeline

app = FastAPI(title="TradeSummaryAI", version="1.0.0")

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.on_event("startup")
async def startup() -> None:
    init_db()


@app.get("/")
async def root():
    return FileResponse("static/index.html")


@app.post("/api/upload", response_model=UploadResponse)
async def upload(file: UploadFile = File(...)):
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in ("csv", "json"):
        raise HTTPException(status_code=400, detail="Only CSV and JSON files supported")

    session_id = str(uuid.uuid4())
    contents = await file.read()

    result = await run_pipeline(contents, ext, session_id)

    return UploadResponse(
        session_id=session_id,
        status="success",
        trade_count=result["trade_count"],
        tickers=result["tickers"],
        domains=result["domains"],
    )


@app.get("/api/summary/overall/{session_id}", response_model=SummaryResponse)
async def summary_overall(session_id: str):
    row = get_summary(session_id, "overall")
    if not row:
        raise HTTPException(status_code=404, detail="Summary not found")
    return SummaryResponse(
        summary=row["summary_text"],
        summary_type="overall",
        reference_id=row.get("reference_id"),
    )


@app.get("/api/summary/ticker/{session_id}/{ticker}", response_model=SummaryResponse)
async def summary_ticker(session_id: str, ticker: str):
    row = get_summary(session_id, "ticker", reference_id=ticker.upper())
    if not row:
        raise HTTPException(status_code=404, detail="Summary not found")
    return SummaryResponse(
        summary=row["summary_text"],
        summary_type="ticker",
        reference_id=row.get("reference_id"),
    )


@app.get("/api/summary/domain/{session_id}/{domain}", response_model=SummaryResponse)
async def summary_domain(session_id: str, domain: str):
    row = get_summary(session_id, "domain", reference_id=domain)
    if not row:
        raise HTTPException(status_code=404, detail="Summary not found")
    return SummaryResponse(
        summary=row["summary_text"],
        summary_type="domain",
        reference_id=row.get("reference_id"),
    )



@app.get("/api/metrics/{session_id}", response_model=MetricsResponse)
async def metrics(session_id: str):
    rows = get_metrics_by_session(session_id)
    return MetricsResponse(
        metrics=[MetricItem(**r) for r in rows],
    )


@app.get("/api/tickers/{session_id}", response_model=TickersResponse)
async def tickers(session_id: str):
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT DISTINCT ticker FROM raw_trades WHERE session_id = ?",
            (session_id,),
        ).fetchall()
        return TickersResponse(tickers=[r["ticker"] for r in rows])
    finally:
        conn.close()


@app.get("/api/domains/{session_id}", response_model=DomainsResponse)
async def domains(session_id: str):
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT DISTINCT domain FROM raw_trades WHERE session_id = ?",
            (session_id,),
        ).fetchall()
        return DomainsResponse(domains=[r["domain"] for r in rows])
    finally:
        conn.close()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
