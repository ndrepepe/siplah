// @ts-ignore: Deno imports are not recognized by standard TS compiler
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

// Declare Deno for the compiler
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { school_name, po_number, transaction_amount, code } = await req.json()

    const FONNTE_TOKEN = Deno.env.get('WHATSAPP_API_KEY')
    let TARGET_NUMBER = Deno.env.get('WHATSAPP_TARGET_NUMBER')

    if (!FONNTE_TOKEN || !TARGET_NUMBER) {
      console.error("[send-whatsapp] Error: API Key atau Nomor Tujuan belum diatur di Secrets.")
      return new Response(JSON.stringify({ error: 'Konfigurasi di Supabase Secrets belum lengkap' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Normalisasi Nomor Telepon: Ubah 08... menjadi 628...
    TARGET_NUMBER = TARGET_NUMBER.replace(/[^0-9]/g, ''); // Hanya ambil angka
    if (TARGET_NUMBER.startsWith('0')) {
      TARGET_NUMBER = '62' + TARGET_NUMBER.slice(1);
    } else if (TARGET_NUMBER.startsWith('8')) {
      TARGET_NUMBER = '62' + TARGET_NUMBER;
    }

    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(transaction_amount);

    const message = `🚀 *TRANSAKSI BARU!*\n\n` +
                    `🏫 *Sekolah:* ${school_name}\n` +
                    `📄 *No PO:* ${po_number}\n` +
                    `💰 *Nominal:* ${formattedAmount}\n` +
                    `🔑 *Kode:* ${code}\n\n` +
                    `_Pesan otomatis dari Grand Line Manager_`;

    console.log(`[send-whatsapp] Mengirim ke: ${TARGET_NUMBER}`);

    // Menggunakan FormData karena Fonnte lebih stabil dengan format ini
    const formData = new FormData();
    formData.append('target', TARGET_NUMBER);
    formData.append('message', message);
    formData.append('delay', '2'); // Tambahkan delay sedikit agar tidak dianggap spam

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
      },
      body: formData,
    });

    const result = await response.json();
    console.log("[send-whatsapp] Respon Fonnte:", result);

    if (result.status === false) {
      throw new Error(result.reason || "Gagal mengirim pesan via Fonnte");
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[send-whatsapp] Error Detail:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})