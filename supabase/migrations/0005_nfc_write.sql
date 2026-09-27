-- 0005: NFC write support — extend tag status lifecycle for the artisan
-- write-to-card flow. New state `awaiting_write` = tag registered in DB
-- (system-generated ID) but not yet confirmed written to the physical card.
-- Also widens the column so system IDs (CM-XXXXXXXX) and raw UIDs coexist.
alter table products drop constraint if exists products_nfc_tag_status_check;
alter table products add constraint products_nfc_tag_status_check
  check (nfc_tag_status in ('active','inactive','lost','awaiting_write'));
