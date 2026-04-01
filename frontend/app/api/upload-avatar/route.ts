import { NextResponse } from "next/server"

import { withAuth } from "@/lib/auth/unifiedAuth"
import { supabaseAdmin } from "@/integrations/supabase/admin"

export const POST = withAuth(async ({ user, request }) => {
  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 })
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are supported" }, { status: 400 })
  }

  const maxBytes = 5 * 1024 * 1024
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() || "png"
  const path = `${user.id}/${Date.now()}.${ext}`

  const upload = await supabaseAdmin.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type })

  if (upload.error) {
    return NextResponse.json({ error: upload.error.message }, { status: 500 })
  }

  const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl, path })
}, { requireAuth: true, allowBearerToken: true, allowCookies: true })

