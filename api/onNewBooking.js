import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { SUPABASE_URL, SUPABASE_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('id', { ascending: false })
      .limit(1);
    if (error) throw error;

    const booking = bookings[0];
    const doc = new PDFDocument();
    const filePath = path.join('/tmp', `voucher_${booking.id}.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('Bali Expert Vacation - Booking Voucher', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${booking.name}`);
    doc.text(`WhatsApp: ${booking.whatsapp}`);
    doc.text(`Participants: ${booking.participants}`);
    doc.text(`Date: ${booking.date_from} - ${booking.date_to}`);
    doc.text(`Selected Itinerary: ${booking.selected_itinerary}`);
    doc.text(`Mode: ${booking.mode}`);
    doc.text(`Total Price: IDR ${booking.total_price}`);
    doc.end();

    await new Promise(resolve => stream.on('finish', resolve));
    res.status(200).json({ message: 'Voucher generated', file: filePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
