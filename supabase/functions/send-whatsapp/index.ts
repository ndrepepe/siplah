// @ts-ignore: Deno imports are not recognized by standard TS compiler
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("[send-whatsapp] Menerima permintaan pengiriman...");
    
    const body = await req.json()
    const { school_name, po_number, transaction_amount, code, message: customMessage } = body

    // Ambil Token & Nomor dari Secrets
    // @ts-ignore: Deno is available in the runtime
    const FONNTE_TOKEN = Deno.env.get('WHATSAPP_API_KEY')?.trim()
    // @ts-ignore: Deno is available in the runtime
    let TARGET_NUMBER = Deno.env.get('WHATSAPP_TARGET_NUMBER')?.trim()

    if (!FONNTE_TOKEN || !TARGET_NUMBER) {
      console.error("[send-whatsapp] Error: WHATSAPP_API_KEY atau WHATSAPP_TARGET_NUMBER tidak ditemukan di Secrets.")
      return new Response(JSON.stringify({ error: 'Konfigurasi API Key atau Nomor Tujuan belum diatur di Supabase Secrets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Normalisasi Nomor Telepon (Hapus karakter non-digit)
    TARGET_NUMBER = TARGET_NUMBER.replace(/[^0-9]/g, '');
    if (TARGET_NUMBER.startsWith('0')) {
      TARGET_NUMBER = '62' + TARGET_NUMBER.slice(1);
    } else if (TARGET_NUMBER.startsWith('8')) {
      TARGET_NUMBER = '62' + TARGET_NUMBER;
    }

    let finalMessage = "";

    if (customMessage) {
      finalMessage = customMessage;
    } else {
      const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(Number(transaction_amount) || 0);

      finalMessage = `🚀 *TRANSAKSI BARU!*\n\n` +
                      `🏫 *Sekolah:* ${school_name || '-'}\n` +
                      `📄 *No PO:* ${po_number || '-'}\n` +
                      `💰 *Nominal:* ${formattedAmount}\n` +
                      `🔑 *Kode:* ${code || '-'}\n\n` +
                      `_Pesan otomatis dari Grand Line Manager_`;
    }

    console.log(`[send-whatsapp] Mengirim pesan ke: ${TARGET_NUMBER}`);

    // Menggunakan FormData untuk kompatibilitas API Fonnte yang lebih baik
    const formData = new FormData();
    formData.append('target', TARGET_NUMBER);
    formData.append('message', finalMessage);
    formData.append('delay', '2');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
      },
      body: formData,
    });

    const result = await response.json();
    console.log("[send-whatsapp] Respon dari Fonnte:", result);
    
    if (result.status === false) {
      throw new Error(result.reason || "Fonnte gagal mengirim pesan");
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[send-whatsapp] Error fatal:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})