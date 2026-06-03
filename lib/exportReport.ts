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
  // A4 dimensions: 210mm x 297mm
  const doc = new jsPDF("p", "mm", "a4") as ReportDoc;
  const pageWidth = doc.internal.pageSize.getWidth();

  const indigoRGB: [number, number, number] = [99, 91, 255];
  const darkRGB: [number, number, number] = [10, 37, 64];
  const grayRGB: [number, number, number] = [100, 116, 139];

  // 1. Solid Top Color Header Band
  doc.setFillColor(...darkRGB);
  doc.rect(0, 0, pageWidth, 18, "F");

  // Title branding in Header Band
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RAPIDASH PORTFOLIO REPORT", 12, 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Privacy-first financial clarity", 100, 11.5);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN")}`,
    pageWidth - 12,
    11.5,
    { align: "right" }
  );

  // 2. Metadata Information Block (Y: 24 to 44)
  doc.setTextColor(...darkRGB);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("STATEMENT DETAILS", 12, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...grayRGB);
  doc.text(`Statement Date: ${session.metadata.statement_timestamp}`, 12, 32);
  doc.text(`Origin Broker: ${session.metadata.origin_broker}`, 12, 37);

  // Metrics Card Background
  const cardX = 96;
  const cardWidth = pageWidth - cardX - 12; // 210 - 96 - 12 = 102
  doc.setFillColor(246, 248, 255);
  doc.roundedRect(cardX, 23, cardWidth, 20, 2, 2, "F");

  const holdingsValue = session.holdings.reduce(
    (sum, holding) => sum + holding.current_market_value,
    0
  );
  const totalValue = holdingsValue + session.ledger_summary.closing_cash_balance;

  // Render Metrics
  doc.setTextColor(...indigoRGB);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL PORTFOLIO VALUE", cardX + 5, 28.5);
  doc.setFontSize(13);
  doc.text(
    `₹${totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    cardX + 5,
    35.5
  );

  // Render secondary metrics in card
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...darkRGB);
  doc.text(
    `Cash: ₹${session.ledger_summary.closing_cash_balance.toLocaleString("en-IN")}`,
    cardX + 5,
    40.5
  );

  const scoreText = session.health_score
    ? `Health: ${session.health_score.score}/100 (Grade ${session.health_score.grade})`
    : "Health: N/A";
  doc.text(scoreText, cardX + 52, 40.5);

  // 3. AI Advisor Memo Notes (Y: 48 to 68)
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(230, 235, 245);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, 47, pageWidth - 24, 22, 2, 2, "FD");

  doc.setTextColor(...indigoRGB);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("ADVISOR MEMO & RECOMMENDATIONS", 16, 52.5);

  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  const memoText = session.investment_memo
    ? session.investment_memo.trim()
    : "No advisor notes generated for this statement. Please review NSE holdings list and rebalancing recommendations.";

  const textLines = doc.splitTextToSize(memoText, pageWidth - 32) as string[];
  // Fit up to 3 lines
  const memoLines = textLines.slice(0, 3);
  let memoY = 57.5;
  memoLines.forEach((line) => {
    doc.text(line, 16, memoY);
    memoY += 4.2;
  });

  // 4. Net Worth Chart (Y: 73 to 123)
  doc.setTextColor(...darkRGB);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PORTFOLIO VALUATION TREND (HISTORICAL / PROJECTED)", 12, 74.5);

  const chartElement = document.getElementById("net-worth-chart-container");
  let chartLoaded = false;
  if (chartElement) {
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        scale: 2.0,
        useCORS: true,
      });
      const imageData = canvas.toDataURL("image/png");
      doc.addImage(imageData, "PNG", 12, 78, pageWidth - 24, 43);
      chartLoaded = true;
    } catch {
      // capture failed, fallback drawn below
    }
  }

  if (!chartLoaded) {
    // Draw placeholder card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(12, 78, pageWidth - 24, 43, 2, 2, "F");
    doc.setTextColor(...grayRGB);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "Net Worth Trend Graph (Interactive visualization on your Rapidash web dashboard)",
      pageWidth / 2,
      99.5,
      { align: "center" }
    );
  }

  // 5. Holdings Ledger Table (Y: 126 to 198)
  doc.setTextColor(...darkRGB);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PORTFOLIO ASSETS & ALLOCATIONS", 12, 127.5);

  // Sort and limit holdings to fit exactly on a single page
  const sortedHoldings = [...session.holdings].sort(
    (a, b) => b.current_market_value - a.current_market_value
  );
  const maxRowsToShow = 5;
  const holdingsToShow = sortedHoldings.slice(0, maxRowsToShow);
  const remainingHoldings = sortedHoldings.slice(maxRowsToShow);

  const tableBody: (string | number)[][] = [];
  holdingsToShow.forEach((h) => {
    const sharePct = totalValue > 0 ? (h.current_market_value / totalValue) * 100 : 0;
    tableBody.push([
      h.ticker_symbol,
      h.isin,
      h.quantity.toLocaleString("en-IN"),
      `₹${h.average_buy_price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      `₹${h.current_market_value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      `${sharePct.toFixed(1)}%`,
    ]);
  });

  if (remainingHoldings.length > 0) {
    const remainingValue = remainingHoldings.reduce((sum, h) => sum + h.current_market_value, 0);
    const remainingShare = totalValue > 0 ? (remainingValue / totalValue) * 100 : 0;
    tableBody.push([
      `Other Holdings (${remainingHoldings.length} assets)`,
      "-",
      "-",
      "-",
      `₹${remainingValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
      `${remainingShare.toFixed(1)}%`,
    ]);
  }

  autoTable(doc, {
    startY: 130.5,
    head: [["Asset Ticker", "ISIN", "Quantity", "Average Price", "Market Value", "Allocation %"]],
    body: tableBody,
    headStyles: { fillColor: indigoRGB, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 249, 255] },
    styles: { fontSize: 7.5, cellPadding: 2, font: "helvetica" },
    margin: { left: 12, right: 12 },
  });

  // Calculate coordinates below table
  const tableFinalY = doc.lastAutoTable?.finalY ?? 174;
  let rebalanceStartY = tableFinalY + 5;

  if (rebalanceStartY > 192) {
    // Keep it tight to fit
    rebalanceStartY = 188;
  }

  // 6. Rebalancing & SIP Checklist (Y: rebalanceStartY to 275)
  doc.setTextColor(...darkRGB);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SMART ADVISORY PLAN", 12, rebalanceStartY);

  // Divide remaining space into 2 columns
  const colWidth = (pageWidth - 24 - 6) / 2; // 186 - 6 / 2 = 90
  const col2X = 12 + colWidth + 6; // 12 + 90 + 6 = 108

  // Left Column Box: Rebalancing Actions
  doc.setFillColor(252, 252, 253);
  doc.roundedRect(12, rebalanceStartY + 3, colWidth, 43, 1.5, 1.5, "F");
  doc.setTextColor(...indigoRGB);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("REBALANCING SUGGESTIONS", 16, rebalanceStartY + 8.5);

  if (session.rebalancing && session.rebalancing.suggestions.length > 0) {
    const suggestions = session.rebalancing.suggestions.slice(0, 4);
    let suggestionY = rebalanceStartY + 14.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    suggestions.forEach((item) => {
      doc.text(
        `• ${item.category}: ${item.action_label} (Diff: ${item.difference_pct > 0 ? "+" : ""}${item.difference_pct.toFixed(0)}%)`,
        16,
        suggestionY
      );
      suggestionY += 5.5;
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...grayRGB);
    doc.text("Portfolio allocation is aligned. No active rebalancing needed.", 16, rebalanceStartY + 15);
  }

  // Right Column Box: SIP Actions
  doc.setFillColor(252, 252, 253);
  doc.roundedRect(col2X, rebalanceStartY + 3, colWidth, 43, 1.5, 1.5, "F");
  doc.setTextColor(...indigoRGB);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("MONTHLY SIP ALLOCATIONS", col2X + 4, rebalanceStartY + 8.5);

  if (session.sip_plan && session.sip_plan.allocations.length > 0) {
    const allocations = session.sip_plan.allocations.slice(0, 4);
    let sipY = rebalanceStartY + 14.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    allocations.forEach((item) => {
      // Truncate fund name to fit column
      let fName = item.fund_name;
      if (fName.length > 28) {
        fName = fName.slice(0, 26) + "...";
      }
      doc.text(
        `• ${fName}: ₹${item.monthly_amount.toLocaleString("en-IN")}/mo`,
        col2X + 4,
        sipY
      );
      sipY += 5.5;
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...grayRGB);
    doc.text("No active SIP targets configured.", col2X + 4, rebalanceStartY + 15);
  }

  // 7. Branded Footer (Y: 285 to 297)
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(12, 281.5, pageWidth - 12, 281.5);

  doc.setFontSize(7);
  doc.setTextColor(...grayRGB);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Generated by Rapidash - Privacy-first wealth tracking. Personal report for CA / Financial Advisor review. Not financial advice.",
    pageWidth / 2,
    286.5,
    { align: "center" }
  );
  doc.text(`Page 1 of 1`, pageWidth - 12, 286.5, { align: "right" });

  doc.save(`rapidash-report-${session.metadata.statement_timestamp.replace(/[^0-9a-zA-Z-]/g, "_")}.pdf`);
}
