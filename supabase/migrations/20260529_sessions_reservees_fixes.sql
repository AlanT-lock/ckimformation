-- Fix C2: ensure session_document_uploads INSERT requires request to belong to the session
drop policy if exists "sdu insert etab" on public.session_document_uploads;
create policy "sdu insert etab" on public.session_document_uploads
  for insert to authenticated
  with check (
    exists (
      select 1 from public.sessions s
      where s.id = session_document_uploads.session_id
        and s.reserved_company_id = auth.uid()
    )
    and uploaded_by = auth.uid()
    and exists (
      select 1 from public.session_document_requests r
      where r.id = session_document_uploads.request_id
        and r.session_id = session_document_uploads.session_id
    )
  );
