import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const generateCertificate = (citizen: any) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // Draw Border
  doc.setDrawColor(20, 83, 45); // Dark green
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));
  
  doc.setLineWidth(0.2);
  doc.rect(margin + 2, margin + 2, pageWidth - (margin * 2) - 4, pageHeight - (margin * 2) - 4);

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('REPUBLIC OF RWANDA', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('CITY OF KIGALI', pageWidth / 2, 48, { align: 'center' });
  doc.text('KICUKIRO DISTRICT', pageWidth / 2, 54, { align: 'center' });
  doc.text('GATENGA SECTOR', pageWidth / 2, 60, { align: 'center' });
  doc.text('NYANZA CELL', pageWidth / 2, 66, { align: 'center' });
  doc.text('TABA VILLAGE', pageWidth / 2, 72, { align: 'center' });

  // Photo if available
  if (citizen.photoUrl) {
    try {
      doc.addImage(citizen.photoUrl, 'JPEG', pageWidth - margin - 40, 35, 30, 35);
    } catch (e) {
      console.error("Could not add image to PDF", e);
    }
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin + 10, 80, pageWidth - margin - 10, 80);

  // Title
  doc.setFontSize(22);
  doc.setTextColor(20, 83, 45);
  doc.text('CERTIFICATE OF RESIDENCE', pageWidth / 2, 100, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const contentY = 120;

  doc.text('This is to certify that:', margin + 15, contentY);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const fullName = `${citizen.firstName} ${citizen.lastName}`.toUpperCase();
  doc.text(fullName, pageWidth / 2, contentY + 15, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Identification Number: ${citizen.nationalId || 'N/A'}`, margin + 15, contentY + 30);
  doc.text(`Date of Birth: ${citizen.dob || 'N/A'}`, margin + 15, contentY + 40);
  doc.text(`Gender: ${citizen.gender || 'N/A'}`, margin + 15, contentY + 50);
  
  const addressText = `Is a resident of Taba Village, Nyanza Cell, Gatenga Sector, Kicukiro District. He/She belongs to Isibo: ${citizen.isibo || 'N/A'}. He/She is known to the local administration and has been living in this village.`;
  const splitAddress = doc.splitTextToSize(addressText, pageWidth - (margin * 2) - 30);
  doc.text(splitAddress, margin + 15, contentY + 65);

  const certNum = citizen.certificateNumber || 'CR-' + Math.floor(100000 + Math.random() * 900000);
  doc.text(`Certificate Number: ${certNum}`, margin + 15, contentY + 90);
  doc.text(`Issued Date: ${new Date().toLocaleDateString()}`, margin + 15, contentY + 100);

  // Signature Area
  const sigY = 240;
  doc.line(margin + 15, sigY, margin + 75, sigY);
  doc.text('Citizen Signature', margin + 15, sigY + 5);

  doc.line(pageWidth - margin - 75, sigY, pageWidth - margin - 15, sigY);
  doc.text('Village Leader Signature', pageWidth - margin - 75, sigY + 5);
  doc.text('& Stamp', pageWidth - margin - 75, sigY + 10);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('This document is issued for administrative purposes only.', pageWidth / 2, pageHeight - 15, { align: 'center' });

  doc.save(`Certificate_Residence_${fullName.replace(/\s+/g, '_')}.pdf`);
};

export const generateIDCard = (citizen: any) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 54] // Standard ID card size
  });
  
  // Background
  doc.setFillColor(240, 245, 255);
  doc.rect(0, 0, 85.6, 54, 'F');
  
  // Header
  doc.setFillColor(30, 58, 138); // Dark blue
  doc.rect(0, 0, 85.6, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TABA VILLAGE CITIZEN ID', 42.8, 8, { align: 'center' });
  
  // Photo
  if (citizen.photoUrl) {
    try {
      doc.addImage(citizen.photoUrl, 'JPEG', 5, 15, 20, 25);
    } catch (e) {
      doc.setDrawColor(200);
      doc.setFillColor(255, 255, 255);
      doc.rect(5, 15, 20, 25, 'FD');
      doc.setTextColor(150);
      doc.setFontSize(6);
      doc.text('PHOTO', 15, 28, { align: 'center' });
    }
  } else {
    doc.setDrawColor(200);
    doc.setFillColor(255, 255, 255);
    doc.rect(5, 15, 20, 25, 'FD');
    doc.setTextColor(150);
    doc.setFontSize(6);
    doc.text('PHOTO', 15, 28, { align: 'center' });
  }
  
  // Details
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('NAME:', 28, 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`${citizen.firstName} ${citizen.lastName}`, 28, 22);
  
  doc.setFont('helvetica', 'bold');
  doc.text('ID NUMBER:', 28, 28);
  doc.setFont('helvetica', 'normal');
  doc.text(citizen.nationalId, 28, 32);
  
  doc.setFont('helvetica', 'bold');
  doc.text('ISIBO:', 28, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(citizen.isibo || 'N/A', 28, 42);
  
  doc.setFont('helvetica', 'bold');
  doc.text('DOB:', 5, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(citizen.dob ? citizen.dob.toString() : 'N/A', 15, 45);
  
  // Footer
  doc.setFontSize(5);
  doc.text('Issued by Taba Village Administration', 42.8, 51, { align: 'center' });
  
  doc.save(`ID_Card_${citizen.name.replace(/\s+/g, '_')}.pdf`);
};

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
