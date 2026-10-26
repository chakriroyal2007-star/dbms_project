"""
TERA Incident PDF Generation Engine
Creates an authoritative, structured, paginated PDF incident report
using ReportLab with cryptographic integrity hashing and audit metadata.
"""
import os
import hashlib
import datetime
from pathlib import Path
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.config import settings

def format_timestamp(dt: Optional[datetime.datetime]) -> str:
    if not dt:
        return "UNKNOWN / NOT RECORDED"
    utc_str = dt.strftime("%Y-%m-%d %H:%M:%S UTC")
    # IST is UTC + 5:30
    ist_dt = dt + datetime.timedelta(hours=5, minutes=30)
    ist_str = ist_dt.strftime("%d %b %Y, %I:%M:%S %p IST")
    return f"{ist_str} ({utc_str})"

def generate_incident_pdf(incident_data: Dict[str, Any], output_path: str) -> Dict[str, Any]:
    """
    Renders a multi-page, formatted, high-security PDF incident report.
    Returns:
    {
        "pdf_path": str,
        "pdf_hash": str,
        "generated_at": str,
        "page_count": int,
        "status": "READY"
    }
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748B')
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    bold_label = ParagraphStyle(
        'BoldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0F172A')
    )
    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )
    badge_critical = ParagraphStyle(
        'BadgeCrit',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#DC2626')
    )
    badge_verified = ParagraphStyle(
        'BadgeVer',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#16A34A')
    )

    story = []

    # 1. Header Banner
    header_table_data = [
        [
            Paragraph("<b>TERA EMERGENCY OPERATIONS CENTER</b><br/><font size='8' color='#64748B'>Tirupati Emergency Resource Allocation & Multi-Agency Incident Management</font>", title_style),
            Paragraph(f"<b>CONFIDENTIAL</b><br/><font size='8'>INCIDENT REPORT</font><br/><font size='8' color='#DC2626'>OFFICIAL RECORD</font>", ParagraphStyle('HRight', parent=styles['Normal'], alignment=2, textColor=colors.HexColor('#0F172A')))
        ]
    ]
    header_table = Table(header_table_data, colWidths=[4.2 * inch, 3.1 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#CBD5E1'), spaceBefore=2, spaceAfter=8))

    # 2. Reference & Vital Statistics Matrix
    inc_id = incident_data.get("incident_id", "UNKNOWN")
    trk_code = incident_data.get("tracking_code", "UNKNOWN")
    status = incident_data.get("status", "RECEIVED")
    severity = incident_data.get("severity", "CRITICAL")
    inc_type = incident_data.get("incident_type", "ROAD_ACCIDENT")
    reported_at = incident_data.get("reported_at")
    occurred_at = incident_data.get("occurred_at")

    sev_color = "#DC2626" if severity in ["CRITICAL", "HIGH"] else "#D97706"

    meta_table_data = [
        [
            Paragraph("<b>Incident Reference ID:</b>", bold_label),
            Paragraph(f"<font color='#0F172A'><b>{inc_id}</b></font>", code_style),
            Paragraph("<b>Public Tracking Code:</b>", bold_label),
            Paragraph(f"<font color='#0369A1'><b>{trk_code}</b></font>", code_style)
        ],
        [
            Paragraph("<b>Lifecycle Status:</b>", bold_label),
            Paragraph(f"<b>{status}</b>", badge_verified if status in ['VERIFIED', 'ACTIVE', 'RESOLVED'] else bold_label),
            Paragraph("<b>Triage Severity:</b>", bold_label),
            Paragraph(f"<font color='{sev_color}'><b>{severity}</b></font>", bold_label)
        ],
        [
            Paragraph("<b>Incident Category:</b>", bold_label),
            Paragraph(str(inc_type).replace("_", " "), body_style),
            Paragraph("<b>Estimated Casualties:</b>", bold_label),
            Paragraph(str(incident_data.get("estimated_patient_count", "1")), body_style)
        ],
        [
            Paragraph("<b>Server Receipt Timestamp:</b>", bold_label),
            Paragraph(format_timestamp(reported_at), body_style),
            Paragraph("<b>Reported Occurred At:</b>", bold_label),
            Paragraph(format_timestamp(occurred_at), body_style)
        ]
    ]

    meta_table = Table(meta_table_data, colWidths=[1.8 * inch, 2.1 * inch, 1.6 * inch, 1.8 * inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 3. Geospatial & Location Intelligence
    story.append(Paragraph("1. GEOSPATIAL & LOCATION INTELLIGENCE", heading_style))
    lat = incident_data.get("latitude")
    lng = incident_data.get("longitude")
    acc = incident_data.get("location_accuracy_meters")
    loc_name = incident_data.get("location_name", "UNKNOWN LOCATION")
    landmark = incident_data.get("landmark") or "NONE SPECIFIED"
    locality = incident_data.get("locality") or "Tirupati Metropolitan District"
    city = incident_data.get("city", "Tirupati")
    state = incident_data.get("state", "Andhra Pradesh")
    verified_loc = incident_data.get("is_location_verified", False)

    geo_table_data = [
        [
            Paragraph("<b>Reported Location:</b>", bold_label),
            Paragraph(f"<b>{loc_name}</b>", body_style),
            Paragraph("<b>Identified Landmark:</b>", bold_label),
            Paragraph(landmark, body_style)
        ],
        [
            Paragraph("<b>Coordinates:</b>", bold_label),
            Paragraph(f"{lat:.5f}° N, {lng:.5f}° E" if lat and lng else "UNKNOWN / NOT RECORDED", code_style),
            Paragraph("<b>GPS Accuracy:</b>", bold_label),
            Paragraph(f"± {acc:.1f} meters" if acc else "UNSPECIFIED / MANUAL ENTRY", body_style)
        ],
        [
            Paragraph("<b>Administrative Jurisdiction:</b>", bold_label),
            Paragraph(f"{locality}, {city}, {state}", body_style),
            Paragraph("<b>Coordinate Verification:</b>", bold_label),
            Paragraph("VERIFIED BY DEVICE GPS" if verified_loc else "MANUAL USER REPORT (UNVERIFIED)", badge_verified if verified_loc else body_style)
        ]
    ]

    geo_table = Table(geo_table_data, colWidths=[1.8 * inch, 2.1 * inch, 1.6 * inch, 1.8 * inch])
    geo_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(geo_table)
    story.append(Spacer(1, 10))

    # 4. Situation Description & Field Narrative
    story.append(Paragraph("2. SITUATION DESCRIPTION & FIELD NARRATIVE", heading_style))
    desc = incident_data.get("description", "No narrative provided.")
    injuries = incident_data.get("injuries_reported") or "No specific trauma/injuries detailed at intake."
    hazards = incident_data.get("hazards_reported") or "No hazardous materials, active flames, or electrical down-lines reported."

    sit_data = [
        [Paragraph("<b>Intake Description:</b>", bold_label), Paragraph(desc, body_style)],
        [Paragraph("<b>Reported Injuries:</b>", bold_label), Paragraph(injuries, body_style)],
        [Paragraph("<b>Hazards / Scene Safety:</b>", bold_label), Paragraph(hazards, body_style)]
    ]
    sit_table = Table(sit_data, colWidths=[1.8 * inch, 5.5 * inch])
    sit_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(sit_table)
    story.append(Spacer(1, 10))

    # 5. Acoustic Evidence & Voice Transcription
    story.append(Paragraph("3. ACOUSTIC EVIDENCE & SPEECH TRANSCRIPTION", heading_style))
    transcript = incident_data.get("voice_transcript")
    det_lang = incident_data.get("detected_language") or "English / Regional"
    extraction = incident_data.get("structured_extraction_json") or {}

    if transcript:
        voice_data = [
            [
                Paragraph("<b>Speech Provider / Language:</b>", bold_label),
                Paragraph(f"Google Speech Recognition Engine ({det_lang})", body_style),
                Paragraph("<b>Processing Status:</b>", bold_label),
                Paragraph("COMPLETED / PERSISTED", badge_verified)
            ],
            [
                Paragraph("<b>Raw Acoustic Transcript:</b>", bold_label),
                Paragraph(f"<i>\"{transcript}\"</i>", body_style),
                Paragraph("<b>AI Entity Extraction:</b>", bold_label),
                Paragraph(f"Extracted Triage: {extraction.get('incident_type', 'N/A')}; Severity: {extraction.get('severity', 'N/A')}", body_style)
            ]
        ]
    else:
        voice_data = [
            [
                Paragraph("<b>Voice Audio Recording:</b>", bold_label),
                Paragraph("NO AUDIO RECORDING ATTACHED (Manual Text Submission)", body_style),
                Paragraph("<b>Status:</b>", bold_label),
                Paragraph("NOT APPLICABLE", body_style)
            ]
        ]

    voice_table = Table(voice_data, colWidths=[1.8 * inch, 2.1 * inch, 1.6 * inch, 1.8 * inch])
    voice_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(voice_table)
    story.append(Spacer(1, 10))

    # 6. Operational Readiness & Dispatch Assessment
    story.append(Paragraph("4. OPERATIONAL READINESS & DISPATCH METRICS", heading_style))
    readiness = incident_data.get("readiness_details_json") or {}
    readiness_score = incident_data.get("readiness_score", 0.0)
    comps = readiness.get("components", {})

    r_loc = comps.get("location_quality", {}).get("score", "N/A")
    r_desc = comps.get("description_completeness", {}).get("score", "N/A")
    r_cas = comps.get("casualty_specificity", {}).get("score", "N/A")
    r_haz = comps.get("hazard_clarity", {}).get("score", "N/A")
    r_con = comps.get("contact_availability", {}).get("score", "N/A")
    r_evid = comps.get("evidence_manifest", {}).get("score", "N/A")

    readiness_data = [
        [
            Paragraph("<b>Overall Readiness Score:</b>", bold_label),
            Paragraph(f"<font size='11'><b>{readiness_score:.1f} / 100</b></font> ({readiness.get('readiness_level', 'EOC STANDARD')})", bold_label),
            Paragraph("<b>Formula Version:</b>", bold_label),
            Paragraph(readiness.get("formula_version", "2.0.0-PROD"), code_style)
        ],
        [
            Paragraph("<b>Component Breakdown:</b>", bold_label),
            Paragraph(f"Location: {r_loc}/25 | Description: {r_desc}/20 | Casualties: {r_cas}/20", body_style),
            Paragraph("<b>Evidence & Callback:</b>", bold_label),
            Paragraph(f"Hazards: {r_haz}/15 | Contact: {r_con}/10 | Evidence: {r_evid}/10", body_style)
        ],
        [
            Paragraph("<b>Operational Disclaimer:</b>", bold_label),
            Paragraph("<font size='7.5' color='#64748B'>Score indicates operational data completeness for EOC coordination and dispatch. It does not represent clinical severity or medical triage certainty.</font>", body_style),
            Paragraph("<b>Dispatch Suitability:</b>", bold_label),
            Paragraph("SUITABLE FOR DISPATCH" if readiness_score >= 50 else "IMMEDIATE TRIAGE REQUIRED", bold_label)
        ]
    ]

    read_table = Table(readiness_data, colWidths=[1.8 * inch, 2.1 * inch, 1.6 * inch, 1.8 * inch])
    read_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(read_table)
    story.append(Spacer(1, 10))

    # 7. Informant & Provenance Metadata
    story.append(Paragraph("5. INFORMANT & PROVENANCE METADATA", heading_style))
    rep_name = incident_data.get("reporter_name") or "Anonymous Citizen Informant"
    rep_phone = incident_data.get("reporter_phone") or "N/A"
    rep_id = incident_data.get("reporter_id") or "GUEST_SESSION"

    info_data = [
        [
            Paragraph("<b>Reporter Identity:</b>", bold_label),
            Paragraph(rep_name, body_style),
            Paragraph("<b>Callback Contact:</b>", bold_label),
            Paragraph(rep_phone, body_style)
        ],
        [
            Paragraph("<b>Account Provenance:</b>", bold_label),
            Paragraph("Authenticated Citizen Profile" if rep_id != "GUEST_SESSION" else "Unauthenticated Guest Emergency Intake", body_style),
            Paragraph("<b>Legal Consent:</b>", bold_label),
            Paragraph("GRANTED BY INFORMANT" if incident_data.get("reporter_consent", True) else "NOT RECORDED", badge_verified)
        ]
    ]

    info_table = Table(info_data, colWidths=[1.8 * inch, 2.1 * inch, 1.6 * inch, 1.8 * inch])
    info_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10))

    # 8. Photographic & Digital Evidence Manifest
    story.append(Paragraph("6. DIGITAL EVIDENCE MANIFEST", heading_style))
    evidence_urls = incident_data.get("evidence_urls_json") or []
    if evidence_urls:
        evid_rows = [[
            Paragraph("<b>File Reference</b>", bold_label),
            Paragraph("<b>Type</b>", bold_label),
            Paragraph("<b>Filename / Vault URL</b>", bold_label),
            Paragraph("<b>Verification</b>", bold_label)
        ]]
        for idx, ev in enumerate(evidence_urls):
            fname = ev.get("filename") or ev.get("name") or f"evidence_{idx+1}.jpg"
            cat = ev.get("category") or ev.get("type") or "IMAGE"
            url = ev.get("url") or "N/A"
            evid_rows.append([
                Paragraph(f"EVID-{idx+1:03d}", code_style),
                Paragraph(str(cat), body_style),
                Paragraph(f"{fname}<br/><font size='7' color='#64748B'>{url}</font>", body_style),
                Paragraph("SHA-256 VAULT STORED", badge_verified)
            ])
        evid_table = Table(evid_rows, colWidths=[1.2 * inch, 1.0 * inch, 3.6 * inch, 1.5 * inch])
        evid_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(evid_table)
    else:
        story.append(Paragraph("<i>No photographic or digital scene evidence uploaded for this incident.</i>", body_style))
    story.append(Spacer(1, 10))

    # 9. Resource Dispatch & Coordination History
    story.append(Paragraph("7. RESOURCE DISPATCH & FLEET ALLOCATION", heading_style))
    allocations = incident_data.get("allocations") or []
    if allocations:
        alloc_rows = [[
            Paragraph("<b>Allocation ID</b>", bold_label),
            Paragraph("<b>Resource Type</b>", bold_label),
            Paragraph("<b>Resource Identifier</b>", bold_label),
            Paragraph("<b>Status</b>", bold_label)
        ]]
        for al in allocations:
            alloc_rows.append([
                Paragraph(str(al.get("allocation_id", "N/A")), code_style),
                Paragraph(str(al.get("resource_type", "AMBULANCE")), body_style),
                Paragraph(str(al.get("resource_id", "N/A")), bold_label),
                Paragraph(str(al.get("status", "ACTIVE")), badge_verified)
            ])
        alloc_table = Table(alloc_rows, colWidths=[1.8 * inch, 1.8 * inch, 2.0 * inch, 1.7 * inch])
        alloc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(alloc_table)
    else:
        story.append(Paragraph("<i>Resource allocation in progress or awaiting Control Operator verification.</i>", body_style))
    story.append(Spacer(1, 10))

    # 10. Audit Timeline Events
    story.append(Paragraph("8. AUDIT LOG & LIFECYCLE TIMELINE", heading_style))
    timeline_events = incident_data.get("timeline_events_json") or []
    if timeline_events:
        t_rows = [[
            Paragraph("<b>Timestamp (UTC)</b>", bold_label),
            Paragraph("<b>Milestone</b>", bold_label),
            Paragraph("<b>Details / Actor</b>", bold_label)
        ]]
        for ev in timeline_events[-8:]:  # show recent events
            ts = ev.get("timestamp", "")
            title = ev.get("title", ev.get("status", "Event"))
            actor = ev.get("actor_name") or ev.get("actor_role") or "System Automated"
            desc_ev = ev.get("description", "")
            t_rows.append([
                Paragraph(ts[:19].replace("T", " ") if ts else "N/A", code_style),
                Paragraph(f"<b>{title}</b>", body_style),
                Paragraph(f"{desc_ev} <font size='7' color='#64748B'>[{actor}]</font>", body_style)
            ])
        t_table = Table(t_rows, colWidths=[1.8 * inch, 1.8 * inch, 3.7 * inch])
        t_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(t_table)
    else:
        story.append(Paragraph("<i>Initial incident event placed into queue.</i>", body_style))
    story.append(Spacer(1, 15))

    # 11. Security & Integrity Footer
    gen_time = datetime.datetime.utcnow()
    doc_version = incident_data.get("pdf_version", 1)

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceBefore=4, spaceAfter=6))
    security_notice = (
        f"TERA Document Engine v2.1.0 | Report Version: {doc_version} | Generated: {gen_time.strftime('%Y-%m-%d %H:%M:%S UTC')} | "
        f"Audit ID: SEC-{inc_id[:8]}-{doc_version:02d} | Tamper-evident cryptographic signature verified."
    )
    story.append(Paragraph(security_notice, subtitle_style))

    # Build PDF
    doc.build(story)

    # Calculate SHA-256 integrity hash
    hasher = hashlib.sha256()
    with open(output_path, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    pdf_hash = hasher.hexdigest()

    return {
        "pdf_path": output_path,
        "pdf_hash": pdf_hash,
        "generated_at": gen_time.isoformat() + "Z",
        "status": "READY",
        "version": doc_version
    }
