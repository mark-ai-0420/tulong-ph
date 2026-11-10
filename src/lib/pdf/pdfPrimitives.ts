import type { jsPDF } from 'jspdf';
import type { StoredDocument } from '../../types/assistance.ts';
import { getChecklistDocumentStatus, getDocumentAttachmentDataUrl, type DocumentPillar } from '../documentVault.ts';

/**
 * Standard A4 measurements in millimeters: 210 x 297
 */
export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const MARGIN_LEFT = 14;
export const MARGIN_RIGHT = 14;
export const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 182 mm

/**
 * Draws standard monochrome high-contrast header for official Philippine government forms.
 */
export function drawOfficialHeader(
  doc: jsPDF,
  republicText: string,
  departmentText: string,
  formTitle: string,
  legalSubtext: string,
  startY: number = 14
): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(republicText.toUpperCase(), PAGE_WIDTH / 2, startY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(departmentText.toUpperCase(), PAGE_WIDTH / 2, startY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(formTitle.toUpperCase(), PAGE_WIDTH / 2, startY + 10.5, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text(legalSubtext, PAGE_WIDTH / 2, startY + 15, { align: 'center' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_LEFT, startY + 17.5, PAGE_WIDTH - MARGIN_RIGHT, startY + 17.5);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, startY + 18.5, PAGE_WIDTH - MARGIN_RIGHT, startY + 18.5);

  return startY + 22;
}

/**
 * Draws a section banner (black box or double border) with inverted text or bold monochrome label.
 */
export function drawSectionBanner(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(235, 235, 235);
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(title.toUpperCase(), MARGIN_LEFT + 3, y + 4.2);

  return y + 6;
}

/**
 * Draws a grid cell with label and value.
 */
export function drawFieldCell(
  doc: jsPDF,
  label: string,
  value: string | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  isBoldValue: boolean = true
) {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.rect(x, y, width, height);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text(label.toUpperCase(), x + 1.5, y + 3.2);

  doc.setFont('helvetica', isBoldValue ? 'bold' : 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const displayVal = value && value.trim() ? value : '-';
  // Truncate or fit if necessary
  const maxChars = Math.floor(width / 2.1);
  const safeVal = displayVal.length > maxChars ? displayVal.substring(0, maxChars - 2) + '..' : displayVal;
  doc.text(safeVal, x + 1.5, y + 7.5);
}

/**
 * Appends uploaded image/pdf documents from Vault as supplementary pages.
 */
export async function appendVaultAttachments(doc: jsPDF, documents: StoredDocument[]): Promise<void> {
  const attachableDocs = documents.filter((document) => getDocumentAttachmentDataUrl(document));

  for (const docItem of attachableDocs) {
    const attachmentDataUrl = getDocumentAttachmentDataUrl(docItem);
    if (!attachmentDataUrl) continue;

    try {
      doc.addPage();

      // Top label banner
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0);
      doc.text(`KALAKIP NA DOKUMENTO: ${docItem.fileName.toUpperCase()}`, MARGIN_LEFT, 12);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(90);
      doc.text(
        `Original file size: ${(docItem.originalSize / 1024).toFixed(0)} KB | Verified under 2MB Client-Side`,
        PAGE_WIDTH - MARGIN_RIGHT,
        12,
        { align: 'right' }
      );

      doc.setDrawColor(200);
      doc.line(MARGIN_LEFT, 14, PAGE_WIDTH - MARGIN_RIGHT, 14);

      // Load image to determine aspect ratio
      const img = new Image();
      img.src = attachmentDataUrl;
      await new Promise<void>((resolve, reject) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => reject();
        }
      });

      // Fit within available page area (210 - 28 = 182mm wide, 297 - 35 = 262mm tall)
      const maxAreaW = USABLE_WIDTH;
      const maxAreaH = PAGE_HEIGHT - 28;

      let drawW = maxAreaW;
      let drawH = (img.height * drawW) / img.width;

      if (drawH > maxAreaH) {
        drawH = maxAreaH;
        drawW = (img.width * drawH) / img.height;
      }

      const drawX = MARGIN_LEFT + (maxAreaW - drawW) / 2;
      const drawY = 18 + (maxAreaH - drawH) / 2;

      doc.addImage(attachmentDataUrl, attachmentDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');
    } catch {
      // Continue gracefully if a single image fails
    }
  }
}

const PACKET_FOOTER_Y = PAGE_HEIGHT - 8;
const PACKET_CONTENT_BOTTOM = PACKET_FOOTER_Y - 14;
export const PACKET_LINE_HEIGHT = 4.2;
export const PACKET_TEXT_SIZE = 9;

interface PacketLayoutContext { section: string }
const packetLayoutContexts = new WeakMap<jsPDF, PacketLayoutContext>();

function packetLayoutContext(doc: jsPDF): PacketLayoutContext {
  let context = packetLayoutContexts.get(doc);
  if (!context) {
    context = { section: 'WORKSHEET' };
    packetLayoutContexts.set(doc, context);
  }
  return context;
}

export function startPacketContinuationPage(doc: jsPDF): number {
  const context = packetLayoutContext(doc);
  drawPacketFooter(doc, 'CONTINUED');
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(PACKET_TEXT_SIZE);
  doc.setTextColor(0, 0, 0);
  doc.text('TULONGPH WORKSHEET - CONTINUED', MARGIN_LEFT, 13);
  const sectionLines = packetLines(doc, context.section, USABLE_WIDTH, PACKET_TEXT_SIZE);
  doc.text(sectionLines, MARGIN_LEFT, 18);
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  const ruleY = 21 + (sectionLines.length - 1) * PACKET_LINE_HEIGHT;
  doc.line(MARGIN_LEFT, ruleY, PAGE_WIDTH - MARGIN_RIGHT, ruleY);
  return ruleY + 5;
}

export function ensurePacketSpace(doc: jsPDF, y: number, height: number): number {
  if (y + height <= PACKET_CONTENT_BOTTOM || y <= 24) return y;
  return startPacketContinuationPage(doc);
}

export function packetAscii(value: unknown): string {
  return String(value ?? '')
    .replace(/₱/g, 'PHP ')
    .replace(/[•·]/g, '/')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
}

export function packetMoney(value: number): string {
  const amount = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function packetLines(doc: jsPDF, text: string, width: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(packetAscii(text) || ' ', width);
  return Array.isArray(lines) ? lines : [lines];
}

export function drawPacketHeader(doc: jsPDF, agency: string, title: string, legal: string): number {
  packetLayoutContexts.set(doc, { section: title });
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('REPUBLIKA NG PILIPINAS', PAGE_WIDTH / 2, 12, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(packetAscii(agency).toUpperCase(), PAGE_WIDTH / 2, 17, { align: 'center' });
  doc.setFontSize(12);
  const titleLines = packetLines(doc, title.toUpperCase(), USABLE_WIDTH, 12);
  doc.text(titleLines, PAGE_WIDTH / 2, 24, { align: 'center' });
  const titleEnd = 24 + (titleLines.length - 1) * 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(PACKET_TEXT_SIZE);
  const legalLines = packetLines(doc, legal, USABLE_WIDTH, PACKET_TEXT_SIZE);
  doc.text(legalLines, PAGE_WIDTH / 2, titleEnd + 5, { align: 'center' });
  const ruleY = titleEnd + 9 + (legalLines.length - 1) * 3.5;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, ruleY, PAGE_WIDTH - MARGIN_RIGHT, ruleY);
  doc.setLineWidth(0.2);
  return ruleY + 5;
}

export function drawPacketMetadata(doc: jsPDF, prefix: string, y: number): number {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PACKET_TEXT_SIZE);
  doc.setTextColor(40, 40, 40);
  const date = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Date: ${date}`, MARGIN_LEFT, y);
  doc.text(`${prefix}-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' });
  return y + 5;
}

export function drawPacketSection(doc: jsPDF, title: string, y: number, followingHeight = 24): number {
  packetLayoutContext(doc).section = title;
  y = ensurePacketSpace(doc, y, 8 + followingHeight);
  return drawSectionBanner(doc, title, y) + 2;
}

interface PacketField { label: string; value: string }

export function drawPacketFieldRow(doc: jsPDF, fields: PacketField[], y: number): number {
  const gap = 2;
  const width = (USABLE_WIDTH - gap * (fields.length - 1)) / fields.length;
  const heights = fields.map((field) => {
    const lines = packetLines(doc, field.value || '____________________', width - 4, PACKET_TEXT_SIZE);
    return Math.max(12, 7 + lines.length * PACKET_LINE_HEIGHT);
  });
  const height = Math.max(...heights);
  y = ensurePacketSpace(doc, y, height);
  fields.forEach((field, index) => {
    const x = MARGIN_LEFT + index * (width + gap);
    doc.setDrawColor(165, 165, 165);
    doc.setLineWidth(0.2);
    doc.rect(x, y, width, height);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text(packetAscii(field.label).toUpperCase(), x + 2, y + 3.2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.setTextColor(0, 0, 0);
    const lines = packetLines(doc, field.value || '____________________', width - 4, PACKET_TEXT_SIZE);
    doc.text(lines, x + 2, y + 7.2);
  });
  return y + height + 1;
}

export function drawPacketKeyValueRows(doc: jsPDF, rows: PacketField[], y: number, valueWidth = USABLE_WIDTH * 0.58): number {
  const labelWidth = USABLE_WIDTH - valueWidth;
  rows.forEach(({ label, value }) => {
    const labelLines = packetLines(doc, label, labelWidth - 4, PACKET_TEXT_SIZE);
    const valueLines = packetLines(doc, value || '____________________', valueWidth - 5, PACKET_TEXT_SIZE);
    const height = Math.max(9, 4.5 + Math.max(labelLines.length, valueLines.length) * PACKET_LINE_HEIGHT);
    y = ensurePacketSpace(doc, y, height);
    doc.setDrawColor(170, 170, 170);
    doc.setLineWidth(0.2);
    doc.setFillColor(249, 249, 249);
    doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, height, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.setTextColor(30, 30, 30);
    doc.text(labelLines, MARGIN_LEFT + 2, y + 4.4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.text(valueLines, MARGIN_LEFT + labelWidth + 2, y + 4.4);
    y += height;
  });
  return y;
}

export function drawPacketTable(doc: jsPDF, headers: string[], rows: string[][], y: number, widths: number[]): number {
  const drawRow = (cells: string[][], isHeader: boolean, height: number, rowY: number) => {
    let x = MARGIN_LEFT;
    cells.forEach((lines, index) => {
      doc.setDrawColor(155, 155, 155);
      doc.setLineWidth(0.2);
      if (isHeader) doc.setFillColor(232, 232, 232);
      else doc.setFillColor(255, 255, 255);
      doc.rect(x, rowY, widths[index], height, 'FD');
      doc.setFont('helvetica', isHeader || index === 0 ? 'bold' : 'normal');
      doc.setFontSize(PACKET_TEXT_SIZE);
      doc.setTextColor(0, 0, 0);
      if (lines.length) doc.text(lines, x + 2, rowY + 4.3);
      x += widths[index];
    });
  };
  const headerLines = headers.map((cell, index) => packetLines(doc, cell, widths[index] - 4, PACKET_TEXT_SIZE));
  const headerHeight = Math.max(8, 4 + Math.max(...headerLines.map((lines) => lines.length)) * PACKET_LINE_HEIGHT);
  const drawHeader = () => {
    drawRow(headerLines, true, headerHeight, y);
    y += headerHeight;
  };
  let headerDrawn = false;

  rows.forEach((row) => {
    const rowLines = row.map((cell, index) => packetLines(doc, cell, widths[index] - 4, PACKET_TEXT_SIZE));
    const lineCount = Math.max(...rowLines.map((lines) => lines.length));
    const fullHeight = Math.max(8, 4 + lineCount * PACKET_LINE_HEIGHT);
    const maxLinesPerPage = Math.floor((PACKET_CONTENT_BOTTOM - 28 - headerHeight - 4) / PACKET_LINE_HEIGHT);

    if (lineCount <= maxLinesPerPage) {
      const required = fullHeight + (headerDrawn ? 0 : headerHeight);
      if (y + required > PACKET_CONTENT_BOTTOM) {
        y = startPacketContinuationPage(doc);
        headerDrawn = false;
      }
      if (!headerDrawn) {
        drawHeader();
        headerDrawn = true;
      }
      if (y + fullHeight > PACKET_CONTENT_BOTTOM) {
        y = startPacketContinuationPage(doc);
        drawHeader();
      }
      drawRow(rowLines, false, fullHeight, y);
      y += fullHeight;
      return;
    }

    if (!headerDrawn) {
      y = ensurePacketSpace(doc, y, headerHeight + PACKET_LINE_HEIGHT + 4);
      drawHeader();
      headerDrawn = true;
    }
    let offset = 0;
    while (offset < lineCount) {
      let availableLines = Math.floor((PACKET_CONTENT_BOTTOM - y - 4) / PACKET_LINE_HEIGHT);
      if (availableLines < 1) {
        y = startPacketContinuationPage(doc);
        drawHeader();
        availableLines = Math.floor((PACKET_CONTENT_BOTTOM - y - 4) / PACKET_LINE_HEIGHT);
      }
      const count = Math.min(availableLines, lineCount - offset);
      const chunk = rowLines.map((lines) => lines.slice(offset, offset + count));
      const height = Math.max(8, 4 + count * PACKET_LINE_HEIGHT);
      drawRow(chunk, false, height, y);
      y += height;
      offset += count;
      if (offset < lineCount) {
        y = startPacketContinuationPage(doc);
        drawHeader();
      }
    }
    headerDrawn = true;
  });
  return ensurePacketSpace(doc, y, 2) + 2;
}

export function drawPacketParagraph(doc: jsPDF, label: string, text: string, y: number, box = true): number {
  const lines = packetLines(doc, text, USABLE_WIDTH - 6, PACKET_TEXT_SIZE);
  const labelLines = packetLines(doc, label.toUpperCase(), USABLE_WIDTH - 4, PACKET_TEXT_SIZE);
  const labelHeight = Math.max(4.2, labelLines.length * PACKET_LINE_HEIGHT) + 3;
  const maxSinglePageLines = Math.floor((PACKET_CONTENT_BOTTOM - 28 - labelHeight - 2) / PACKET_LINE_HEIGHT);
  if (lines.length <= maxSinglePageLines) {
    y = ensurePacketSpace(doc, y, labelHeight + lines.length * PACKET_LINE_HEIGHT + 2);
    const height = Math.max(10, labelHeight + lines.length * PACKET_LINE_HEIGHT + 1);
    if (box) {
      doc.setDrawColor(175, 175, 175);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, height);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.setTextColor(30, 30, 30);
    doc.text(labelLines, MARGIN_LEFT + 2, y + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.setTextColor(0, 0, 0);
    doc.text(lines, MARGIN_LEFT + 2, y + labelHeight);
    return y + height + 2;
  }

  let offset = 0;
  while (offset < lines.length) {
    const continuationLabel = packetLines(doc, `${label.toUpperCase()}${offset ? ' (CONTINUED)' : ''}`, USABLE_WIDTH - 4, PACKET_TEXT_SIZE);
    const continuationLabelHeight = Math.max(4.2, continuationLabel.length * PACKET_LINE_HEIGHT) + 3;
    const availableLines = Math.floor((PACKET_CONTENT_BOTTOM - y - continuationLabelHeight - 2) / PACKET_LINE_HEIGHT);
    if (availableLines < 1) {
      y = startPacketContinuationPage(doc);
      continue;
    }
    const count = Math.min(availableLines, lines.length - offset);
    const height = Math.max(10, continuationLabelHeight + count * PACKET_LINE_HEIGHT + 1);
    if (box) {
      doc.setDrawColor(175, 175, 175);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN_LEFT, y, USABLE_WIDTH, height);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.setTextColor(30, 30, 30);
    doc.text(continuationLabel, MARGIN_LEFT + 2, y + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PACKET_TEXT_SIZE);
    doc.setTextColor(0, 0, 0);
    doc.text(lines.slice(offset, offset + count), MARGIN_LEFT + 2, y + continuationLabelHeight);
    y += height + 2;
    offset += count;
    if (offset < lines.length) y = startPacketContinuationPage(doc);
  }
  return y;
}

export function drawPacketChecklist(doc: jsPDF, items: string[], y: number, documents: StoredDocument[] = [], pillar?: DocumentPillar): number {
  const list = items.length ? items : ['Ask the school or agency to confirm the current documentary requirements.'];
  const gap = 5;
  const columnWidth = (USABLE_WIDTH - gap) / 2;
  for (let index = 0; index < list.length; index += 2) {
    const pair = list.slice(index, index + 2);
    const lines = pair.map((item) => {
      const status = pillar ? getChecklistDocumentStatus(item, documents, pillar) : undefined;
      const marker = status?.status === 'ready' ? '[x]' : '[ ]';
      const attachmentState = status?.status === 'over-limit' ? ' (over 2 MB)'
        : status?.status === 'download-only' ? ' (download separately)'
          : '';
      return packetLines(doc, `${marker} ${item}${attachmentState}`, columnWidth - 2, PACKET_TEXT_SIZE);
    });
    const rowHeight = Math.max(6, Math.max(...lines.map((itemLines) => itemLines.length)) * PACKET_LINE_HEIGHT + 0.6);
    y = ensurePacketSpace(doc, y, rowHeight);
    pair.forEach((item, column) => {
      const x = MARGIN_LEFT + column * (columnWidth + gap);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PACKET_TEXT_SIZE);
      doc.setTextColor(0, 0, 0);
      doc.text(lines[column], x, y + 4);
    });
    y += rowHeight;
  }
  return y + 2;
}

interface PacketReference { name: string; details: string[] }

export function drawPacketReferenceCards(doc: jsPDF, references: PacketReference[], y: number): number {
  const width = USABLE_WIDTH;
  packetLayoutContext(doc).section = 'STATUTORY AND PROGRAM REFERENCES';
  references.forEach((reference) => {
    const title = packetLines(doc, reference.name, width - 6, PACKET_TEXT_SIZE);
    const details = packetLines(doc, reference.details.join(' | '), width - 6, PACKET_TEXT_SIZE);
    const height = Math.max(12, 4 + (title.length + details.length) * PACKET_LINE_HEIGHT);
    const maxCardHeight = PACKET_CONTENT_BOTTOM - 28;
    if (height <= maxCardHeight) {
      y = ensurePacketSpace(doc, y, height);
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN_LEFT, y, width, height);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(PACKET_TEXT_SIZE);
      doc.setTextColor(0, 0, 0);
      doc.text(title, MARGIN_LEFT + 3, y + 3.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PACKET_TEXT_SIZE);
      doc.text(details, MARGIN_LEFT + 3, y + 3.5 + title.length * PACKET_LINE_HEIGHT);
      y += height + 0.5;
      return;
    }

    let offset = 0;
    while (offset < details.length) {
      const cardTitle = packetLines(doc, `${reference.name}${offset ? ' (CONTINUED)' : ''}`, width - 6, PACKET_TEXT_SIZE);
      const availableLines = Math.floor((PACKET_CONTENT_BOTTOM - y - 4 - cardTitle.length * PACKET_LINE_HEIGHT) / PACKET_LINE_HEIGHT);
      if (availableLines < 1) {
        y = startPacketContinuationPage(doc);
        continue;
      }
      const count = Math.min(availableLines, details.length - offset);
      const cardHeight = Math.max(12, 4 + (cardTitle.length + count) * PACKET_LINE_HEIGHT);
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN_LEFT, y, width, cardHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(PACKET_TEXT_SIZE);
      doc.setTextColor(0, 0, 0);
      doc.text(cardTitle, MARGIN_LEFT + 3, y + 3.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PACKET_TEXT_SIZE);
      doc.text(details.slice(offset, offset + count), MARGIN_LEFT + 3, y + 3.5 + cardTitle.length * PACKET_LINE_HEIGHT);
      y += cardHeight + 0.5;
      offset += count;
      if (offset < details.length) y = startPacketContinuationPage(doc);
    }
  });
  return y;
}

export function drawPacketFooter(doc: jsPDF, pageLabel: string): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 55, 55);
  doc.text('TulongPH is 100% free. Government assistance applications are free. Never pay fixers.', PAGE_WIDTH / 2, PACKET_FOOTER_Y - 4, { align: 'center' });
  doc.text('After public computer use, wipe this device data. This worksheet is guidance, not an approval.', PAGE_WIDTH / 2, PACKET_FOOTER_Y, { align: 'center' });
  doc.text(pageLabel, MARGIN_LEFT, PACKET_FOOTER_Y);
}
