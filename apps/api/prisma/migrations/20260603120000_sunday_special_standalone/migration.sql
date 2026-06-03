-- Standalone Sunday Special: a Sunday Special is now authored as its own dish
-- (name/description/photo/variants) backed by a hidden menu item, and can be
-- force-enabled on any day.

-- Hidden backing menu items never show in the regular menu.
ALTER TABLE "menu_items"
  ADD COLUMN "is_sunday_special_only" BOOLEAN NOT NULL DEFAULT false;

-- Override flag: make a special orderable on any day, not just its Sunday.
ALTER TABLE "sunday_specials"
  ADD COLUMN "available_any_day" BOOLEAN NOT NULL DEFAULT false;
