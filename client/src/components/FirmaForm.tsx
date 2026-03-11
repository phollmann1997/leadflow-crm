import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { OBOR_LABELS, ZDROJ_LABELS, PIPELINE_LABELS } from "@shared/schema";
import type { Firma } from "@shared/schema";

const formSchema = z.object({
  nazev: z.string().min(1, "Název je povinný"),
  ico: z.string().optional(),
  web: z.string().optional(),
  obor: z.string().default("jine"),
  pocetZamestnancu: z.string().optional(),
  ppisPodnikani: z.string().optional(),
  adresa: z.string().optional(),
  poznamky: z.string().optional(),
  zdroj: z.string().default("jine"),
  stav: z.string().default("novy"),
  hodnotaDealu: z.number().min(0).default(0),
  tagy: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  defaultValues?: Partial<Firma>;
  onSubmit: (data: FormData) => void;
  isPending?: boolean;
  submitLabel?: string;
}

export default function FirmaForm({ defaultValues, onSubmit, isPending, submitLabel = "Uložit" }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nazev: defaultValues?.nazev ?? "",
      ico: defaultValues?.ico ?? "",
      web: defaultValues?.web ?? "",
      obor: defaultValues?.obor ?? "jine",
      pocetZamestnancu: defaultValues?.pocetZamestnancu ?? "",
      ppisPodnikani: defaultValues?.ppisPodnikani ?? "",
      adresa: defaultValues?.adresa ?? "",
      poznamky: defaultValues?.poznamky ?? "",
      zdroj: defaultValues?.zdroj ?? "jine",
      stav: defaultValues?.stav ?? "novy",
      hodnotaDealu: defaultValues?.hodnotaDealu ?? 0,
      tagy: defaultValues?.tagy ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="nazev" render={({ field }) => (
            <FormItem><FormLabel>Název firmy *</FormLabel><FormControl><Input data-testid="input-nazev" placeholder="Firma s.r.o." {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="ico" render={({ field }) => (
            <FormItem><FormLabel>IČO</FormLabel><FormControl><Input data-testid="input-ico" placeholder="12345678" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="web" render={({ field }) => (
            <FormItem><FormLabel>Web</FormLabel><FormControl><Input placeholder="https://firma.cz" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="adresa" render={({ field }) => (
            <FormItem><FormLabel>Adresa / Město</FormLabel><FormControl><Input placeholder="Praha" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField control={form.control} name="obor" render={({ field }) => (
            <FormItem><FormLabel>Obor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{Object.entries(OBOR_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="zdroj" render={({ field }) => (
            <FormItem><FormLabel>Zdroj</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{Object.entries(ZDROJ_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="stav" render={({ field }) => (
            <FormItem><FormLabel>Stav</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{Object.entries(PIPELINE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="pocetZamestnancu" render={({ field }) => (
            <FormItem><FormLabel>Počet zaměstnanců (odhad)</FormLabel><FormControl><Input placeholder="5-10" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="hodnotaDealu" render={({ field }) => (
            <FormItem><FormLabel>Odhadovaná hodnota (CZK/měs.)</FormLabel><FormControl>
              <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
            </FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="ppisPodnikani" render={({ field }) => (
          <FormItem><FormLabel>Popis podnikání</FormLabel><FormControl>
            <Textarea placeholder="Čím se firma zabývá, kolik dokumentů zpracovávají..." rows={2} {...field} />
          </FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="tagy" render={({ field }) => (
          <FormItem><FormLabel>Tagy (čárkou)</FormLabel><FormControl><Input placeholder="faktoring, praha, aktivní" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="poznamky" render={({ field }) => (
          <FormItem><FormLabel>Interní poznámky</FormLabel><FormControl>
            <Textarea placeholder="Poznámky pro sebe..." rows={2} {...field} />
          </FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>{isPending ? "Ukládám..." : submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}
