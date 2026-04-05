/**
 * Google Apps Script Web API for orders.
 *
 * Endpoints (deploy as Web App):
 * - POST  ?action=create                 -> create order
 * - GET   ?action=list                   -> list orders
 * - GET   ?action=detail&id=<orderId>    -> get order details
 * - GET   ?action=check-active&id=<id>   -> check status while not completed
 *
 * Sheet name: Orders
 */

const SHEET_NAME = 'Orders';
const HEADERS = [
  'id',
  'material',
  'materialSubtype',
  'volume',
  'pricePerCube',
  'totalPrice',
  'date',
  'address',
  'coordinates',
  'phone',
  'comment',
  'status',
  'createdAt',
  'updatedAt'
];

function doGet(e) {
  try {
    const action = getParam_(e, 'action', 'list');

    if (action === 'list') {
      return jsonResponse_(200, { ok: true, data: listOrders_() });
    }

    if (action === 'detail') {
      const id = getParam_(e, 'id');
      if (!id) return jsonResponse_(400, { ok: false, error: 'Missing order id' });
      const order = getOrderById_(id);
      if (!order) return jsonResponse_(404, { ok: false, error: 'Order not found' });
      return jsonResponse_(200, { ok: true, data: order });
    }

    if (action === 'check-active') {
      const id = getParam_(e, 'id');
      if (!id) return jsonResponse_(400, { ok: false, error: 'Missing order id' });
      const order = getOrderById_(id);
      if (!order) return jsonResponse_(404, { ok: false, error: 'Order not found' });

      const completed = isCompletedStatus_(order.status);
      return jsonResponse_(200, {
        ok: true,
        data: {
          id: order.id,
          status: order.status,
          isCompleted: completed,
          shouldContinuePolling: !completed
        }
      });
    }

    return jsonResponse_(400, { ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse_(500, { ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doPost(e) {
  try {
    const action = getParam_(e, 'action', 'create');
    if (action !== 'create') {
      return jsonResponse_(400, { ok: false, error: 'Unknown action for POST' });
    }

    const payload = parseJsonBody_(e);
    const validationError = validateCreatePayload_(payload);
    if (validationError) {
      return jsonResponse_(400, { ok: false, error: validationError });
    }

    const nowIso = new Date().toISOString();
    const id = String(Date.now());
    const order = {
      id: id,
      material: String(payload.material || ''),
      materialSubtype: String(payload.materialSubtype || ''),
      volume: Number(payload.volume || 0),
      pricePerCube: Number(payload.pricePerCube || 0),
      totalPrice: Number(payload.totalPrice || 0),
      date: String(payload.date || ''),
      address: String(payload.address || ''),
      coordinates: String(payload.coordinates || ''),
      phone: String(payload.phone || ''),
      comment: String(payload.comment || ''),
      status: String(payload.status || 'pending'),
      createdAt: nowIso,
      updatedAt: nowIso
    };

    appendOrder_(order);
    return jsonResponse_(201, { ok: true, data: order });
  } catch (err) {
    return jsonResponse_(500, { ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function listOrders_() {
  const rows = readAllRows_();
  // Newest first (id is timestamp-like string)
  rows.sort(function(a, b) {
    return Number(b.id || 0) - Number(a.id || 0);
  });
  return rows;
}

function getOrderById_(id) {
  const rows = readAllRows_();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(id)) return rows[i];
  }
  return null;
}

function appendOrder_(order) {
  const sheet = getOrCreateSheet_();
  const row = HEADERS.map(function(key) {
    return order[key] !== undefined && order[key] !== null ? order[key] : '';
  });
  sheet.appendRow(row);
}

function readAllRows_() {
  const sheet = getOrCreateSheet_();
  const lastRow = sheet.getLastRow();
  const lastColumn = HEADERS.length;
  if (lastRow < 2) return [];

  const range = sheet.getRange(2, 1, lastRow - 1, lastColumn);
  const values = range.getValues();

  return values.map(function(row) {
    const obj = {};
    HEADERS.forEach(function(key, idx) {
      obj[key] = row[idx];
    });
    return obj;
  });
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const lastColumn = HEADERS.length;
  const existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const isValid = HEADERS.every(function(header, idx) {
    return existingHeaders[idx] === header;
  });

  if (!isValid) {
    sheet.getRange(1, 1, 1, lastColumn).setValues([HEADERS]);
  }
}

function validateCreatePayload_(payload) {
  if (!payload || typeof payload !== 'object') return 'Invalid JSON payload';
  if (!payload.material) return 'Field "material" is required';
  if (!payload.volume && payload.volume !== 0) return 'Field "volume" is required';
  if (!payload.date) return 'Field "date" is required';
  if (!payload.phone) return 'Field "phone" is required';
  return '';
}

function isCompletedStatus_(status) {
  const normalized = String(status || '').toLowerCase().trim();
  return (
    normalized === 'completed' ||
    normalized === 'delivered' ||
    normalized === 'done' ||
    normalized === 'завершен' ||
    normalized === 'завершён'
  );
}

function parseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function getParam_(e, key, fallback) {
  if (!e || !e.parameter) return fallback || '';
  if (e.parameter[key] === undefined || e.parameter[key] === null || e.parameter[key] === '') {
    return fallback || '';
  }
  return String(e.parameter[key]);
}

function jsonResponse_(statusCode, payload) {
  // Apps Script ContentService does not allow setting custom HTTP status.
  // We include statusCode in body for client-side handling.
  const body = {
    statusCode: statusCode,
    ...payload
  };

  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

