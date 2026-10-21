'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileText, RefreshCw, ShieldAlert, Trash2, Upload } from 'lucide-react';
import type { DocumentType, StoredDocument } from '@/types/assistance';
import { convertAndCompressImageToPdf, formatBytes, getStandardizedDocFileName } from '@/lib/compressor';
import { getDocumentSlotsForPillar, getProgramReadiness, type DocumentVaultPillar } from '@/lib/documentVault';
import { createEncryptedBackup, restoreEncryptedBackup } from '@/lib/encryptedBackup';
import type { RestoreErrorCode } from '@/lib/encryptedBackup';
import { getWipeGeneration, isWipingInProgress } from '@/lib/storage';
import { translations, type Language } from '@/lib/i18n';

export { DOCUMENT_SLOTS } from '@/lib/documentVault';

const backupCopy: Record<Language, {
  title: string;
  createHeading: string;
  restoreHeading: string;
  warning: string;
  description: string;
  password: string;
  confirmPassword: string;
  create: string;
  restorePassword: string;
  file: string;
  noFile: string;
  restore: string;
  replaceNote: string;
  confirmRestore: string;
  created: string;
  restored: (count: number) => string;
  passwordMismatch: string;
  missingPassword: string;
  missingFile: string;
  failed: string;
  restoreErrors: Record<RestoreErrorCode, string>;
}> = {
  taglish: {
    title: 'Backup at Restore',
    createHeading: 'Gumawa ng backup',
    restoreHeading: 'I-restore ang backup',
    warning: 'Babala: Gamitin lamang ito sa inyong personal na cellphone o computer. Huwag i-save sa computer shop o pisonet upang manatiling pribado ang inyong datos.',
    description: 'Gumawa ng encrypted backup na mabubuksan lamang gamit ang password mo. Nananatili sa device ang pag-encrypt at pag-decrypt.',
    password: 'Password para sa backup',
    confirmPassword: 'Ulitin ang password',
    create: 'I-download ang encrypted backup',
    restorePassword: 'Password ng backup',
    file: 'Backup file (.tulongph)',
    noFile: 'Wala pang napipiling backup file.',
    restore: 'I-restore at palitan ang kasalukuyang records',
    replaceNote: 'Papalitan ng backup ang kasalukuyang records at documents sa device na ito.',
    confirmRestore: 'Papalitan ng backup na ito ang kasalukuyang records sa device na ito. Ituloy ang restore?',
    created: 'Na-download ang encrypted backup.',
    restored: (count) => `Na-restore ang ${count} records. Nire-refresh ang app.`,
    passwordMismatch: 'Hindi magkatugma ang mga password.',
    missingPassword: 'Ilagay ang password para magpatuloy.',
    missingFile: 'Pumili muna ng backup file.',
    failed: 'Hindi natuloy ang backup o restore. Suriin ang password at storage ng device.',
    restoreErrors: {
      RESTORE_LOCK_BUSY: 'May kasalukuyang restore o pagbura ng datos. Hintayin itong matapos bago subukan muli.',
      RESTORE_ABORTED_BY_WIPE: 'Itinigil ang restore dahil sinimulan ang pagbura ng pribadong datos. Hindi ibinalik ang dating records.',
      INVALID_PASSWORD_OR_CORRUPTED: 'Hindi mabuksan ang backup. Mali ang password o sira ang encrypted file; hindi ginalaw ang kasalukuyang records.',
      INVALID_FORMAT: 'Hindi ito valid na TulongPH backup file. Nanatili ang kasalukuyang records.',
      CORRUPTED_PAYLOAD: 'Nabuksan ang file pero hindi wasto ang laman. Hindi ginalaw ang kasalukuyang records.',
      RESTORE_FAILED_ROLLBACK_SUCCEEDED: 'Hindi natuloy ang restore, pero ligtas na naibalik ang dati mong records.',
      RESTORE_FAILED_ROLLBACK_FAILED: 'Hindi natuloy ang restore at nabigo ang pagbawi sa dating records. Suriin agad ang saved data at huwag munang mag-edit.',
    },
  },
  cebuano: {
    title: 'Backup ug Restore',
    createHeading: 'Paghimo og backup',
    restoreHeading: 'Pagpahiuli sa backup',
    warning: 'Pasidaan: Gamita lamang kini sa imong personal nga cellphone o computer. Ayaw kini i-save sa computer shop o pisonet aron magpabilin nga pribado ang imong datos.',
    description: 'Paghimo og encrypted backup nga maablihan lamang pinaagi sa imong password. Dinhi ra sa device himoon ang pag-encrypt ug pag-decrypt.',
    password: 'Password sa backup',
    confirmPassword: 'Isulod pag-usab ang password',
    create: 'I-download ang encrypted backup',
    restorePassword: 'Password sa backup',
    file: 'Backup file (.tulongph)',
    noFile: 'Wala pay napiling backup file.',
    restore: 'I-restore ug pulihan ang kasamtangang records',
    replaceNote: 'Pulihan sa backup ang kasamtangang records ug documents niining device.',
    confirmRestore: 'Pulihan niini nga backup ang kasamtangang records niining device. Mopadayon ka?',
    created: 'Na-download na ang encrypted backup.',
    restored: (count) => `Na-restore ang ${count} ka records. Gi-refresh ang app.`,
    passwordMismatch: 'Dili magkapareho ang mga password.',
    missingPassword: 'Isulod ang password aron mopadayon.',
    missingFile: 'Pilia una ang backup file.',
    failed: 'Napakyas ang backup o restore. Susiha ang password ug storage sa device.',
    restoreErrors: {
      RESTORE_LOCK_BUSY: 'Adunay nagpadayon nga restore o pagpahid sa datos. Hulata kini mahuman una mosulay pag-usab.',
      RESTORE_ABORTED_BY_WIPE: 'Gihunong ang restore kay gisugdan ang pagpahid sa pribadong datos. Wala ibalik ang daang records.',
      INVALID_PASSWORD_OR_CORRUPTED: 'Dili maablihan ang backup. Sayop ang password o nadaot ang encrypted file; wala hilabti ang kasamtangang records.',
      INVALID_FORMAT: 'Dili kini balidong TulongPH backup file. Nagpabilin ang kasamtangang records.',
      CORRUPTED_PAYLOAD: 'Naablihan ang file apan dili balido ang sulod. Wala hilabti ang kasamtangang records.',
      RESTORE_FAILED_ROLLBACK_SUCCEEDED: 'Napakyas ang restore, apan nabalik nga luwas ang imong daang records.',
      RESTORE_FAILED_ROLLBACK_FAILED: 'Napakyas ang restore ug wala molampos ang pagbalik sa daang records. Susiha dayon ang saved data ug ayaw una pag-edit.',
    },
  },
  ilocano: {
    title: 'Backup ken Restore',
    createHeading: 'Agaramid iti backup',
    restoreHeading: 'Isubli ti backup',
    warning: 'Pakdaar: Usaren laeng daytoy iti bukodmo a cellphone wenno computer. Dimo i-save iti computer shop wenno pisonet tapno agtalinaed a pribado dagiti datosmo.',
    description: 'Mangaramid iti encrypted backup a mabalin laeng a luktan babaen iti passwordmo. Iti device laeng maaramid ti encryption ken decryption.',
    password: 'Password ti backup',
    confirmPassword: 'I-type manen ti password',
    create: 'I-download ti encrypted backup',
    restorePassword: 'Password ti backup',
    file: 'Backup file (.tulongph)',
    noFile: 'Awan pay napili a backup file.',
    restore: 'I-restore ken sukatam dagiti agdama a rekord',
    replaceNote: 'Suksukatan ti backup dagiti agdama a rekord ken dokumento iti daytoy a device.',
    confirmRestore: 'Suksukatan daytoy a backup dagiti agdama a rekord iti daytoy a device. Ituloy ti restore?',
    created: 'Na-download ti encrypted backup.',
    restored: (count) => `Na-restore dagiti ${count} a rekord. I-refresh ti app.`,
    passwordMismatch: 'Saan a nagtutunos dagiti password.',
    missingPassword: 'Ilagay ti password tapno agtultuloy.',
    missingFile: 'Pilien pay laeng ti backup file.',
    failed: 'Saan a napasamak ti backup wenno restore. Kitaen ti password ken storage ti device.',
    restoreErrors: {
      RESTORE_LOCK_BUSY: 'Adda agtultuloy a restore wenno panangikkat iti datos. Urayem a malpas sakbay a padasem manen.',
      RESTORE_ABORTED_BY_WIPE: 'Naisardeng ti restore gapu ta nangrugi ti panangikkat iti pribado a datos. Saan a naisubli dagiti dati a rekord.',
      INVALID_PASSWORD_OR_CORRUPTED: 'Saan a mailukat ti backup. Di umiso ti password wenno nadadael ti encrypted file; saan a nagbaliw dagiti agdama a rekord.',
      INVALID_FORMAT: 'Saan a mabalin daytoy a TulongPH backup file. Agtalinaed dagiti agdama a rekord.',
      CORRUPTED_PAYLOAD: 'Nailukat ti file ngem saan a husto ti linaonna. Saan a nagbaliw dagiti agdama a rekord.',
      RESTORE_FAILED_ROLLBACK_SUCCEEDED: 'Saan a nagballigi ti restore, ngem natalged a naisubli dagiti dati a rekordmo.',
      RESTORE_FAILED_ROLLBACK_FAILED: 'Saan a nagballigi ti restore ken ti panangisubli kadagiti dati a rekord. Kitaen a dagus ti na-save a datos ken saan pay nga ag-edit.',
    },
  },
  en: {
    title: 'Backup and Restore',
    createHeading: 'Create a backup',
    restoreHeading: 'Restore a backup',
    warning: 'Warning: Use this only on your personal phone or computer. Do not save it on a computer shop or pisonet computer so your data stays private.',
    description: 'Create an encrypted backup that can only be opened with your password. Encryption and decryption happen on this device.',
    password: 'Backup password',
    confirmPassword: 'Confirm password',
    create: 'Download encrypted backup',
    restorePassword: 'Backup password',
    file: 'Backup file (.tulongph)',
    noFile: 'No backup file selected yet.',
    restore: 'Restore and replace current records',
    replaceNote: 'The backup will replace the records and documents currently saved on this device.',
    confirmRestore: 'This backup will replace the records currently saved on this device. Continue with restore?',
    created: 'Encrypted backup downloaded.',
    restored: (count) => `Restored ${count} records. Refreshing the app.`,
    passwordMismatch: 'The passwords do not match.',
    missingPassword: 'Enter the password to continue.',
    missingFile: 'Choose a backup file first.',
    failed: 'Backup or restore failed. Check the password and device storage.',
    restoreErrors: {
      RESTORE_LOCK_BUSY: 'A restore or privacy wipe is already in progress. Wait for it to finish before trying again.',
      RESTORE_ABORTED_BY_WIPE: 'The restore stopped because a privacy wipe was started. Previous records were not restored.',
      INVALID_PASSWORD_OR_CORRUPTED: 'The backup could not be opened. The password is wrong or the encrypted file is damaged; your current records were not changed.',
      INVALID_FORMAT: 'This is not a valid TulongPH backup file. Your current records remain unchanged.',
      CORRUPTED_PAYLOAD: 'The file opened, but its contents are invalid. Your current records were not changed.',
      RESTORE_FAILED_ROLLBACK_SUCCEEDED: 'The restore did not finish, but your previous records were safely restored.',
      RESTORE_FAILED_ROLLBACK_FAILED: 'The restore failed and the previous records could not be recovered. Check your saved data now and avoid editing until you confirm it.',
    },
  },
};

interface DocumentVaultProps {
  documents: StoredDocument[];
  onUpdateDocuments: (docs: StoredDocument[]) => void;
  applicantName?: string;
  language: Language;
  currentPillar?: DocumentVaultPillar;
}

export function DocumentVault({
  documents,
  onUpdateDocuments,
  applicantName = '',
  language,
  currentPillar = 'all',
}: DocumentVaultProps) {
  const t = translations[language];
  const [processingType, setProcessingType] = useState<DocumentType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backupPassword, setBackupPassword] = useState('');
  const [backupPasswordConfirmation, setBackupPasswordConfirmation] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const restoreInput = useRef<HTMLInputElement>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const backup = backupCopy[language];
  const slots = getDocumentSlotsForPillar(currentPillar);
  const readiness = getProgramReadiness(documents, currentPillar);

  const getDoc = (type: DocumentType) => documents.find((document) => document.docType === type);

  async function handleFileUpload(type: DocumentType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessingType(type);
    setErrorMessage(null);
    try {
      const startGen = getWipeGeneration();
      const fileName = getStandardizedDocFileName(applicantName, type);
      const result = await convertAndCompressImageToPdf(file, fileName);
      if (getWipeGeneration() !== startGen) return;
      const newDocument: StoredDocument = {
        id: `${type}_${Date.now()}`,
        docType: type,
        fileName: result.fileName,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        mimeType: result.mimeType,
        dataUrl: result.dataUrl,
        attachmentDataUrl: result.attachmentDataUrl,
        uploadedAt: new Date().toISOString(),
        isCompliantUnder2MB: result.isCompliantUnder2MB,
      };
      onUpdateDocuments(documents.filter((document) => document.docType !== type).concat(newDocument));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process document';
      setErrorMessage(message);
    } finally {
      setProcessingType(null);
      event.target.value = '';
    }
  }

  function handleRemoveDoc(type: DocumentType) {
    onUpdateDocuments(documents.filter((document) => document.docType !== type));
  }

  async function handleCreateBackup() {
    setBackupFeedback(null);
    if (!backupPassword) {
      setBackupFeedback({ error: true, message: backup.missingPassword });
      return;
    }
    if (backupPassword !== backupPasswordConfirmation) {
      setBackupFeedback({ error: true, message: backup.passwordMismatch });
      return;
    }

    const wipeGenBefore = getWipeGeneration();
    if (isWipingInProgress()) {
      setBackupFeedback({ error: true, message: backup.failed });
      return;
    }

    setBackupBusy(true);
    try {
      const blob = await createEncryptedBackup(backupPassword);
      if (isWipingInProgress() || getWipeGeneration() !== wipeGenBefore) {
        setBackupFeedback({ error: true, message: backup.failed });
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `TulongPH-Backup-${new Date().toISOString().slice(0, 10)}.tulongph`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBackupFeedback({ error: false, message: backup.created });
      setBackupPassword('');
      setBackupPasswordConfirmation('');
    } catch {
      setBackupFeedback({ error: true, message: backup.failed });
    } finally {
      setBackupBusy(false);
    }
  }

  async function handleRestoreBackup() {
    setBackupFeedback(null);
    if (!restorePassword) {
      setBackupFeedback({ error: true, message: backup.missingPassword });
      return;
    }
    if (!restoreFile) {
      setBackupFeedback({ error: true, message: backup.missingFile });
      return;
    }
    if (!window.confirm(backup.confirmRestore)) return;

    setBackupBusy(true);
    try {
      const result = await restoreEncryptedBackup(restoreFile, restorePassword);
      if (!result.success) {
        setBackupFeedback({ error: true, message: backup.restoreErrors[result.code] });
        return;
      }
      setBackupFeedback({ error: false, message: backup.restored(result.itemCount) });
      setRestorePassword('');
      setRestoreFile(null);
      if (restoreInput.current) restoreInput.current.value = '';
    } catch {
      setBackupFeedback({ error: true, message: backup.failed });
    } finally {
      setBackupBusy(false);
    }
  }

  const title = currentPillar === 'all' ? 'All program documents'
    : currentPillar === 'medical' ? 'Medical assistance documents'
      : currentPillar === 'education' ? 'Education assistance documents'
        : 'Worker assistance documents';

  return <section className="space-y-4" aria-label={title}>
    <header className="rounded-2xl border border-[#E2DFD6] bg-white p-4 text-slate-900 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950">CLIENT-SIDE VAULT</span>
            <span className="text-xs font-medium text-slate-600">Compressed image PDFs, under 2 MB when compliant</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
            {language === 'taglish'
              ? 'Nananatili sa device mo ang mga dokumento. Pumili ng larawan para gumawa ng compressed PDF na maaari mong i-download at ilakip sa packet.'
              : 'Documents stay on this device. Choose an image to create a compressed PDF you can download and include in a packet.'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:max-w-[32rem]">
          {readiness.map(({ program, ready, total }) => (
            <div key={program} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-xs font-semibold text-slate-700">{program}</div>
              <div className="text-sm font-bold text-slate-950">{ready} / {total} docs ready</div>
            </div>
          ))}
        </div>
      </div>
    </header>

    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <ShieldAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
      <p>
        <strong>Private on this device:</strong> Uploads are processed in your browser and saved locally. This vault accepts image files; PDF uploads are not supported yet. Program readiness is a preparation aid, not an eligibility decision.
      </p>
    </div>

    {errorMessage && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0" />
      <span>{errorMessage}</span>
    </div>}

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {slots.map((slot) => {
        const document = getDoc(slot.type);
        const isProcessing = processingType === slot.type;
        const isUploaded = Boolean(document);
        const isCompliant = Boolean(document?.isCompliantUnder2MB);

        return <article key={slot.type} className={`min-w-0 rounded-2xl border p-4 ${isCompliant ? 'border-emerald-400 bg-white' : 'border-[#E2DFD6] bg-white'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                {isCompliant ? <CheckCircle2 aria-hidden="true" className="h-5 w-5" /> : <FileText aria-hidden="true" className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-950">{language === 'taglish' ? slot.labelTl : slot.labelEn}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-700">{language === 'taglish' ? slot.helperTl : slot.helperEn}</p>
                <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Related programs">
                  {slot.programs.map((program) => <span key={program} className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{program}</span>)}
                </div>
              </div>
            </div>
            {document && <button type="button" onClick={() => handleRemoveDoc(slot.type)}
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900"
              aria-label={language === 'taglish' ? `Alisin ang ${slot.labelTl}` : `Remove ${slot.labelEn}`}>
              <Trash2 aria-hidden="true" className="h-5 w-5" />
            </button>}
          </div>

          {document && <div className="mt-4 flex min-w-0 flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-xs">
              <div className="truncate font-semibold text-slate-900">{document.fileName}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-700">
                <span className={`rounded border px-2 py-1 font-bold ${isCompliant ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-300 bg-amber-50 text-amber-950'}`}>
                  {formatBytes(document.compressedSize)} {isCompliant ? `<2 MB ${t.compliantBadge}` : 'Over 2 MB'}
                </span>
                <span>Original: {formatBytes(document.originalSize)}</span>
              </div>
            </div>
            {document.dataUrl && <a href={document.dataUrl} download={document.fileName}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-bold text-blue-950 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900">
              <Download aria-hidden="true" className="h-4 w-4" />{language === 'taglish' ? 'I-download ang PDF' : 'Download PDF'}
            </a>}
          </div>}

          <div className="mt-4 border-t border-slate-100 pt-3">
            <label htmlFor={`vault-upload-${slot.type}`} className="relative flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-blue-950 hover:border-blue-400 hover:bg-blue-50 focus-within:outline focus-within:outline-2 focus-within:outline-blue-900">
              {isProcessing ? <><RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin" /><span>Compressing image...</span></>
                : <><Upload aria-hidden="true" className="h-4 w-4" /><span>{isUploaded ? 'Replace image' : 'Select an image'}</span></>}
              <input id={`vault-upload-${slot.type}`} name={`vault-upload-${slot.type}`} type="file" accept="image/*" autoComplete="off"
                aria-label={language === 'taglish' ? `Mag-upload ng ${slot.labelTl}` : `Upload ${slot.labelEn}`} disabled={processingType !== null}
                onChange={(event) => void handleFileUpload(slot.type, event)} className="sr-only" />
            </label>
          </div>
        </article>;
      })}
    </div>

    <p className="text-xs leading-relaxed text-slate-700">
      {language === 'taglish'
        ? 'Kumpirmahin ang kasalukuyang requirements sa ahensya o paaralan. Hindi garantiya ng eligibility, pondo, o approval ang bilang na ito.'
        : 'Confirm current requirements with the agency or school. These counts do not guarantee eligibility, funding, or approval.'}
    </p>

    <details className="rounded-2xl border border-[#E2DFD6] bg-white text-slate-900">
      <summary className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900 sm:px-5">
        <span>{backup.title}</span>
        <span aria-hidden="true" className="text-slate-600">+</span>
      </summary>
      <div className="space-y-4 border-t border-slate-200 p-4 sm:p-5">
        <div role="note" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-950">
          <ShieldAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
          <p>{backup.warning}</p>
        </div>
        <p className="text-xs leading-relaxed text-slate-700">{backup.description}</p>

        <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-950">{backup.createHeading}</h3>
            <label htmlFor="vault-backup-password" className="block text-xs font-bold text-slate-800">
              {backup.password}
              <input id="vault-backup-password" type="password" autoComplete="off" value={backupPassword}
                onChange={(event) => setBackupPassword(event.target.value)} disabled={backupBusy}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900" />
            </label>
            <label htmlFor="vault-backup-password-confirm" className="block text-xs font-bold text-slate-800">
              {backup.confirmPassword}
              <input id="vault-backup-password-confirm" type="password" autoComplete="off" value={backupPasswordConfirmation}
                onChange={(event) => setBackupPasswordConfirmation(event.target.value)} disabled={backupBusy}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900" />
            </label>
            <button type="button" onClick={() => void handleCreateBackup()} disabled={backupBusy}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-950 disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900">
              <Download aria-hidden="true" className="h-4 w-4" />{backup.create}
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-950">{backup.restoreHeading}</h3>
            <label htmlFor="vault-restore-file" className="block text-xs font-bold text-slate-800">
              {backup.file}
              <input ref={restoreInput} id="vault-restore-file" type="file" accept=".tulongph,application/octet-stream" autoComplete="off"
                onChange={(event) => setRestoreFile(event.target.files?.[0] ?? null)} disabled={backupBusy}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 file:mr-3 file:min-h-[44px] file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:font-bold file:text-blue-950" />
            </label>
            <p className="min-h-5 text-xs text-slate-600">{restoreFile?.name ?? backup.noFile}</p>
            <label htmlFor="vault-restore-password" className="block text-xs font-bold text-slate-800">
              {backup.restorePassword}
              <input id="vault-restore-password" type="password" autoComplete="off" value={restorePassword}
                onChange={(event) => setRestorePassword(event.target.value)} disabled={backupBusy}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900" />
            </label>
            <p className="text-xs leading-relaxed text-amber-900">{backup.replaceNote}</p>
            <button type="button" onClick={() => void handleRestoreBackup()} disabled={backupBusy}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-blue-900 bg-white px-4 py-2.5 text-xs font-bold text-blue-950 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900">
              <Upload aria-hidden="true" className="h-4 w-4" />{backup.restore}
            </button>
          </div>
        </div>

        {backupBusy && <p role="status" className="text-xs font-semibold text-slate-700">{language === 'taglish' ? 'Pinoproseso sa device na ito...' : language === 'cebuano' ? 'Giproseso dinhi sa device...' : language === 'ilocano' ? 'Agproseso ditoy a device...' : 'Processing on this device...'}</p>}
        {backupFeedback && <p role={backupFeedback.error ? 'alert' : 'status'} className={`rounded-xl border p-3 text-xs font-semibold ${backupFeedback.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
          {backupFeedback.message}
        </p>}
      </div>
    </details>
  </section>;
}
