from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, timedelta
from app.routers.auth import get_current_active_user, User
from app.main import db
from google.cloud.firestore_v1.base_query import FieldFilter

router = APIRouter(prefix="/reporting", tags=["reporting"])


@router.get("/revenue")
async def get_revenue_report(
    start_date: str = Query(...),
    end_date: str = Query(...),
    current_user: User = Depends(get_current_active_user)
):
    """Generate revenue report for date range."""
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        
        # Get invoices in date range
        invoices_ref = db.collection("invoices")
        query = invoices_ref.where(
            filter=FieldFilter("createdAt", ">=", start)
        ).where(
            filter=FieldFilter("createdAt", "<=", end)
        )
        
        invoices = []
        for doc in query.stream():
            data = doc.to_dict()
            invoices.append(data)
        
        # Calculate totals
        total_revenue = sum(inv.get("total", 0) for inv in invoices)
        total_paid = sum(inv.get("paidAmount", 0) for inv in invoices)
        total_pending = total_revenue - total_paid
        
        # Group by type
        by_type = {}
        for inv in invoices:
            inv_type = inv.get("type", "Unknown")
            if inv_type not in by_type:
                by_type[inv_type] = {"count": 0, "total": 0}
            by_type[inv_type]["count"] += 1
            by_type[inv_type]["total"] += inv.get("total", 0)
        
        return {
            "period": {"start": start_date, "end": end_date},
            "summary": {
                "totalRevenue": total_revenue,
                "totalPaid": total_paid,
                "totalPending": total_pending,
                "invoiceCount": len(invoices),
            },
            "byType": by_type,
            "invoices": invoices[:100]  # Limit to 100 for response size
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate report: {str(e)}")


@router.get("/jobs")
async def get_jobs_report(
    start_date: str = Query(...),
    end_date: str = Query(...),
    current_user: User = Depends(get_current_active_user)
):
    """Generate jobs report for date range."""
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        
        # Get jobs in date range
        jobs_ref = db.collection("jobs")
        query = jobs_ref.where(
            filter=FieldFilter("createdAt", ">=", start)
        ).where(
            filter=FieldFilter("createdAt", "<=", end)
        )
        
        jobs = []
        for doc in query.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            jobs.append(data)
        
        # Calculate stats
        by_status = {}
        by_type = {}
        for job in jobs:
            status = job.get("status", "Unknown")
            job_type = job.get("type", "Unknown")
            
            by_status[status] = by_status.get(status, 0) + 1
            by_type[job_type] = by_type.get(job_type, 0) + 1
        
        return {
            "period": {"start": start_date, "end": end_date},
            "summary": {
                "totalJobs": len(jobs),
                "byStatus": by_status,
                "byType": by_type,
            },
            "jobs": jobs[:100]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate report: {str(e)}")


@router.get("/performance")
async def get_performance_report(
    start_date: str = Query(...),
    end_date: str = Query(...),
    current_user: User = Depends(get_current_active_user)
):
    """Generate performance report (crew utilization, etc.)."""
    try:
        # Get crews and their schedules
        crews_ref = db.collection("crews")
        crews = []
        for doc in crews_ref.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            crews.append(data)
        
        # Get schedules in date range
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        
        schedules_ref = db.collection("schedule")
        query = schedules_ref.where(
            filter=FieldFilter("date", ">=", start_date.split('T')[0])
        ).where(
            filter=FieldFilter("date", "<=", end_date.split('T')[0])
        )
        
        schedules = []
        for doc in query.stream():
            data = doc.to_dict()
            schedules.append(data)
        
        # Calculate utilization
        crew_utilization = {}
        for crew in crews:
            crew_schedules = [s for s in schedules if s.get("crewId") == crew["id"]]
            total_days = (end - start).days + 1
            scheduled_days = len(set(s.get("date") for s in crew_schedules))
            utilization = (scheduled_days / total_days * 100) if total_days > 0 else 0
            
            crew_utilization[crew["id"]] = {
                "name": crew.get("name"),
                "utilization": round(utilization, 2),
                "scheduledDays": scheduled_days,
                "totalDays": total_days,
            }
        
        return {
            "period": {"start": start_date, "end": end_date},
            "crewUtilization": crew_utilization,
            "totalSchedules": len(schedules),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate report: {str(e)}")


@router.get("/kpis")
async def get_kpi_metrics(
    current_user: User = Depends(get_current_active_user)
):
    """Get KPI metrics for dashboard."""
    try:
        # Get date range (last 30 days)
        end = datetime.utcnow()
        start = end - timedelta(days=30)
        
        # Total Revenue
        invoices_ref = db.collection("invoices")
        invoices_query = invoices_ref.where(
            filter=FieldFilter("createdAt", ">=", start.isoformat())
        ).where(
            filter=FieldFilter("createdAt", "<=", end.isoformat())
        )
        invoices = [doc.to_dict() for doc in invoices_query.stream()]
        total_revenue = sum(inv.get("total", 0) for inv in invoices)
        
        # Active Jobs
        jobs_ref = db.collection("jobs")
        all_jobs = list(jobs_ref.stream())
        active_jobs = [doc for doc in all_jobs if doc.to_dict().get("workflowState") != "closed"]
        
        completed_jobs = [
            doc for doc in all_jobs 
            if doc.to_dict().get("workflowState") == "closed" 
            and doc.to_dict().get("closedAt", "") >= start.isoformat()
        ]
        
        # Crew Utilization
        crews_ref = db.collection("crews")
        crews = [doc.to_dict() for doc in crews_ref.stream()]
        schedules_ref = db.collection("schedule")
        schedules = [doc.to_dict() for doc in schedules_ref.stream()]
        
        total_crew_days = len(crews) * 30
        scheduled_days = len(set(s.get("date") for s in schedules if s.get("date")))
        crew_utilization = (scheduled_days / total_crew_days * 100) if total_crew_days > 0 else 0
        
        # Compliance Rate (JSA completion)
        jsa_ref = db.collection("tech_jsa")
        jsas = list(jsa_ref.stream())
        total_jobs_count = len(active_jobs) + len(completed_jobs)
        jsa_completion_rate = (len(jsas) / total_jobs_count * 100) if total_jobs_count > 0 else 0
        
        return {
            "totalRevenue": round(total_revenue, 2),
            "activeJobs": len(active_jobs),
            "completedJobs": len(completed_jobs),
            "crewUtilization": round(crew_utilization, 2),
            "complianceRate": round(jsa_completion_rate, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get KPIs: {str(e)}")


@router.get("/compliance")
async def get_compliance_report(
    start_date: str = Query(...),
    end_date: str = Query(...),
    current_user: User = Depends(get_current_active_user)
):
    """Generate compliance report (JSA completion, safety, etc.)."""
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        
        # Get jobs in date range
        jobs_ref = db.collection("jobs")
        jobs_query = jobs_ref.where(
            filter=FieldFilter("createdAt", ">=", start.isoformat())
        ).where(
            filter=FieldFilter("createdAt", "<=", end.isoformat())
        )
        jobs_docs = list(jobs_query.stream())
        jobs = [doc.to_dict() for doc in jobs_docs]
        job_ids = [doc.id for doc in jobs_docs]
        
        # Get JSAs
        jsa_ref = db.collection("tech_jsa")
        jsas = []
        for job_id in job_ids:
            jsa_query = jsa_ref.where(filter=FieldFilter("jobId", "==", job_id))
            jsas.extend([doc.to_dict() for doc in jsa_query.stream()])
        
        # Calculate compliance
        total_jobs = len(jobs)
        jsas_completed = len(jsas)
        jsa_completion_rate = (jsas_completed / total_jobs * 100) if total_jobs > 0 else 0
        missing_jsas = total_jobs - jsas_completed
        
        # Find non-compliant jobs
        jobs_with_jsa = set(jsa.get("jobId") for jsa in jsas)
        non_compliant_jobs = [
            {
                "id": job_id,
                "reason": "Missing JSA"
            }
            for job_id in job_ids if job_id not in jobs_with_jsa
        ]
        
        # Document compliance (placeholder - would check for required documents)
        document_compliance = 85.0  # Placeholder
        
        return {
            "period": {"start": start_date, "end": end_date},
            "jsaCompletionRate": round(jsa_completion_rate, 2),
            "jsasCompleted": jsas_completed,
            "totalJobs": total_jobs,
            "missingJSAs": missing_jsas,
            "documentCompliance": document_compliance,
            "nonCompliantJobs": non_compliant_jobs[:50],  # Limit to 50
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate compliance report: {str(e)}")


@router.get("/{report_type}/export")
async def export_report(
    report_type: str,
    start_date: str = Query(...),
    end_date: str = Query(...),
    format: str = Query("csv"),
    current_user: User = Depends(get_current_active_user)
):
    """Export report as CSV."""
    from fastapi.responses import Response
    import csv
    import io
    
    try:
        # Get report data based on type
        if report_type == "revenue":
            report_data = await get_revenue_report(start_date, end_date, current_user)
            rows = [
                ["Invoice Number", "Customer", "Type", "Total", "Paid", "Balance Due", "Status", "Date"]
            ]
            for inv in report_data.get("invoices", []):
                rows.append([
                    inv.get("invoiceNumber", ""),
                    inv.get("customerName", ""),
                    inv.get("type", ""),
                    str(inv.get("total", 0)),
                    str(inv.get("paidAmount", 0)),
                    str(inv.get("balanceDue", 0)),
                    inv.get("status", ""),
                    str(inv.get("createdAt", "")),
                ])
        elif report_type == "jobs":
            report_data = await get_jobs_report(start_date, end_date, current_user)
            rows = [
                ["Job ID", "Customer", "Status", "Type", "Created Date"]
            ]
            for job in report_data.get("jobs", []):
                rows.append([
                    job.get("id", ""),
                    job.get("customerName", ""),
                    job.get("workflowState", ""),
                    job.get("type", ""),
                    str(job.get("createdAt", "")),
                ])
        elif report_type == "performance":
            report_data = await get_performance_report(start_date, end_date, current_user)
            rows = [
                ["Crew ID", "Crew Name", "Utilization %", "Scheduled Days", "Total Days"]
            ]
            for crew_id, data in report_data.get("crewUtilization", {}).items():
                rows.append([
                    crew_id,
                    data.get("name", ""),
                    str(data.get("utilization", 0)),
                    str(data.get("scheduledDays", 0)),
                    str(data.get("totalDays", 0)),
                ])
        elif report_type == "compliance":
            report_data = await get_compliance_report(start_date, end_date, current_user)
            rows = [
                ["Job ID", "Reason", "Status"]
            ]
            for job in report_data.get("nonCompliantJobs", []):
                rows.append([
                    job.get("id", ""),
                    job.get("reason", ""),
                    "Non-Compliant"
                ])
        else:
            raise HTTPException(status_code=400, detail="Invalid report type")
        
        # Generate CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerows(rows)
        csv_content = output.getvalue()
        output.close()
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={report_type}_report_{start_date}_{end_date}.csv"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to export report: {str(e)}")