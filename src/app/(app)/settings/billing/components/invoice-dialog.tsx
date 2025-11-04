'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { Client } from '@/lib/types';
import { packages as subscriptionPackages } from '../packages-data';

type InvoiceDialogProps = {
  client: Client;
  packageName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InvoiceDialog({ client, packageName, open, onOpenChange }: InvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadPdf = () => {
    setIsLoading(true);
    
    const pkg = subscriptionPackages.find(p => p.name === packageName);
    const tier = pkg?.tiers?.[0];
    if (!pkg || !tier) {
      setIsLoading(false);
      return;
    }

    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(22, 22, 22);
    doc.text('BookYourBrands', margin, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const addressLines = [
      'Shop No 14, Vishwakarma Nagar building. 03',
      '60 feet road, Landmark:, opposite old swaminarayan temple,',
      'Vasai West, Vasai-Virar, Maharashtra 401202',
    ]
    doc.text(addressLines, margin, 75);
    doc.text('contact@bookyourbrands.com', margin, 75 + (addressLines.length * 12));

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(22, 22, 22);
    doc.text('INVOICE', pageWidth - margin, 60, { align: 'right' });

    y = 140;
    doc.setLineWidth(1);
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 30;

    // --- Bill To & Invoice Details ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('BILL TO', margin, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(22, 22, 22);
    doc.text(client.name, margin, y + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(client.company, margin, y + 35);
    doc.text(client.email, margin, y + 50);
    
    const invoiceDate = format(new Date(), 'PPP');
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
    
    let rightColY = y;
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice #:', pageWidth - margin - 100, rightColY);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceNum, pageWidth - margin, rightColY, { align: 'right' });
    rightColY += 20; // Increased spacing
    
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Date:', pageWidth - margin - 100, rightColY);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceDate, pageWidth - margin, rightColY, { align: 'right' });
    
    y += 80;

    // --- Table Header ---
    doc.setFillColor(248, 248, 248);
    doc.rect(margin, y, contentWidth, 30, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(22, 22, 22);
    doc.text('DESCRIPTION', margin + 15, y + 20);
    doc.text('PRICE', pageWidth - margin - 15, y + 20, { align: 'right' });
    y += 45;

    // --- Table Content ---
    doc.setFont('helvetica', 'normal');
    doc.text(`${packageName} Plan Subscription`, margin + 15, y);
    doc.text(`₹${tier.price}/-`, pageWidth - margin - 15, y, { align: 'right' });
    y += 20;

    doc.setDrawColor(240, 240, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 30;

    // --- Total ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Total', pageWidth - margin - 100, y);
    doc.text(`₹${tier.price}/-`, pageWidth - margin, y, { align: 'right' });
    y += 60;
    
    // --- Notes ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('NOTES', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 22, 22);
    doc.text('Thank you for your business!', margin, y + 15);
    y += 30;

    // --- Stamp ---
    const stampY = doc.internal.pageSize.getHeight() - 150;
    doc.setDrawColor(40, 120, 180);
    doc.setLineWidth(3);
    doc.setLineDashPattern([5, 5], 0);
    doc.roundedRect(margin, stampY, 140, 60, 10, 10, 'S');
    doc.setLineDashPattern([], 0);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(40, 120, 180);
    doc.text('BookYourBrands', margin + 70, stampY + 30, { align: 'center' });
    doc.setFontSize(8);
    doc.text('OFFICIAL', margin + 70, stampY + 45, { align: 'center' });

    // --- Signature ---
    const signatureY = doc.internal.pageSize.getHeight() - 130;
    doc.setFont('times', 'italic');
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text('Arpit Lalani', pageWidth - margin - 100, signatureY);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - margin - 180, signatureY + 10, pageWidth - margin, signatureY + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Founder and CEO', pageWidth - margin, signatureY + 25, { align: 'right' });


    doc.save(`invoice_${client.name.replace(/\s/g, '_')}_${invoiceNum}.pdf`);
    
    setIsLoading(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade Successful!</DialogTitle>
          <DialogDescription>
            Your plan has been upgraded to {packageName}. You can now download your invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-8">
            <Button onClick={handleDownloadPdf} disabled={isLoading} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                Download Invoice PDF
            </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
