import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import type { MasterParsedPayload } from "@/lib/types";

type ReportDoc = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

export async function exportPortfolioReport(
  session: MasterParsedPayload
): Promise<void> {
  const doc = new jsPDF("p", "mm", "a4") as ReportDoc;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const indigoRGB: [number, number, number] = [99, 91, 255];
  const darkRGB: [number, number, number] = [10, 37, 64];
  const grayRGB: [number, number, number] = [100, 116, 139];

  doc.setFillColor(...indigoRGB);
  doc.rect(0, 0, pageWidth, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Raidash", 14, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Financial clarity for investors.", 40, 13);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN")}`,
    pageWidth - 14,
    13,
    { align: "right" }
  );

  doc.setTextColor(...darkRGB);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Portfolio Report", 14, 35);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayRGB);
  doc.text(`Statement Date: ${session.metadata.statement_timestamp}`, 14, 44);
  doc.text(`Broker: ${session.metadata.origin_broker}`, 14, 50);

  doc.setFillColor(245, 247, 255);
  doc.roundedRect(14, 56, pageWidth - 28, 24, 3, 3, "F");
  doc.setTextColor(...indigoRGB);
  doc.setFontSize(11);
  doc.text("Total Portfolio Value", 20, 65);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  const totalValue = session.holdings.reduce(
    (sum, holding) => sum + holding.current_market_value,
    session.ledger_summary.closing_cash_balance
  );
  doc.text(
    `₹${totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    20,
    75
  );

  const dashboardElement = document.getElementById("portfolio-dashboard");
  if (dashboardElement) {
    try {
      const canvas = await html2canvas(dashboardElement, {
        backgroundColor: "#ffffff",
        scale: 1.5,
        useCORS: true,
      });
      const imageData = canvas.toDataURL("image/png");
      const imageWidth = pageWidth - 28;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      const maxHeight = 90;
      const finalHeight = Math.min(imageHeight, maxHeight);

      doc.addImage(imageData, "PNG", 14, 88, imageWidth, finalHeight);
    } catch {
      // Ignore capture failures and continue with the text report.
    }
  }

  let nextY = dashboardElement ? 190 : 95;

  if (session.investment_memo) {
    if (nextY > pageHeight - 60) {
      doc.addPage();
      nextY = 20;
    }

    doc.setTextColor(...darkRGB);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("AI Investment Memo", 14, nextY + 12);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayRGB);

    const memoWidth = pageWidth - 28;
    const memoParagraphs = session.investment_memo
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    let memoY = nextY + 20;
    memoParagraphs.forEach((paragraph) => {
      const lines = doc.splitTextToSize(paragraph, memoWidth) as string[];
      lines.forEach((line) => {
        if (memoY > pageHeight - 18) {
          doc.addPage();
          memoY = 20;
        }
        doc.text(line, 14, memoY);
        memoY += 5;
      });
      memoY += 4;
    });

    nextY = memoY + 2;
  }

  if (session.health_score) {
    if (nextY > pageHeight - 80) {
      doc.addPage();
      nextY = 20;
    }

    doc.setTextColor(...darkRGB);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Portfolio Health Score", 14, nextY);

    doc.setFontSize(32);
    doc.setTextColor(...indigoRGB);
    doc.text(`${session.health_score.score}`, 14, nextY + 17);
    doc.setFontSize(14);
    doc.text(
      `/ 100  -  Grade ${session.health_score.grade}: ${session.health_score.grade_label}`,
      32,
      nextY + 17
    );

    autoTable(doc, {
      startY: nextY + 23,
      head: [["Category", "Score", "Max", "Status"]],
      body: session.health_score.breakdown.map((item) => [
        item.label,
        item.score,
        item.max,
        item.message,
      ]),
      headStyles: { fillColor: indigoRGB, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 249, 255] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    nextY = doc.lastAutoTable?.finalY ?? nextY + 65;
  }

  if (session.rebalancing) {
    if (nextY > pageHeight - 60) {
      doc.addPage();
      nextY = 20;
    }

    doc.setTextColor(...darkRGB);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Smart Rebalancing", 14, nextY + 12);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayRGB);
    doc.text(session.rebalancing.summary, 14, nextY + 19);

    autoTable(doc, {
      startY: nextY + 25,
      head: [["Category", "Current", "Ideal", "Action"]],
      body: session.rebalancing.suggestions.map((item) => [
        item.category,
        `₹${item.current_value.toLocaleString("en-IN")}`,
        `₹${item.ideal_value.toLocaleString("en-IN")}`,
        item.action_label,
      ]),
      headStyles: { fillColor: indigoRGB, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 249, 255] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    nextY = doc.lastAutoTable?.finalY ?? nextY + 70;
  }

  if (session.sip_plan) {
    if (nextY > pageHeight - 60) {
      doc.addPage();
      nextY = 20;
    }

    doc.setTextColor(...darkRGB);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SIP Recommendations", 14, nextY + 12);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayRGB);
    doc.text(session.sip_plan.message, 14, nextY + 19);

    if (session.sip_plan.allocations.length > 0) {
      autoTable(doc, {
        startY: nextY + 25,
        head: [["Fund Name", "Category", "Monthly SIP", "Months to Target"]],
        body: session.sip_plan.allocations.map((item) => [
          item.fund_name,
          item.fund_category,
          `₹${item.monthly_amount.toLocaleString("en-IN")}`,
          `${item.months_to_target} months`,
        ]),
        headStyles: { fillColor: indigoRGB, textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 249, 255] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...grayRGB);
    doc.text(
      "Generated by Raidash - For personal use only. Not financial advice.",
      14,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, {
      align: "right",
    });
  }

  doc.save(`raidash-report-${session.metadata.statement_timestamp}.pdf`);
}
