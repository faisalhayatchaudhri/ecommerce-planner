const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

async function fetchReportData(userId, year) {
  const [kpiRes, trendsRes, productsRes, cashRes] = await Promise.all([
    pool.query(
      `SELECT
        COALESCE(SUM(units_sold * average_order_value), 0) as total_revenue,
        COALESCE(SUM(units_sold), 0) as total_units
       FROM sales_forecasts WHERE user_id=$1 AND EXTRACT(YEAR FROM month)=$2`,
      [userId, year]
    ),
    pool.query(
      `SELECT
        TO_CHAR(month, 'YYYY-MM') as period,
        SUM(units_sold * average_order_value) as revenue,
        SUM(units_sold) as units
       FROM sales_forecasts
       WHERE user_id=$1 AND EXTRACT(YEAR FROM month)=$2
       GROUP BY period ORDER BY period`,
      [userId, year]
    ),
    pool.query(
      `SELECT p.name, p.category, p.selling_price, p.cogs,
        COALESCE(SUM(sf.units_sold), 0) as units,
        COALESCE(SUM(sf.units_sold * p.selling_price), 0) as revenue
       FROM products p
       LEFT JOIN sales_forecasts sf ON sf.product_id = p.id AND EXTRACT(YEAR FROM sf.month)=$2
       WHERE p.user_id=$1
       GROUP BY p.id ORDER BY revenue DESC`,
      [userId, year]
    ),
    pool.query(
      `SELECT TO_CHAR(month, 'YYYY-MM') as period, type, category, amount
       FROM cash_flow WHERE user_id=$1 AND EXTRACT(YEAR FROM month)=$2
       ORDER BY month ASC`,
      [userId, year]
    )
  ]);
  return {
    kpis: kpiRes.rows[0],
    trends: trendsRes.rows,
    products: productsRes.rows,
    cashflow: cashRes.rows
  };
}

// GET /api/reports/excel?year=2026
router.get('/excel', async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const data = await fetchReportData(req.userId, year);
    const wb = new ExcelJS.Workbook();
    wb.creator = 'E-commerce Planner';
    wb.created = new Date();

    // Summary sheet
    const sumSheet = wb.addWorksheet('Summary');
    sumSheet.addRow(['E-commerce Business Report', year]);
    sumSheet.addRow([]);
    sumSheet.addRow(['Total Revenue', parseFloat(data.kpis.total_revenue || 0).toFixed(2)]);
    sumSheet.addRow(['Total Units Sold', data.kpis.total_units || 0]);
    sumSheet.getRow(1).font = { bold: true, size: 14 };

    // Monthly trends
    const trendSheet = wb.addWorksheet('Monthly Trends');
    trendSheet.addRow(['Period', 'Revenue', 'Units']);
    data.trends.forEach(r => {
      trendSheet.addRow([r.period, parseFloat(r.revenue || 0).toFixed(2), r.units || 0]);
    });
    trendSheet.getRow(1).font = { bold: true };

    // Products
    const prodSheet = wb.addWorksheet('Product Performance');
    prodSheet.addRow(['Product', 'Category', 'Price', 'COGS', 'Units Sold', 'Revenue']);
    data.products.forEach(p => {
      prodSheet.addRow([
        p.name, p.category,
        parseFloat(p.selling_price).toFixed(2),
        parseFloat(p.cogs).toFixed(2),
        p.units || 0,
        parseFloat(p.revenue || 0).toFixed(2)
      ]);
    });
    prodSheet.getRow(1).font = { bold: true };

    // Cash flow
    const cfSheet = wb.addWorksheet('Cash Flow');
    cfSheet.addRow(['Period', 'Type', 'Category', 'Amount']);
    data.cashflow.forEach(r => {
      cfSheet.addRow([r.period, r.type, r.category, parseFloat(r.amount).toFixed(2)]);
    });
    cfSheet.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=ecommerce-report-${year}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

// GET /api/reports/csv?year=2026
router.get('/csv', async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const data = await fetchReportData(req.userId, year);
    let csv = 'Period,Revenue,Units\n';
    data.trends.forEach(r => {
      csv += `${r.period},${parseFloat(r.revenue || 0).toFixed(2)},${r.units || 0}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=ecommerce-report-${year}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate CSV report' });
  }
});

// GET /api/reports/pdf?year=2026
router.get('/pdf', async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const data = await fetchReportData(req.userId, year);
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ecommerce-report-${year}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text(`E-commerce Business Report - ${year}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('Summary KPIs');
    doc.fontSize(11)
      .text(`Total Revenue: $${parseFloat(data.kpis.total_revenue || 0).toFixed(2)}`)
      .text(`Total Units Sold: ${data.kpis.total_units || 0}`);

    doc.moveDown();
    doc.fontSize(14).text('Monthly Revenue Trends');
    data.trends.forEach(r => {
      doc.fontSize(10).text(`${r.period}: $${parseFloat(r.revenue || 0).toFixed(2)} (${r.units || 0} units)`);
    });

    doc.moveDown();
    doc.fontSize(14).text('Product Performance');
    data.products.forEach(p => {
      doc.fontSize(10).text(
        `${p.name} (${p.category || 'N/A'}): ${p.units || 0} units, $${parseFloat(p.revenue || 0).toFixed(2)} revenue`
      );
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

module.exports = router;
