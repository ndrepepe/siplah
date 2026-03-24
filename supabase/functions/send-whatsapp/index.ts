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

    // Ambil dan bersihkan Token & Nomor dari Secrets
    const FONNTE_TOKEN = Deno.env.get('WHATSAPP_API_KEY')?.trim()
    let TARGET_NUMBER = Deno.env.get('WHATSAPP_TARGET_NUMBER')?.trim()

    if (!FONNTE_TOKEN || !TARGET_NUMBER) {
      console.error("[send-whatsapp] Error: WHATSAPP_API_KEY atau WHATSAPP_TARGET_NUMBER tidak ditemukan di Secrets.")
      return new Response(JSON.stringify({ error: 'Konfigurasi Secrets belum lengkap' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Normalisasi Nomor Telepon (Khusus untuk 081804272204 -> 6281804272204)
    TARGET_NUMBER = TARGET_NUMBER.replace(/[^0-9]/g, '');
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

    console.log(`[send-whatsapp] Mencoba mengirim ke: ${TARGET_NUMBER} menggunakan token: ${FONNTE_TOKEN.substring(0, 5)}...`);

    // Menggunakan URLSearchParams untuk application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('target', TARGET_NUMBER);
    params.append('message', message);
    params.append('delay', '2');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
      },
      body: params,
    });

    const result = await response.json();
    console.log("[send-whatsapp] Respon Lengkap Fonnte:", JSON.stringify(result));

    if (result.status === false) {
      // Jika Fonnte memberikan alasan spesifik (misal: device disconnected)
      throw new Error(result.reason || "Gagal mengirim pesan (Cek status device di Fonnte)");
    }

    return new Response(JSON.stringify({ success: true, fonnte_response: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[send-whatsapp] CRITICAL ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})