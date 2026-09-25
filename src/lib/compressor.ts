import { jsPDF } from 'jspdf';
import { DocumentType } from '@/types/assistance';

export interface CompressionResult {
  fileName: string;
  originalSize: number;
  compressedSize: number;
  mimeType: string;
  dataUrl: string;
  blob: Blob;
  isCompliantUnder2MB: boolean;
  reductionPercentage: number;
}

const MAX_TARGET_BYTES = 1.95 * 1024 * 1024; // 1.95 MB (Safe ceiling for PCSO 2MB max)

/**
 * Compresses an image file (JPEG, PNG, WEBP, etc.) and converts it into a compliant PDF under 2MB.
 */
export async function convertAndCompressImageToPdf(
  file: File,
  targetFileName?: string
): Promise<CompressionResult> {
  const originalSize = file.size;
  const fileName = targetFileName || file.name.replace(/\.[^/.]+$/, '') + '.pdf';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read uploaded file'));
    reader.onload = async (e) => {
      try {
        const img = new Image();
        img.onerror = () => reject(new Error('Could not parse image data'));
        img.onload = async () => {
          // Standard A4 dimensions in mm: 210 x 297
          // Let's create an off-screen canvas to scale and optimize contrast
          let width = img.width;
          let height = img.height;

          // Scale down high-res phone captures (e.g. 4000x3000 down to max 1800px on long edge)
          const MAX_DIMENSION = 1800;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context not available');
          }

          // Fill white background in case of transparent PNGs
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Iterative quality reduction if needed
          let quality = 0.85;
          let jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
          let pdfBlob = await renderPdfFromJpeg(jpegDataUrl, width, height);

          while (pdfBlob.size > MAX_TARGET_BYTES && quality > 0.3) {
            quality -= 0.15;
            jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
            pdfBlob = await renderPdfFromJpeg(jpegDataUrl, width, height);
          }

          // If still over 2MB, downscale canvas dimensions
          if (pdfBlob.size > MAX_TARGET_BYTES) {
            canvas.width = Math.round(width * 0.7);
            canvas.height = Math.round(height * 0.7);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            jpegDataUrl = canvas.toDataURL('image/jpeg', 0.65);
            pdfBlob = await renderPdfFromJpeg(jpegDataUrl, canvas.width, canvas.height);
          }

          const compressedSize = pdfBlob.size;
          const reductionPercentage = Math.max(
            0,
            Math.round(((originalSize - compressedSize) / originalSize) * 100)
          );
          const pdfDataUrl = URL.createObjectURL(pdfBlob);

          resolve({
            fileName,
            originalSize,
            compressedSize,
            mimeType: 'application/pdf',
            dataUrl: pdfDataUrl,
            blob: pdfBlob,
            isCompliantUnder2MB: compressedSize <= 2 * 1024 * 1024,
            reductionPercentage,
          });
        };
        img.src = e.target?.result as string;
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Embeds image into an A4 PDF document fitted nicely with standard margins.
 */
function renderPdfFromJpeg(jpegDataUrl: string, imgWidth: number, imgHeight: number): Promise<Blob> {
  return new Promise((resolve) => {
    const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;
    const margin = 10; // 10mm margins

    const availWidth = pageWidth - margin * 2;
    const availHeight = pageHeight - margin * 2;

    const imgAspect = imgWidth / imgHeight;
    const availAspect = availWidth / availHeight;

    let finalW = availWidth;
    let finalH = availHeight;

    if (imgAspect > availAspect) {
      // Image is wider than available page area
      finalW = availWidth;
      finalH = availWidth / imgAspect;
    } else {
      // Image is taller
      finalH = availHeight;
      finalW = availHeight * imgAspect;
    }

    const posX = (pageWidth - finalW) / 2;
    const posY = (pageHeight - finalH) / 2;

    pdf.addImage(jpegDataUrl, 'JPEG', posX, posY, finalW, finalH, undefined, 'FAST');
    const blob = pdf.output('blob');
    resolve(blob);
  });
}

/**
 * Standardizes filename based on patient name and document requirement type
 */
export function getStandardizedDocFileName(
  patientLastName: string,
  docType: DocumentType
): string {
  const cleanLastName = patientLastName.trim().replace(/[^a-zA-Z0-9]/g, '') || 'Patient';
  const docLabels: Record<DocumentType, string> = {
    clinical_abstract: 'MedicalAbstract',
    statement_of_account: 'HospitalSOA',
    barangay_indigency: 'BarangayIndigency',
    patient_valid_id: 'PatientValidID',
    representative_valid_id: 'RepresentativeID',
    authorization_letter: 'AuthorizationLetter',
    proof_of_relationship: 'ProofOfRelationship',
    social_case_study: 'SocialCaseStudy',
    doctor_prescription: 'DoctorPrescription',
    death_certificate: 'DeathCertificate',
  };

  const label = docLabels[docType] || 'Document';
  return `${cleanLastName}_${label}.pdf`;
}

/**
 * Formats byte size to human readable KB/MB
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
