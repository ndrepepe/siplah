// @ts-ignore: Deno imports are not recognized by standard TS compiler
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

// Declare Deno for the compiler
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { school_name, po_number, transaction_amount, code } = await req.json()

    // Ambil API Key dan Nomor Tujuan dari Secrets Supabase
    const FONNTE_TOKEN = Deno.env.get('WHATSAPP_API_KEY')
    const TARGET_NUMBER = Deno.env.get('WHATSAPP_TARGET_NUMBER')

    if (!FONNTE_TOKEN || !TARGET_NUMBER) {
      console.error("[send-whatsapp] Error: WHATSAPP_API_KEY atau WHATSAPP_TARGET_NUMBER belum diatur.")
      return new Response(JSON.stringify({ error: 'Konfigurasi WhatsApp belum lengkap' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const message = `🚀 *TRANSAKSI BARU!*\n\n` +
                    `🏫 Sekolah: ${school_name}\n` +
                    `📄 No PO: ${po_number}\n` +
                    `💰 Nominal: Rp ${new Intl.NumberFormat('id-ID').format(transaction_amount)}\n` +
                    `🔑 Kode: *${code}*\n\n` +
                    `Sistem Grand Line Manager`;

    console.log(`[send-whatsapp] Mengirim pesan ke ${TARGET_NUMBER}...`)

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
      },
      body: new URLSearchParams({
        'target': TARGET_NUMBER,
        'message': message,
        'countryCode': '62',
      }),
    })

    const result = await response.json()
    console.log("[send-whatsapp] Respon Fonnte:", result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[send-whatsapp] Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})