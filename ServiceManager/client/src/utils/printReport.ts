import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function printReport(elementId: string, fileName = "report.pdf") {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error(`Element with ID "${elementId}" not found`);
    alert('Greška: Element nije pronađen');
    return;
  }

  try {
    // Provjeri da li je mobilna aplikacija
    if (Capacitor.isNativePlatform()) {
      console.log('Mobilna platforma - generišem PDF...');
      
      // Generiši canvas iz HTML elementa
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      // Konvertuj canvas u sliku
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      // Kreiraj PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Izračunaj dimenzije za A4 format
      const imgWidth = 210; // A4 širina u mm
      const pageHeight = 297; // A4 visina u mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Dodaj prvu stranicu
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Dodaj dodatne stranice ako je potrebno
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Konvertuj PDF u base64
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      
      // Sačuvaj PDF u cache direktorijum
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Cache,
      });

      console.log('PDF sačuvan:', savedFile.uri);

      // OtvoriShare dialog
      await Share.share({
        title: 'Izvještaj',
        text: 'Podijeli izvještaj',
        url: savedFile.uri,
        dialogTitle: 'Podijeli PDF'
      });

      console.log('PDF uspješno podijeljen');
      
    } else {
      // Za web browser - koristi html2pdf kao što već radiš
      console.log('Web platforma - koristim html2pdf...');
      
      const html2pdf = (await import('html2pdf.js')).default;
      
      const options = {
        margin: 0.5,
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      
      html2pdf().set(options).from(element).save();
    }
    
  } catch (error) {
    console.error('Greška prilikom generisanja PDF-a:', error);
    alert('Greška prilikom printanja: ' + (error as Error).message);
  }
}