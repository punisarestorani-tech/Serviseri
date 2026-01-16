import PDFDocument from 'pdfkit';
import { storage } from './storage';

interface ReportData {
  taskDescription: string;
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  applianceName?: string;
  applianceSerial?: string;
  applianceLocation?: string;
  reportDescription?: string;
  workDuration?: number;
  sparePartsUsed?: string;
  completedAt?: Date;
  technicianName?: string;
}

export async function generateReportPdf(reportId: string): Promise<Buffer> {
  const report = await storage.getReport(reportId);
  if (!report) {
    throw new Error('Report not found');
  }

  const task = report.taskId ? await storage.getTask(report.taskId) : null;
  const client = task?.clientId ? await storage.getClient(task.clientId) : null;
  const appliance = task?.applianceId ? await storage.getAppliance(task.applianceId) : null;
  
  let technicianName: string | undefined;
  if (task?.userId) {
    const user = await storage.getUser(task.userId);
    technicianName = user?.fullName || user?.username;
  }

  const data: ReportData = {
    taskDescription: task?.description || 'N/A',
    clientName: client?.name || 'N/A',
    clientAddress: client?.address || undefined,
    clientPhone: client?.contactPhone || undefined,
    applianceName: appliance 
      ? [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(' - ')
      : undefined,
    applianceSerial: appliance?.serial || undefined,
    applianceLocation: appliance 
      ? [appliance.city, appliance.building, appliance.room].filter(Boolean).join(' • ')
      : undefined,
    reportDescription: report.description,
    workDuration: report.workDuration || undefined,
    sparePartsUsed: report.sparePartsUsed || undefined,
    completedAt: task?.completedAt ? new Date(task.completedAt) : undefined,
    technicianName,
  };

  return createPdf(data);
}

function createPdf(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 50,
      info: {
        Title: 'Servisni Izvještaj',
        Author: 'Service Manager',
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).font('Helvetica-Bold').text('SERVISNI IZVJEŠTAJ', { align: 'center' });
    doc.moveDown(0.5);
    
    if (data.completedAt) {
      doc.fontSize(10).font('Helvetica').text(
        `Datum: ${data.completedAt.toLocaleDateString('sr-Latn-RS', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        { align: 'center' }
      );
    }
    
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    doc.fontSize(14).font('Helvetica-Bold').text('KLIJENT');
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Naziv: ${data.clientName}`);
    if (data.clientAddress) doc.text(`Adresa: ${data.clientAddress}`);
    if (data.clientPhone) doc.text(`Telefon: ${data.clientPhone}`);
    
    doc.moveDown(1);

    if (data.applianceName) {
      doc.fontSize(14).font('Helvetica-Bold').text('UREDAJ');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Naziv: ${data.applianceName}`);
      if (data.applianceSerial) doc.text(`Serijski broj: ${data.applianceSerial}`);
      if (data.applianceLocation) doc.text(`Lokacija: ${data.applianceLocation}`);
      doc.moveDown(1);
    }

    doc.fontSize(14).font('Helvetica-Bold').text('ZADATAK');
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica');
    doc.text(data.taskDescription);
    
    doc.moveDown(1);

    doc.fontSize(14).font('Helvetica-Bold').text('IZVJEŠTAJ O RADU');
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica');
    
    if (data.reportDescription) {
      doc.text(data.reportDescription);
      doc.moveDown(0.5);
    }

    if (data.workDuration) {
      doc.text(`Trajanje rada: ${data.workDuration} minuta`);
    }

    if (data.sparePartsUsed) {
      doc.text(`Utrošeni rezervni dijelovi: ${data.sparePartsUsed}`);
    }

    if (data.technicianName) {
      doc.moveDown(1);
      doc.text(`Tehničar: ${data.technicianName}`);
    }

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    doc.text('Ovaj dokument je automatski generisan putem Service Manager aplikacije.', { align: 'center' });

    doc.end();
  });
}
