ALTER TABLE "invoice" ADD COLUMN "source_folder_id" integer;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_source_folder_id_source_folder_id_fk" FOREIGN KEY ("source_folder_id") REFERENCES "public"."source_folder"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_number_unique" UNIQUE("invoice_number");