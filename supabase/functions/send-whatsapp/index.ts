// @ts-ignore: Deno imports are not recognized by standard TS compiler
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[^0-9]/g, '');
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.slice(1);
  } else if (normalized.startsWith('8')) {
    normalized = '62' + normalized;
  }
  return normalized;
}

async function sendMessage(token: string, target: string, message: string): Promise<any> {
  const formData = new FormData();
  formData.append('target', normalizePhone(target));
  formData.append('message', message);
  formData.append('delay', '2');

  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { 'Authorization': token },
    body: formData,
  });

  const result = await response.json();
  if (result.status === false) {
    throw new Error(result.reason || "Fonnte gagal mengirim pesan");
  }
  return result;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json();
    const { school_name, po_number, transaction_amount, code, message: customMessage, target_number } = body;

    // @ts-ignore: Deno is available in the runtime
    const FONNTE_TOKEN = Deno.env.get('WHATSAPP_API_KEY')?.trim();
    // @ts-ignore: Deno is available in the runtime
    let DEFAULT_TARGET = Deno.env.get('WHATSAPP_TARGET_NUMBER')?.trim();

    if (!FONNTE_TOKEN) {
      console.error("[send-whatsapp] WHATSAPP_API_KEY tidak ditemukan.");
      return new Response(
        JSON.stringify({ error: 'Konfigurasi API Key belum diatur di Supabase Secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gunakan target_number dari parameter, atau fallback ke default dari secrets
    let TARGET_NUMBER = target_number || DEFAULT_TARGET;

    if (!TARGET_NUMBER) {
      console.error("[send-whatsapp] Nomor tujuan tidak ditemukan.");
      return new Response(
        JSON.stringify({ error: 'Nomor tujuan tidak tersedia' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

      finalMessage = `🚀 *TRANSAKSI BARU!*\n\n`
        + `🏫 *Sekolah:* ${school_name || '-'}\n`
        + `📄 *No PO:* ${po_number || '-'}\n`
        + `💰 *Nominal:* ${formattedAmount}\n`
        + `🔑 *Kode:* ${code || '-'}\n\n`
        + `_Pesan otomatis dari Grand Line Manager_`;
    }

    console.log(`[send-whatsapp] Mengirim ke: ${TARGET_NUMBER}`);

    const result = await sendMessage(FONNTE_TOKEN, TARGET_NUMBER, finalMessage);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("[send-whatsapp] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})