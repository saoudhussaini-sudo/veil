import os
import csv
import json
import time
import statistics
import logging
from typing import Dict, Any, List, Optional, Tuple
from app.services.local_ai_service import local_ai_service
import openpyxl

logger = logging.getLogger("veil.services.analysis")

class AnalysisService:
    """
    Deterministic local structured data analysis (CSV, XLSX, JSON, XML).
    Performs deterministic calculations (sum, average, count, min, max, filtering)
    and uses Local AI to explain and contextualize the findings.
    """
    async def analyze_structured_data(
        self,
        file_path: str,
        filename: str,
        file_ext: str,
        query: str
    ) -> Tuple[str, Dict[str, Any], float]:
        """
        Executes local data analysis.
        Returns: (answer_text, data_metrics, latency_ms)
        """
        start = time.perf_counter()
        ext = file_ext.lower().lstrip(".")

        headers: List[str] = []
        rows: List[Dict[str, Any]] = []

        # 1. Parse structured data
        if ext in ["csv", "tsv"]:
            delimiter = "\t" if ext == "tsv" else ","
            try:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    reader = csv.reader(f, delimiter=delimiter)
                    raw_rows = list(reader)
                    if raw_rows:
                        headers = [h.strip() for h in raw_rows[0]]
                        for r in raw_rows[1:]:
                            if any(r):
                                row_dict = {}
                                for idx, val in enumerate(r):
                                    if idx < len(headers):
                                        row_dict[headers[idx]] = val.strip()
                                rows.append(row_dict)
            except Exception as e:
                logger.error(f"Error reading CSV {filename}: {e}")

        elif ext in ["xlsx", "xls"]:
            try:
                wb = openpyxl.load_workbook(file_path, data_only=True, read_only=True)
                sheet = wb.active
                raw_rows = []
                for row in sheet.iter_rows(values_only=True):
                    if any(row):
                        raw_rows.append([str(c) if c is not None else "" for c in row])
                wb.close()
                if raw_rows:
                    headers = [str(h).strip() for h in raw_rows[0]]
                    for r in raw_rows[1:]:
                        row_dict = {}
                        for idx, val in enumerate(r):
                            if idx < len(headers):
                                row_dict[headers[idx]] = str(val).strip()
                        rows.append(row_dict)
            except Exception as e:
                logger.error(f"Error reading Excel {filename}: {e}")

        elif ext == "json":
            try:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    data = json.load(f)
                    if isinstance(data, list) and data and isinstance(data[0], dict):
                        headers = list(data[0].keys())
                        rows = data
                    elif isinstance(data, dict):
                        headers = list(data.keys())
                        rows = [data]
            except Exception as e:
                logger.error(f"Error reading JSON {filename}: {e}")

        # 2. Extract numeric columns & calculate metrics
        numeric_columns: Dict[str, List[float]] = {}
        for h in headers:
            vals = []
            for r in rows:
                raw_v = r.get(h, "")
                cleaned_v = str(raw_v).replace("$", "").replace(",", "").strip()
                try:
                    vals.append(float(cleaned_v))
                except ValueError:
                    pass
            if len(vals) > max(1, int(len(rows) * 0.4)):
                numeric_columns[h] = vals

        q_lower = query.lower()
        stats_summary = []
        computed_metrics: Dict[str, Any] = {
            "total_rows": len(rows),
            "columns": headers,
            "numeric_columns": list(numeric_columns.keys())
        }

        # Perform targeted mathematical computations
        matched_col = None
        for col_name in numeric_columns:
            if col_name.lower() in q_lower:
                matched_col = col_name
                break
        
        # If no column name explicitly in query, evaluate all numeric columns
        cols_to_compute = [matched_col] if matched_col else list(numeric_columns.keys())

        for col in cols_to_compute:
            vals = numeric_columns[col]
            avg_v = round(statistics.mean(vals), 2)
            sum_v = round(sum(vals), 2)
            min_v = round(min(vals), 2)
            max_v = round(max(vals), 2)
            stats_summary.append(
                f"- **{col}**: Average = {avg_v}, Total = {sum_v}, Min = {min_v}, Max = {max_v} (across {len(vals)} data points)"
            )
            computed_metrics[col] = {
                "average": avg_v,
                "sum": sum_v,
                "min": min_v,
                "max": max_v,
                "count": len(vals)
            }

        # 3. Generate Local AI synthesis
        summary_text = f"Dataset '{filename}' ({len(rows)} records, {len(headers)} columns):\n" + "\n".join(stats_summary)
        prompt = f"""You are analyzing the local dataset '{filename}'.

Computed Data Metrics:
{summary_text}

User Query:
{query}

Provide a concise, direct explanation of the computed results. State the exact numeric findings clearly."""

        ai_answer, _, provider, model = await local_ai_service.generate(prompt=prompt)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

        final_answer = f"### Data Analysis: `{filename}`\n\n{ai_answer}\n\n**Computed Metrics**:\n" + "\n".join(stats_summary)
        return final_answer, computed_metrics, elapsed_ms

analysis_service = AnalysisService()
