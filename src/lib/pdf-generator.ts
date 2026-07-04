import jsPDF from "jspdf";
import type { CompanyReport } from "@/types";

export async function generatePdfReport(report: CompanyReport): Promise<Buffer> {
  // Create PDF using jsPDF - no font file dependencies
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // RGB colors
  const accentRGB = [79, 70, 229];
  const textRGB = [30, 41, 59];
  const mutedRGB = [100, 114, 139];

  const addSection = (title: string) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, margin, yPosition);
    yPosition += 7;

    // Add line under section
    pdf.setDrawColor(accentRGB[0], accentRGB[1], accentRGB[2]);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
  };

  const addField = (label: string, value: string) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setTextColor(mutedRGB[0], mutedRGB[1], mutedRGB[2]);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    const labelWidth = pdf.getTextWidth(label + ": ");
    pdf.text(label + ": ", margin, yPosition);

    pdf.setTextColor(textRGB[0], textRGB[1], textRGB[2]);
    pdf.setFont("helvetica", "normal");
    const wrappedValue = pdf.splitTextToSize(value || "Not available", contentWidth - labelWidth);
    pdf.text(wrappedValue, margin + labelWidth, yPosition);
    
    const lineHeight = wrappedValue.length * 5;
    yPosition += lineHeight + 3;
  };

  const addBulletList = (items: string[]) => {
    if (items.length === 0) {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.setTextColor(mutedRGB[0], mutedRGB[1], mutedRGB[2]);
      pdf.setFontSize(10);
      pdf.text("Not available", margin + 5, yPosition);
      yPosition += 5;
      return;
    }

    items.forEach((item) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setTextColor(textRGB[0], textRGB[1], textRGB[2]);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const wrappedItem = pdf.splitTextToSize(`• ${item}`, contentWidth - 5);
      pdf.text(wrappedItem, margin + 5, yPosition);
      
      const lineHeight = wrappedItem.length * 5;
      yPosition += lineHeight + 2;
    });
  };

  // Title
  pdf.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text("Company Research Report", margin, yPosition);
  yPosition += 12;

  // Generated date
  pdf.setTextColor(mutedRGB[0], mutedRGB[1], mutedRGB[2]);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  const date = new Date(report.generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  pdf.text(`Generated on ${date}`, margin, yPosition);
  yPosition += 8;

  // Company Overview
  addSection("Company Overview");
  addField("Name", report.companyName);
  addField("Website", report.website);
  addField("Phone", report.phone);
  addField("Address", report.address);
  yPosition += 2;

  // Business Information
  addSection("Business Information");
  addField("Industry", report.industry);
  addField("Founded", report.founded);
  addField("Headquarters", report.headquarters);
  yPosition += 2;

  // Products & Services
  addSection("Products & Services");
  addBulletList(report.productsServices);
  yPosition += 2;

  // AI Summary
  addSection("AI Summary");
  if (yPosition > pageHeight - 30) {
    pdf.addPage();
    yPosition = margin;
  }
  pdf.setTextColor(textRGB[0], textRGB[1], textRGB[2]);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  const summaryLines = pdf.splitTextToSize(report.summary || "Not available", contentWidth);
  pdf.text(summaryLines, margin, yPosition);
  yPosition += summaryLines.length * 5 + 5;

  // Pain Points
  addSection("Pain Points");
  addBulletList(report.painPoints);
  yPosition += 2;

  // SWOT Analysis
  addSection("SWOT Analysis");
  const swotGroups = [
    ["Strengths", report.swot.strengths],
    ["Weaknesses", report.swot.weaknesses],
    ["Opportunities", report.swot.opportunities],
    ["Threats", report.swot.threats],
  ] as const;

  swotGroups.forEach(([label, items]) => {
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(label, margin, yPosition);
    yPosition += 5;

    addBulletList(items);
  });

  // Competitors
  addSection("Competitors");
  if (report.competitors.length === 0) {
    pdf.setTextColor(mutedRGB[0], mutedRGB[1], mutedRGB[2]);
    pdf.setFontSize(10);
    pdf.text("No competitors identified.", margin, yPosition);
    yPosition += 5;
  } else {
    report.competitors.forEach((comp, i) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setTextColor(textRGB[0], textRGB[1], textRGB[2]);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${i + 1}. ${comp.name}`, margin, yPosition);
      yPosition += 5;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(mutedRGB[0], mutedRGB[1], mutedRGB[2]);
      pdf.text(comp.website, margin + 5, yPosition);
      yPosition += 5;
    });
  }

  // Pages Crawled
  addSection("Pages Crawled");
  if (report.pagesCrawled.length === 0) {
    pdf.setTextColor(mutedRGB[0], mutedRGB[1], mutedRGB[2]);
    pdf.setFontSize(10);
    pdf.text("No pages crawled.", margin, yPosition);
    yPosition += 5;
  } else {
    addBulletList(report.pagesCrawled);
  }

  // Sources
  addSection("Sources");
  if (report.sources.length === 0) {
    pdf.setTextColor(mutedRGB[0], mutedRGB[1], mutedRGB[2]);
    pdf.setFontSize(10);
    pdf.text("No sources recorded.", margin, yPosition);
    yPosition += 5;
  } else {
    report.sources.forEach((source) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setTextColor(textRGB[0], textRGB[1], textRGB[2]);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(source.title, margin, yPosition);
      yPosition += 5;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(mutedRGB[0], mutedRGB[1], mutedRGB[2]);
      pdf.setFontSize(9);
      const urlLines = pdf.splitTextToSize(source.url, contentWidth);
      pdf.text(urlLines, margin + 5, yPosition);
      yPosition += urlLines.length * 4 + 3;
    });
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(mutedRGB[0], mutedRGB[1], mutedRGB[2]);
  pdf.text(
    "This report was generated by AI using publicly available information. Verify critical details independently.",
    margin,
    pageHeight - 10,
    { align: "center", maxWidth: contentWidth }
  );

  // Return as Buffer
  const pdfBytes = pdf.output("arraybuffer");
  return Buffer.from(pdfBytes);
}
